import json
import logging
from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction, models
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from bookings.models import Booking
from notifications.tasks import send_payment_confirmation_task, send_sms_task, notify_admins_bank_payment_task
from .models import Payment, TransactionLog
from .serializers import (
    PaymentSerializer, 
    PaymentCreateSerializer,
    PaymentUpdateSerializer,
    MpesaSTKPushSerializer,
    BankTransferSerializer
)
from .intasend_service import IntasendService
from .tasks import process_intasend_callback_task
from .utils import format_phone_number
from users.admin_panel.services import log_system_action

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling payment operations.
    Supports: Mobile Money, Card Payments, Bank Transfers via Intasend.
    """
    queryset = Payment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.
        """
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action == 'partial_update':
            return PaymentUpdateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on user role.
        Customers see their own payments.
        Drivers see payments for bookings they handle.
        Admins see all payments.
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'customer':
            queryset = queryset.filter(booking__customer=user)
        elif user.role == 'driver':
            queryset = queryset.filter(booking__driver=user)
        
        # Simple filtering for all roles
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create a new payment record.
        This endpoint is for manual payment recording (admin use).
        For customer payments, use 'initiate_payment' action.
        """
        if request.user.role not in ['admin', 'staff']:
            return Response(
                {'detail': 'Only admins can manually create payments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        
        return Response(
            self.get_serializer(payment).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def initiate_payment(self, request):
        """
        Initiate an Intasend payment for a booking.
        Supports: Mobile Money, Card, Bank Transfer.
        """
        booking_id = request.data.get('booking_id')
        payment_method = request.data.get('payment_method', 'mobile_money')  # mobile_money, card, bank_transfer
        phone_number = request.data.get('phone_number')
        email = request.data.get('email', '')
        
        if not booking_id:
            return Response(
                {'detail': 'booking_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Get booking
                booking = Booking.objects.select_for_update().get(
                    id=booking_id,
                    customer=request.user
                )
                
                # Validate booking can be paid
                if booking.status == 'cancelled':
                    return Response(
                        {'detail': 'Cannot pay for a cancelled booking.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if payment already exists and is paid
                existing_payment = getattr(booking, 'payment', None)
                if existing_payment and existing_payment.status == 'paid':
                    return Response(
                        {'detail': 'Booking already has a paid payment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get amount from booking
                amount = booking.estimated_price
                if amount <= 0:
                    return Response(
                        {'detail': 'Invalid booking amount.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Format phone number
                if phone_number:
                    formatted_phone = format_phone_number(phone_number)
                else:
                    formatted_phone = format_phone_number(request.user.phone_number) if hasattr(request.user, 'phone_number') else ""
                
                if not formatted_phone:
                    return Response(
                        {'detail': 'Valid phone number is required.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Use user email if not provided
                if not email:
                    email = request.user.email
                
                # Initiate Intasend payment
                intasend_service = IntasendService()
                try:
                    response = intasend_service.create_checkout_link(
                        amount=str(amount),
                        phone_number=formatted_phone,
                        email=email,
                        booking_id=booking.id,
                        first_name=request.user.first_name,
                        last_name=request.user.last_name
                    )
                except Exception as e:
                    logger.error(f"Intasend checkout link creation failed: {str(e)}")
                    return Response(
                        {
                            'detail': 'Failed to create checkout link with Intasend.',
                            'error': str(e)
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create or update payment record
                payment_data = {
                    'booking': booking,
                    'amount': amount,
                    'status': 'pending',
                    'payment_method': payment_method,
                    'payment_provider': 'intasend',
                    'intasend_api_ref': response.get('api_ref'),
                    'invoice_id': response.get('invoice_id')
                }
                
                if existing_payment:
                    # Update existing pending payment
                    for key, value in payment_data.items():
                        setattr(existing_payment, key, value)
                    existing_payment.save()
                    payment = existing_payment
                else:
                    # Create new payment
                    payment = Payment.objects.create(**payment_data)
                
                # Log the transaction
                TransactionLog.objects.create(
                    payment=payment,
                    action='intasend_checkout_link_created',
                    data=response,
                    status='success'
                )
                
                # Update booking status
                if booking.status == 'pending':
                    booking.status = 'payment_pending'
                    booking.save()
                
                # Handle mock mode - auto-complete payment
                if response.get('mock_mode'):
                    payment.status = 'paid'
                    payment.save()
                    booking.status = 'accepted'
                    booking.save()
                    
                    # Log payment received
                    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                    log_system_action(
                        action='payment_received',
                        user=request.user,
                        details={
                            'payment_id': payment.id,
                            'booking_id': booking.id,
                            'amount': float(amount),
                            'payment_method': payment_method,
                            'mock_mode': True
                        },
                        ip_address=ip_address
                    )
                    
                    # Log the mock payment completion
                    TransactionLog.objects.create(
                        payment=payment,
                        action='mock_payment_completed',
                        data=response,
                        status='success'
                    )
                    
                    return Response({
                        'success': True,
                        'message': 'Mock payment completed successfully (Intasend unavailable).',
                        'payment_id': payment.id,
                        'checkout_url': None,
                        'api_ref': response.get('api_ref'),
                        'booking_status': booking.status,
                        'mock_mode': True
                    }, status=status.HTTP_200_OK)
                
                return Response({
                    'success': True,
                    'message': 'Payment checkout link created successfully.',
                    'payment_id': payment.id,
                    'checkout_url': response.get('checkout_link'),
                    'api_ref': response.get('api_ref'),
                    'booking_status': booking.status
                }, status=status.HTTP_200_OK)
                
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found or access denied.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Payment initiation error: {str(e)}")
            return Response(
                {'detail': 'An error occurred while processing your payment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def initiate_bank_transfer(self, request):
        """
        Initiate a manual bank transfer payment via Intasend.
        The user provides bank details, and Intasend handles the transfer.
        """
        booking_id = request.data.get('booking_id')
        
        if not booking_id:
            return Response(
                {'detail': 'booking_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().get(
                    id=booking_id,
                    customer=request.user
                )

                if booking.status == 'cancelled':
                    return Response(
                        {'detail': 'Cannot pay for a cancelled booking.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                existing_payment = getattr(booking, 'payment', None)
                if existing_payment and existing_payment.status == 'paid':
                    return Response(
                        {'detail': 'Booking already has a paid payment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create checkout link for bank transfer
                intasend_service = IntasendService()
                email = request.user.email
                phone_number = format_phone_number(request.user.phone_number) if hasattr(request.user, 'phone_number') else ""
                
                try:
                    response = intasend_service.create_checkout_link(
                        amount=str(booking.estimated_price),
                        phone_number=phone_number,
                        email=email,
                        booking_id=booking.id,
                        first_name=request.user.first_name,
                        last_name=request.user.last_name
                    )
                except Exception as e:
                    logger.error(f"Intasend bank transfer link creation failed: {str(e)}")
                    return Response(
                        {'detail': 'Failed to create bank transfer link.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                payment_data = {
                    'booking': booking,
                    'amount': booking.estimated_price,
                    'status': 'pending',
                    'payment_method': 'bank_transfer',
                    'payment_provider': 'intasend',
                    'intasend_api_ref': response.get('api_ref'),
                    'invoice_id': response.get('invoice_id')
                }

                if existing_payment:
                    for key, value in payment_data.items():
                        setattr(existing_payment, key, value)
                    existing_payment.save()
                    payment = existing_payment
                else:
                    payment = Payment.objects.create(**payment_data)

                # Update booking status
                if booking.status == 'pending':
                    booking.status = 'payment_pending'
                    booking.save()

                # Log the initiation
                TransactionLog.objects.create(
                    payment=payment,
                    action='bank_transfer_initiated',
                    data=response,
                    status='success'
                )

                return Response({
                    'success': True,
                    'message': 'Bank transfer checkout link created. Please complete payment.',
                    'payment_id': payment.id,
                    'checkout_url': response.get('checkout_link')
                }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Bank transfer initiation error: {str(e)}")
            return Response(
                {'detail': 'An error occurred while processing your bank transfer request.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def initiate_cash_payment(self, request):
        """
        Initiate a cash payment for a booking.
        """
        booking_id = request.data.get('booking_id')
        notes = request.data.get('notes', '')
        
        if not booking_id:
            return Response(
                {'detail': 'booking_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Get booking
                booking = Booking.objects.select_for_update().get(
                    id=booking_id,
                    customer=request.user
                )
                
                # Validate booking can be paid
                if booking.status == 'cancelled':
                    return Response(
                        {'detail': 'Cannot pay for a cancelled booking.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if payment already exists and is paid
                existing_payment = getattr(booking, 'payment', None)
                if existing_payment and existing_payment.status == 'paid':
                    return Response(
                        {'detail': 'Booking already has a paid payment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get amount from booking
                amount = booking.estimated_price
                if amount <= 0:
                    return Response(
                        {'detail': 'Invalid booking amount.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create or update payment record for cash
                payment_data = {
                    'booking': booking,
                    'amount': amount,
                    'status': 'pending',
                    'payment_method': 'cash',
                    'payment_provider': 'intasend',
                    'notes': notes
                }
                
                if existing_payment:
                    # Update existing pending payment
                    for key, value in payment_data.items():
                        setattr(existing_payment, key, value)
                    existing_payment.save()
                    payment = existing_payment
                else:
                    # Create new payment
                    payment = Payment.objects.create(**payment_data)
                
                # Log the transaction
                TransactionLog.objects.create(
                    payment=payment,
                    action='cash_payment_initiated',
                    data={'notes': notes},
                    status='success'
                )
                
                # Update booking status
                if booking.status == 'pending':
                    booking.status = 'payment_pending'
                    booking.save()
                
                return Response({
                    'success': True,
                    'message': 'Cash payment recorded. Driver will collect payment upon service completion.',
                    'payment_id': payment.id
                }, status=status.HTTP_200_OK)
        
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Cash payment initiation error: {str(e)}")
            return Response(
                {'detail': 'An error occurred while processing your cash payment request.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def manual_verify(self, request):
        """
        Manually verify a pending payment from the admin payments screen.
        """
        if request.user.role not in ['admin', 'staff']:
            return Response(
                {'detail': 'Only admins can verify payments.'},
                status=status.HTTP_403_FORBIDDEN
            )

        payment_id = request.data.get('payment_id')
        if not payment_id:
            return Response(
                {'detail': 'payment_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                payment = Payment.objects.select_for_update().select_related('booking').get(id=payment_id)

                if payment.status == 'paid':
                    return Response(
                        {
                            'success': True,
                            'message': 'Payment is already verified.',
                            'payment': self.get_serializer(payment).data,
                        },
                        status=status.HTTP_200_OK
                    )

                if payment.status not in ['pending', 'processing']:
                    return Response(
                        {'detail': f'Cannot verify a {payment.status} payment.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if payment.payment_method not in ['bank_transfer', 'cash']:
                    return Response(
                        {'detail': 'Only bank transfer and cash payments can be manually verified.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                payment.status = 'paid'
                payment.verified_by = request.user
                payment.verified_at = timezone.now()
                payment.save(update_fields=['status', 'verified_by', 'verified_at', 'paid_at', 'updated_at'])

                booking = payment.booking
                if booking and booking.status in ['pending', 'payment_pending', 'searching_driver']:
                    booking.status = 'accepted'
                    booking.save(update_fields=['status', 'updated_at'])

                ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                TransactionLog.objects.create(
                    payment=payment,
                    action='manual_payment_verified',
                    data={
                        'verified_by': request.user.id,
                        'booking_id': booking.id if booking else None,
                        'amount': float(payment.amount),
                        'payment_method': payment.payment_method,
                        'reference': payment.intasend_api_ref or payment.bank_reference,
                    },
                    status='success',
                    ip_address=ip_address,
                    user_agent=user_agent,
                )

                log_system_action(
                    action='payment_verified',
                    user=request.user,
                    details={
                        'payment_id': payment.id,
                        'booking_id': booking.id if booking else None,
                        'amount': float(payment.amount),
                        'payment_method': payment.payment_method,
                    },
                    ip_address=ip_address
                )

            try:
                send_payment_confirmation_task.delay(payment.id)
            except Exception as e:
                logger.warning(f"Could not queue payment confirmation for payment {payment.id}: {str(e)}")

            return Response({
                'success': True,
                'message': 'Payment verified successfully.',
                'payment': self.get_serializer(payment).data,
            }, status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            return Response(
                {'detail': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Manual payment verification failed: {str(e)}")
            return Response(
                {'detail': 'Failed to verify payment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def retry_payment(self, request, pk=None):
        """
        Retry a failed payment.
        """
        payment = self.get_object()
        
        # Validate payment can be retried
        if payment.status not in ['failed', 'cancelled']:
            return Response(
                {'detail': f'Cannot retry a {payment.status} payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if payment.payment_method == 'cash':
            return Response(
                {'detail': 'Cannot retry cash payments through this endpoint.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user owns the booking
        if payment.booking.customer != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'detail': 'You can only retry your own payments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.user.email
        phone_number = request.data.get('phone_number')
        if phone_number:
            phone_number = format_phone_number(phone_number)
        else:
            phone_number = format_phone_number(request.user.phone_number) if hasattr(request.user, 'phone_number') else ""
        
        try:
            # Retry Intasend payment
            intasend_service = IntasendService()
            response = intasend_service.create_checkout_link(
                amount=str(payment.amount),
                phone_number=phone_number,
                email=email,
                booking_id=payment.booking.id,
                first_name=request.user.first_name,
                last_name=request.user.last_name
            )
            
            # Update payment with new API ref
            payment.intasend_api_ref = response.get('api_ref')
            payment.invoice_id = response.get('invoice_id')
            payment.status = 'pending'
            payment.save()
            
            # Log the retry
            TransactionLog.objects.create(
                payment=payment,
                action='payment_retry',
                data=response,
                status='success'
            )
            
            return Response({
                'success': True,
                'message': 'Payment retry initiated successfully.',
                'checkout_url': response.get('checkout_link'),
                'api_ref': response.get('api_ref')
            })
            
        except Exception as e:
            logger.error(f"Payment retry failed: {str(e)}")
            return Response(
                {'detail': 'Failed to retry payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel_payment(self, request, pk=None):
        """
        Cancel a pending payment.
        """
        payment = self.get_object()
        
        if payment.status != 'pending':
            return Response(
                {'detail': f'Cannot cancel a {payment.status} payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check permissions
        if payment.booking.customer != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'detail': 'You can only cancel your own payments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment.status = 'cancelled'
        payment.cancelled_at = datetime.now()
        payment.cancelled_by = request.user
        payment.save()
        
        # Log the cancellation
        TransactionLog.objects.create(
            payment=payment,
            action='payment_cancelled',
            data={'cancelled_by': request.user.id},
            status='success'
        )
        
        return Response({
            'success': True,
            'message': 'Payment cancelled successfully.'
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_payments(self, request):
        """
        Get payments for the current user.
        """
        payments = self.get_queryset()
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            payments = payments.filter(status=status_filter)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            payments = payments.filter(created_at__gte=date_from)
        if date_to:
            payments = payments.filter(created_at__lte=date_to)
        
        page = self.paginate_queryset(payments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get payment status with proactive Intasend query fallback."""
        payment = self.get_object()
        
        # If pending, try to query Intasend directly
        if payment.status == 'pending' and payment.intasend_api_ref:
            try:
                intasend_service = IntasendService()
                result = intasend_service.get_payment_status(payment.intasend_api_ref)
                
                state = result.get('state', 'PENDING')
                
                if state == 'COMPLETE':
                    payment.status = 'paid'
                    payment.save()
                    # Update booking
                    booking = payment.booking
                    if booking.status in ['pending', 'payment_pending']:
                        booking.status = 'accepted'
                        booking.save()
                    # Send confirmation
                    send_payment_confirmation_task.delay(payment.id)
                    
                    # Log successful payment
                    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                    log_system_action(
                        action='payment_received',
                        user=payment.booking.customer if payment.booking else None,
                        details={
                            'payment_id': payment.id,
                            'booking_id': payment.booking.id if payment.booking else None,
                            'amount': float(payment.amount),
                            'payment_method': payment.payment_method,
                            'intasend_invoice_id': payment.intasend_invoice_id
                        },
                        ip_address=ip_address
                    )
                elif state == 'FAILED':
                    payment.status = 'failed'
                    payment.save()
                    
                    # Log failed payment
                    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
                    log_system_action(
                        action='payment_failed',
                        user=payment.booking.customer if payment.booking else None,
                        details={
                            'payment_id': payment.id,
                            'booking_id': payment.booking.id if payment.booking else None,
                            'amount': float(payment.amount),
                            'payment_method': payment.payment_method
                        },
                        ip_address=ip_address
                    )
            except Exception as e:
                logger.error(f"Error checking status for payment {payment.id}: {str(e)}")

        return Response({
            'id': payment.id,
            'status': payment.status,
            'amount': payment.amount,
            'booking_id': payment.booking.id,
            'booking_status': payment.booking.status,
            'api_ref': payment.intasend_api_ref,
            'payment_method': payment.payment_method
        })

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate thermal printer style HTML receipt for the payment."""
        from django.http import HttpResponse
        payment = self.get_object()
        
        if payment.status != 'paid':
            return HttpResponse("Receipt is only available for paid payments.", status=400)
            
        booking = payment.booking
        paid_date = payment.updated_at.strftime("%d/%m/%Y | %H:%M:%S")

        # Customer and booking details
        customer = booking.customer
        customer_name = f"{customer.first_name} {customer.last_name}".strip() or customer.username
        customer_phone = customer.phone_number or 'N/A'
        customer_email = customer.email or 'N/A'
        booking_address = booking.address or booking.location_name or 'N/A'
        scheduled_date = booking.scheduled_date.strftime("%d/%m/%Y %H:%M") if booking.scheduled_date else 'ASAP'
        service_type = booking.get_service_type_display().upper() if hasattr(booking, 'get_service_type_display') else booking.service_type.replace('_', ' ').upper()
        tank_size = booking.get_tank_size_display() if hasattr(booking, 'get_tank_size_display') else getattr(booking, 'tank_size', 'N/A')
        payment_method_display = payment.get_payment_method_display().upper() if hasattr(payment, 'get_payment_method_display') else payment.payment_method.upper()
        transaction_id = payment.intasend_api_ref or f"PAY-{payment.id}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - UsafiLink #{payment.id}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ 
                    font-family: 'Courier New', monospace; 
                    background-color: #f5f5f5; 
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                }}
                .thermal-receipt {{
                    background: white;
                    width: 100%;
                    max-width: 400px;
                    padding: 30px 20px;
                    border: 1px solid #ddd;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    font-size: 13px;
                    line-height: 1.6;
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px dashed #000;
                }}
                .company-name {{
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin-bottom: 8px;
                }}
                .datetime {{
                    font-size: 12px;
                    margin-bottom: 5px;
                }}
                .divider {{
                    text-align: center;
                    margin: 12px 0;
                    color: #666;
                    font-size: 11px;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    font-size: 12px;
                }}
                .info-label {{
                    font-weight: bold;
                    min-width: 60px;
                }}
                .info-value {{
                    text-align: right;
                    flex: 1;
                    padding-left: 10px;
                }}
                .items-table {{
                    margin: 15px 0;
                    width: 100%;
                    font-size: 12px;
                }}
                .table-header {{
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 8px;
                    padding: 8px 0;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                    font-weight: bold;
                    margin-bottom: 8px;
                }}
                .table-row {{
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 8px;
                    padding: 6px 0;
                }}
                .table-col {{
                    text-align: right;
                }}
                .table-col.left {{
                    text-align: left;
                }}
                .total-section {{
                    margin: 15px 0;
                    padding: 10px 0;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                }}
                .total-row {{
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }}
                .payment-method {{
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    padding: 8px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 15px;
                    font-size: 12px;
                    line-height: 1.8;
                }}
                .thank-you {{
                    font-weight: bold;
                    margin-bottom: 15px;
                }}
                .buttons {{
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    justify-content: center;
                }}
                .btn {{
                    padding: 10px 30px;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: Arial, sans-serif;
                }}
                .btn-print {{
                    background-color: #10b981;
                    color: white;
                }}
                .btn-print:hover {{
                    background-color: #059669;
                }}
                .btn-close {{
                    background-color: #ef4444;
                    color: white;
                }}
                .btn-close:hover {{
                    background-color: #dc2626;
                }}
            </style>
        </head>
        <body>
            <div class="thermal-receipt">
                <!-- Header -->
                <div class="header">
                    <div class="company-name">USAFILINK</div>
                    <div class="datetime">{paid_date}</div>
                </div>

                <!-- Receipt Info -->
                <div class="divider">.................................</div>
                <div class="info-row">
                    <div class="info-label">Receipt #:</div>
                    <div class="info-value">{payment.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date:</div>
                    <div class="info-value">{paid_date}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Customer:</div>
                    <div class="info-value">{customer_name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">{customer_phone}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">{customer_email}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Booking ID:</div>
                    <div class="info-value">{booking.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Location:</div>
                    <div class="info-value">{booking_address}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Schedule:</div>
                    <div class="info-value">{scheduled_date}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Service:</div>
                    <div class="info-value">{service_type}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Tank Size:</div>
                    <div class="info-value">{tank_size}</div>
                </div>

                <!-- Separator -->
                <div class="divider">.................................</div>

                <!-- Items Table -->
                <div class="items-table">
                    <div class="table-header">
                        <div class="table-col left">Item</div>
                        <div class="table-col">Qty</div>
                        <div class="table-col">Price</div>
                        <div class="table-col">Total</div>
                    </div>
                    <div class="table-row">
                        <div class="table-col left">{service_type} / {tank_size}</div>
                        <div class="table-col">1</div>
                        <div class="table-col">KES {payment.amount:,.2f}</div>
                        <div class="table-col">KES {payment.amount:,.2f}</div>
                    </div>
                </div>

                <!-- Total Section -->
                <div class="divider">.................................</div>
                <div class="total-section">
                    <div class="total-row">
                        <span>TOTAL:</span>
                        <span>KES {payment.amount:,.2f}</span>
                    </div>
                    <div class="payment-method">
                        <span>Payment:</span>
                        <span>{payment_method_display}</span>
                    </div>
                </div>

                <!-- Separator -->
                <div class="divider">.................................</div>

                <!-- Footer -->
                <div class="footer">
                    <div class="thank-you">Thank you! Come again 🔥</div>
                    <div>Transaction ID: {transaction_id}</div>
                </div>

                <!-- Buttons -->
                <div class="buttons">
                    <button class="btn btn-print" onclick="window.print()">🖨 PRINT</button>
                    <button class="btn btn-close" onclick="window.close()">✕ CLOSE</button>
                </div>
            </div>

            <script>
                // Auto-print on page load (optional)
                // window.print();
            </script>
        </body>
        </html>
        """
        
        return HttpResponse(html_content, content_type="text/html")


