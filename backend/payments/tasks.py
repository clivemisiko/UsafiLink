from celery import shared_task
from .models import Payment
import json
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_mpesa_callback_task(callback_data):
    """Process M-PESA callback asynchronously"""
    try:
        data = json.loads(callback_data)
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        
        metadata = stk_callback.get('CallbackMetadata', {})
        items = metadata.get('Item', [])
        
        mpesa_receipt = None
        amount = None
        phone_number = None
        
        for item in items:
            name = item.get('Name')
            value = item.get('Value')
            if name == 'MpesaReceiptNumber':
                mpesa_receipt = value
            elif name == 'Amount':
                amount = value
            elif name == 'PhoneNumber':
                phone_number = value
        
        # Find payment by checkout_request_id (you need to store this)
        # For now, find by amount and pending status
        payment = Payment.objects.filter(
            amount=amount,
            status='pending'
        ).first()
        
        if payment:
            payment.mpesa_receipt = mpesa_receipt
            payment.status = 'paid' if result_code == 0 else 'failed'
            payment.save()
            
            # Update booking status
            booking = payment.booking
            if result_code == 0:
                booking.status = 'accepted'
                booking.save()
                
                # Send payment confirmation SMS
                from notifications.tasks import send_payment_confirmation_task
                send_payment_confirmation_task.delay(payment.id)
            
            logger.info(f"Processed M-PESA callback for payment {payment.id}")
            return {"success": True, "payment_id": payment.id}
        else:
            logger.warning(f"No pending payment found for M-PESA callback")
            return {"success": False, "error": "Payment not found"}
            
    except Exception as e:
        logger.error(f"Error processing M-PESA callback: {str(e)}")
        return {"success": False, "error": str(e)}