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
from notifications.tasks import send_payment_confirmation_task, send_sms_task, notify_admins_bank_payment_task
from .models import Payment, TransactionLog
from .serializers import (
    PaymentSerializer, 
    PaymentCreateSerializer,
    PaymentUpdateSerializer,
    MpesaSTKPushSerializer,
    BankTransferSerializer
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
            queryset = queryset.filter(booking__customer=user)
        elif user.role == 'driver':
            queryset = queryset.filter(booking__driver=user)
        
        # Simple filtering for all roles
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
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

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def initiate_bank_transfer(self, request):
        """
        Initiate a manual bank transfer payment.
        The user provides a bank reference, and an admin will verify it.
        """
        serializer = BankTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_id = serializer.validated_data['booking_id']
        bank_reference = serializer.validated_data['bank_reference']

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

                payment_data = {
                    'booking': booking,
                    'amount': booking.estimated_price,
                    'status': 'pending',
                    'payment_method': 'bank',
                    'bank_reference': bank_reference
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
                    data={'bank_reference': bank_reference},
                    status='success'
                )

                # Notify admins
                notify_admins_bank_payment_task.delay(payment.id)

                return Response({
                    'success': True,
                    'message': 'Bank transfer submitted. Our team will verify the payment within 24 hours.',
                    'payment_id': payment.id
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
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get payment status with proactive M-PESA query fallback."""
        payment = self.get_object()
        
        # If pending, try to query M-PESA directly
        if payment.status == 'pending' and payment.checkout_request_id:
            try:
                mpesa_service = MpesaService()
                result = mpesa_service.query_stk_status(payment.checkout_request_id)
                
                # Safaricom ResultCode 0 means success
                result_code = str(result.get('ResultCode', result.get('ResponseCode', '')))
                
                if result_code == '0':
                    payment.status = 'paid'
                    payment.mpesa_receipt = result.get('MpesaReceiptNumber', 'QUERY_SUCCESS')
                    payment.save()
                    # Update booking
                    booking = payment.booking
                    if booking.status in ['pending', 'payment_pending']:
                        booking.status = 'accepted'
                        booking.save()
                elif result_code in ['1032', '1037', '2001', '1']:
                    payment.status = 'cancelled'
                    payment.save()
            except Exception as e:
                logger.error(f"Error checking status for payment {payment.id}: {str(e)}")

        return Response({
            'id': payment.id,
            'status': payment.status,
            'amount': payment.amount,
            'booking_id': payment.booking.id,
            'booking_status': payment.booking.status,
            'checkout_request_id': payment.checkout_request_id
        })

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate a simple HTML receipt for the payment."""
        from django.http import HttpResponse
        payment = self.get_object()
        
        if payment.status != 'paid':
            return HttpResponse("Receipt is only available for paid payments.", status=400)
            
        booking = payment.booking
        paid_date = payment.updated_at.strftime("%B %d, %Y at %I:%M %p")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - UsafiLink #{payment.id}</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; padding: 40px; }}
                .receipt-card {{ background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 40px; border: 1px solid #e5e7eb; }}
                .header {{ text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -1px; }}
                .receipt-title {{ font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }}
                .amount-section {{ text-align: center; margin-bottom: 30px; }}
                .amount {{ font-size: 48px; font-weight: 800; color: #111827; }}
                .currency {{ font-size: 24px; color: #6b7280; margin-right: 4px; }}
                .status-badge {{ display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; rounded: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 8px; border-radius: 20px; }}
                .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }}
                .detail-item {{ }}
                .detail-label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }}
                .detail-value {{ font-size: 16px; font-weight: 600; color: #374151; }}
                .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px dashed #e5e7eb; padding-top: 20px; }}
                @media print {{
                    body {{ background: white; padding: 0; }}
                    .receipt-card {{ box-shadow: none; border: none; width: 100%; }}
                }}
            </style>
        </head>
        <body>
            <div class="receipt-card">
                <div class="header">
                    <div class="logo">UsafiLink</div>
                    <div class="receipt-title">Official Payment Receipt</div>
                </div>
                
                <div class="amount-section">
                    <div class="amount"><span class="currency">KES</span>{payment.amount:,.2f}</div>
                    <div class="status-badge">Paid Successfully</div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Payment ID</div>
                        <div class="detail-value">#{payment.id:06d}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">M-PESA Receipt</div>
                        <div class="detail-value">{payment.mpesa_receipt or "N/A"}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Service Type</div>
                        <div class="detail-value">{booking.service_type.replace('_', ' ').title()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Tank Size</div>
                        <div class="detail-value">{booking.tank_size} Liters</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Date</div>
                        <div class="detail-value">{paid_date}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Customer</div>
                        <div class="detail-value">{booking.customer.get_full_name() or booking.customer.username}</div>
                    </div>
                </div>
                
                <div class="footer">
                    Thank you for choosing UsafiLink.<br>
                    Email: support@usafilink.com | Tel: +254 700 000 000
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="background: white; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Receipt</button>
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_content)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def manual_verify(self, request):
        """
        Admin endpoint to manually verify a payment.
        Useful for cash payments or resolving issues.
        """
        payment_id = request.data.get('payment_id')
        mpesa_receipt = request.data.get('mpesa_receipt')
        bank_reference = request.data.get('bank_reference')
        
        try:
            payment = Payment.objects.get(id=payment_id)
            
            if payment.status == 'paid':
                return Response(
                    {'detail': 'Payment is already marked as paid.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                payment.mpesa_receipt = mpesa_receipt or payment.mpesa_receipt
                payment.bank_reference = bank_reference or payment.bank_reference
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
            
            # Process callback
            from django.conf import settings # Added this import
            if settings.DEBUG:
                # Run synchronously for easier local testing/debugging
                from .tasks import process_mpesa_callback_task
                logger.info("Processing callback synchronously (DEBUG=True)")
                process_mpesa_callback_task(json.dumps(callback_data))
            else:
                # Process callback asynchronously using Celery (Production)
                from .tasks import process_mpesa_callback_task # Moved this import here
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