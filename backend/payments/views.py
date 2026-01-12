import json
import logging
from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction, models
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from bookings.models import Booking
from notifications.tasks import send_payment_confirmation_task, send_sms_task
from .models import Payment, TransactionLog
from .serializers import (
    PaymentSerializer, 
    PaymentCreateSerializer,
    PaymentUpdateSerializer,
    MpesaSTKPushSerializer
)
from .mpesa_service import MpesaService
from .tasks import process_mpesa_callback_task
from .utils import format_phone_number, validate_mpesa_response

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling payment operations.
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
            return queryset.filter(booking__customer=user)
        elif user.role == 'driver':
            return queryset.filter(booking__driver=user)
        # Admin sees all
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
    def initiate_mpesa_payment(self, request):
        """
        Initiate M-PESA STK Push payment for a booking.
        """
        serializer = MpesaSTKPushSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_id = serializer.validated_data['booking_id']
        phone_number = serializer.validated_data['phone_number']
        
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
                
                # Format phone number for M-PESA
                formatted_phone = format_phone_number(phone_number)
                
                # Get amount from booking
                amount = booking.estimated_price
                if amount <= 0:
                    return Response(
                        {'detail': 'Invalid booking amount.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Initiate M-PESA STK Push
                mpesa_service = MpesaService()
                try:
                    response = mpesa_service.stk_push(
                        phone_number=formatted_phone,
                        amount=str(amount),
                        account_reference=f"BK{booking.id:06d}",
                        transaction_desc=f"Exhauster Service Booking #{booking.id}"
                    )
                except Exception as e:
                    logger.error(f"M-PESA STK Push failed: {str(e)}")
                    return Response(
                        {
                            'detail': 'Failed to initiate payment with M-PESA.',
                            'error': str(e)
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate M-PESA response
                if not validate_mpesa_response(response):
                    return Response(
                        {
                            'detail': 'M-PESA returned an error.',
                            'mpesa_response': response
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create or update payment record
                payment_data = {
                    'booking': booking,
                    'amount': amount,
                    'status': 'pending',
                    'payment_method': 'mpesa',
                    'checkout_request_id': response.get('CheckoutRequestID'),
                    'merchant_request_id': response.get('MerchantRequestID')
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
                    action='stk_push_initiated',
                    data=response,
                    status='success'
                )
                
                # Update booking status
                if booking.status == 'pending':
                    booking.status = 'payment_pending'
                    booking.save()
                
                return Response({
                    'success': True,
                    'message': 'Payment initiated successfully. Please check your phone to complete the payment.',
                    'payment_id': payment.id,
                    'checkout_request_id': response.get('CheckoutRequestID'),
                    'merchant_request_id': response.get('MerchantRequestID'),
                    'customer_message': response.get('CustomerMessage', ''),
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
        
        if payment.payment_method != 'mpesa':
            return Response(
                {'detail': 'Only M-PESA payments can be retried.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user owns the booking
        if payment.booking.customer != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'detail': 'You can only retry your own payments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MpesaSTKPushSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        formatted_phone = format_phone_number(phone_number)
        
        try:
            # Retry M-PESA STK Push
            mpesa_service = MpesaService()
            response = mpesa_service.stk_push(
                phone_number=formatted_phone,
                amount=str(payment.amount),
                account_reference=f"BK{payment.booking.id:06d}",
                transaction_desc=f"Retry Payment for Booking #{payment.booking.id}"
            )
            
            # Update payment with new request IDs
            payment.checkout_request_id = response.get('CheckoutRequestID')
            payment.merchant_request_id = response.get('MerchantRequestID')
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
                'checkout_request_id': response.get('CheckoutRequestID'),
                'customer_message': response.get('CustomerMessage', '')
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
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def payment_status(self, request, pk=None):
        """
        Check the status of a specific payment.
        """
        payment = self.get_object()
        
        # If payment is pending, we can query M-PESA for status
        if payment.status == 'pending' and payment.checkout_request_id:
            try:
                mpesa_service = MpesaService()
                status_response = mpesa_service.query_stk_status(payment.checkout_request_id)
                
                # Update payment based on query response
                if status_response.get('ResultCode') == '0':
                    # Payment completed, update our record
                    # Note: This should ideally come from callback, but query is fallback
                    pass
                
                return Response({
                    'payment': self.get_serializer(payment).data,
                    'mpesa_status': status_response
                })
                
            except Exception as e:
                logger.error(f"Error querying payment status: {str(e)}")
                # Continue to return current status even if query fails
        
        return Response(self.get_serializer(payment).data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def manual_verify(self, request):
        """
        Admin endpoint to manually verify a payment.
        Useful for cash payments or resolving issues.
        """
        payment_id = request.data.get('payment_id')
        mpesa_receipt = request.data.get('mpesa_receipt')
        
        try:
            payment = Payment.objects.get(id=payment_id)
            
            if payment.status == 'paid':
                return Response(
                    {'detail': 'Payment is already marked as paid.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                payment.mpesa_receipt = mpesa_receipt or payment.mpesa_receipt
                payment.status = 'paid'
                payment.verified_by = request.user
                payment.verified_at = datetime.now()
                payment.save()
                
                # Update booking
                booking = payment.booking
                if booking.status in ['pending', 'payment_pending']:
                    booking.status = 'accepted'
                    booking.save()
                
                # Send confirmation
                send_payment_confirmation_task.delay(payment.id)
                
                # Log the manual verification
                TransactionLog.objects.create(
                    payment=payment,
                    action='manual_verification',
                    data={'verified_by': request.user.id},
                    status='success'
                )
                
                return Response({
                    'success': True,
                    'message': 'Payment manually verified.',
                    'payment': self.get_serializer(payment).data
                })
                
        except Payment.DoesNotExist:
            return Response(
                {'detail': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Manual verification error: {str(e)}")
            return Response(
                {'detail': 'Failed to verify payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackView(APIView):
    """
    Handle M-PESA STK Push callback.
    This endpoint receives callbacks from Safaricom.
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        """
        Process M-PESA callback.
        """
        try:
            # Parse request data
            if isinstance(request.data, dict):
                callback_data = request.data
            else:
                callback_data = json.loads(request.body.decode('utf-8'))
            
            logger.info(f"M-PESA Callback received: {json.dumps(callback_data, indent=2)}")
            
            # Log the callback for debugging
            TransactionLog.objects.create(
                payment=None,
                action='mpesa_callback_received',
                data=callback_data,
                status='processing'
            )
            
            # Process callback asynchronously using Celery
            process_mpesa_callback_task.delay(json.dumps(callback_data))
            
            # Immediate response to M-PESA (they expect this quickly)
            return Response({
                "ResultCode": 0,
                "ResultDesc": "Success"
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in M-PESA callback: {str(e)}")
            return Response({
                "ResultCode": 1,
                "ResultDesc": "Invalid JSON"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error processing M-PESA callback: {str(e)}")
            return Response({
                "ResultCode": 1,
                "ResultDesc": "Internal server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentWebhookView(APIView):
    """
    Generic webhook endpoint for other payment providers.
    Can be extended for PayPal, Stripe, etc.
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


@method_decorator(csrf_exempt, name='dispatch')
class MpesaC2BValidationView(APIView):
    """
    C2B Validation URL (optional - for direct payments without STK Push)
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        """
        Validate C2B payment.
        """
        data = request.data
        
        # Extract payment details
        transaction_type = data.get('TransactionType')
        trans_id = data.get('TransID')
        trans_time = data.get('TransTime')
        trans_amount = data.get('TransAmount')
        business_short_code = data.get('BusinessShortCode')
        bill_ref_number = data.get('BillRefNumber')
        invoice_number = data.get('InvoiceNumber')
        org_account_balance = data.get('OrgAccountBalance')
        third_party_trans_id = data.get('ThirdPartyTransID')
        msisdn = data.get('MSISDN')
        first_name = data.get('FirstName')
        middle_name = data.get('MiddleName')
        last_name = data.get('LastName')
        
        # Log the validation request
        TransactionLog.objects.create(
            payment=None,
            action='c2b_validation',
            data=data,
            status='validating'
        )
        
        # Here you would validate the payment
        # For example, check if bill_ref_number matches a booking ID
        
        # Always accept validation (actual verification happens in confirmation)
        response = {
            "ResultCode": 0,
            "ResultDesc": "Accepted"
        }
        
        return Response(response, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class MpesaC2BConfirmationView(APIView):
    """
    C2B Confirmation URL (optional - for direct payments without STK Push)
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        """
        Confirm C2B payment.
        """
        data = request.data
        
        # Process confirmation asynchronously
        from .tasks import process_c2b_confirmation_task
        process_c2b_confirmation_task.delay(json.dumps(data))
        
        return Response({
            "ResultCode": 0,
            "ResultDesc": "Success"
        }, status=status.HTTP_200_OK)


class PaymentReportView(APIView):
    """
    Generate payment reports (admin only).
    """
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request, *args, **kwargs):
        """
        Generate payment report with filters.
        """
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        status = request.query_params.get('status')
        payment_method = request.query_params.get('payment_method')
        
        queryset = Payment.objects.all()
        
        # Apply filters
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if status:
            queryset = queryset.filter(status=status)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Aggregate data
        total_payments = queryset.count()
        total_amount = queryset.aggregate(models.Sum('amount'))['amount__sum'] or 0
        
        # Group by status
        status_summary = queryset.values('status').annotate(
            count=models.Count('id'),
            total=models.Sum('amount')
        )
        
        # Group by payment method
        method_summary = queryset.values('payment_method').annotate(
            count=models.Count('id'),
            total=models.Sum('amount')
        )
        
        # Daily summary (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        daily_summary = queryset.filter(
            created_at__gte=thirty_days_ago
        ).extra(
            {'date': "DATE(created_at)"}
        ).values('date').annotate(
            count=models.Count('id'),
            total=models.Sum('amount')
        ).order_by('date')
        
        return Response({
            'summary': {
                'total_payments': total_payments,
                'total_amount': float(total_amount),
                'date_from': date_from,
                'date_to': date_to
            },
            'status_summary': list(status_summary),
            'method_summary': list(method_summary),
            'daily_summary': list(daily_summary)
        })