@method_decorator(csrf_exempt, name='dispatch')
class IntasendCallbackView(APIView):
    """
    Handle Intasend payment webhook callbacks.
    This endpoint receives payment status updates from Intasend.
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        """
        Process Intasend callback.
        """
        try:
            # Parse request data
            if isinstance(request.data, dict):
                callback_data = request.data
            else:
                callback_data = json.loads(request.body.decode('utf-8'))
            
            logger.info(f"Intasend Callback received: {json.dumps(callback_data, indent=2)}")
            
            # Log the callback for debugging
            TransactionLog.objects.create(
                payment=None,
                action='intasend_callback_received',
                data=callback_data,
                status='processing'
            )
            
            # Validate callback
            intasend_service = IntasendService()
            if not intasend_service.validate_callback(callback_data):
                logger.warning(f"Invalid Intasend callback: {callback_data}")
                return Response({
                    "status": "error",
                    "message": "Invalid callback"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process callback
            if settings.DEBUG:
                # Run synchronously for easier local testing/debugging
                logger.info("Processing callback synchronously (DEBUG=True)")
                process_intasend_callback_task(json.dumps(callback_data))
            else:
                # Process callback asynchronously using Celery (Production)
                process_intasend_callback_task.delay(json.dumps(callback_data))
            
            # Immediate response to Intasend (they expect this quickly)
            return Response({
                "status": "success",
                "message": "Callback received"
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Intasend callback: {str(e)}")
            return Response({
                "status": "error",
                "message": "Invalid JSON"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error processing Intasend callback: {str(e)}")
            return Response({
                "status": "error",
                "message": "Internal server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentWebhookView(APIView):
    """
    Generic webhook endpoint for payment status updates.
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        """
        Handle generic payment webhooks.
        """
        provider = kwargs.get('provider', 'unknown')
        
        # Log the webhook
        TransactionLog.objects.create(
            payment=None,
            action=f'{provider}_webhook_received',
            data=request.data,
            status='received'
        )
        
        # Here you would implement provider-specific logic
        # For now, just acknowledge receipt
        return Response({'status': 'received'}, status=status.HTTP_200_OK)


class PaymentReportView(APIView):
    """
    Generate payment reports (admin only).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get payment statistics and reports."""
        if request.user.role not in ['admin', 'staff']:
            return Response(
                {'detail': 'Only admins can access payment reports.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Time period filter
        days = int(request.query_params.get('days', 30))
        start_date = datetime.now() - timedelta(days=days)
        
        payments = Payment.objects.filter(created_at__gte=start_date)
        
        # Calculate statistics
        total_amount = sum(p.amount for p in payments if p.status == 'paid')
        total_payments = payments.filter(status='paid').count()
        pending_payments = payments.filter(status='pending').count()
        failed_payments = payments.filter(status='failed').count()
        
        # Payment method breakdown
        payment_methods = {}
        for payment in payments.filter(status='paid'):
            method = payment.get_payment_method_display()
            payment_methods[method] = payment_methods.get(method, 0) + float(payment.amount)
        
        return Response({
            'period_days': days,
            'total_amount': float(total_amount),
            'total_payments': total_payments,
            'pending_payments': pending_payments,
            'failed_payments': failed_payments,
            'average_payment': float(total_amount / total_payments) if total_payments > 0 else 0,
            'payment_methods': payment_methods
        })
