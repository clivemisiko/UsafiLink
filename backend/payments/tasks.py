from celery import shared_task
from .models import Payment
import json
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def process_intasend_callback_task(callback_data):
    """Process Intasend webhook callback asynchronously"""
    try:
        data = json.loads(callback_data)
        
        # Extract Intasend payment data
        api_ref = data.get('api_ref')
        state = data.get('state')  # PENDING, PROCESSING, COMPLETE, FAILED
        invoice_id = data.get('invoice_id')
        provider = data.get('provider')  # M-PESA, CARD-PAYMENT, BANK-PAYMENT
        amount = data.get('value')
        
        logger.info(f"Processing Intasend callback: api_ref={api_ref}, state={state}")
        
        # Find payment by Intasend API reference
        payment = Payment.objects.filter(intasend_api_ref=api_ref).first()
        
        if not payment:
            logger.warning(f"No payment found for Intasend api_ref: {api_ref}")
            return {"success": False, "error": "Payment not found"}
        
        # Update payment based on state
        old_status = payment.status
        
        if state == 'COMPLETE':
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            
            # Update booking status
            booking = payment.booking
            if booking.status in ['pending', 'payment_pending']:
                booking.status = 'accepted'
                booking.save()
            
            # Send payment confirmation SMS
            from notifications.tasks import send_payment_confirmation_task
            send_payment_confirmation_task.delay(payment.id)
            
            logger.info(f"Payment {payment.id} marked as PAID")
        
        elif state == 'FAILED':
            payment.status = 'failed'
            logger.warning(f"Payment {payment.id} marked as FAILED: {data.get('failed_reason')}")
        
        elif state == 'PROCESSING':
            payment.status = 'processing'
            logger.info(f"Payment {payment.id} is PROCESSING")
        
        elif state == 'PENDING':
            payment.status = 'pending'
            logger.info(f"Payment {payment.id} is PENDING")
        
        # Update payment details
        payment.invoice_id = invoice_id
        payment.notes = f"Provider: {provider}, State: {state}"
        payment.save()
        
        # Log the transaction
        from .models import TransactionLog
        TransactionLog.objects.create(
            payment=payment,
            action=f'intasend_callback_processed',
            data=data,
            status=f'state_{state}'
        )
        
        logger.info(f"Processed Intasend callback for payment {payment.id}: {old_status} → {payment.status}")
        return {"success": True, "payment_id": payment.id, "new_status": payment.status}
        
    except Exception as e:
        logger.error(f"Error processing Intasend callback: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}