from celery import shared_task
from .services import sms_service
from bookings.models import Booking
from payments.models import Payment
from django.utils import timezone
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_sms_task(phone_number, message):
    """Background task to send SMS"""
    try:
        result = sms_service.send_sms(phone_number, message)
        logger.info(f"SMS task completed: {result}")
        return result
    except Exception as e:
        logger.error(f"SMS task failed: {str(e)}")
        return {"success": False, "error": str(e)}

@shared_task
def send_booking_confirmation_task(booking_id):
    """Send booking confirmation SMS"""
    try:
        booking = Booking.objects.get(id=booking_id)
        message = (
            f"Booking #{booking.id} confirmed!\n"
            f"Date: {booking.scheduled_date.strftime('%Y-%m-%d %H:%M')}\n"
            f"Location: {booking.location_name}\n"
            f"Thank you for choosing our service."
        )
        return sms_service.send_sms(booking.customer.phone_number, message)
    except Exception as e:
        logger.error(f"Booking confirmation task failed: {str(e)}")
        return {"success": False, "error": str(e)}

@shared_task
def send_payment_confirmation_task(payment_id):
    """Send payment confirmation SMS"""
    try:
        payment = Payment.objects.get(id=payment_id)
        message = (
            f"Payment of KES {payment.amount} received!\n"
            f"For booking #{payment.booking.id}\n"
            f"Receipt: {payment.mpesa_receipt}\n"
            f"Thank you!"
        )
        return sms_service.send_sms(payment.booking.customer.phone_number, message)
    except Exception as e:
        logger.error(f"Payment confirmation task failed: {str(e)}")
        return {"success": False, "error": str(e)}

@shared_task
def send_driver_on_the_way_task(booking_id, driver_name, eta):
    """Send driver on the way notification"""
    try:
        booking = Booking.objects.get(id=booking_id)
        message = (
            f"Driver {driver_name} is on the way!\n"
            f"ETA: {eta}\n"
            f"Booking #{booking.id}"
        )
        return sms_service.send_sms(booking.customer.phone_number, message)
    except Exception as e:
        logger.error(f"Driver notification task failed: {str(e)}")
        return {"success": False, "error": str(e)}

@shared_task
def send_daily_reminders():
    """Send reminders for next day bookings"""
    try:
        tomorrow = timezone.now() + timezone.timedelta(days=1)
        start_date = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        bookings = Booking.objects.filter(
            scheduled_date__range=[start_date, end_date],
            status='accepted'
        )
        
        for booking in bookings:
            message = (
                f"Reminder: Booking #{booking.id} tomorrow!\n"
                f"Time: {booking.scheduled_date.strftime('%H:%M')}\n"
                f"Location: {booking.location_name}\n"
                f"Please be available."
            )
            send_sms_task.delay(booking.customer.phone_number, message)
            
        return {"success": True, "sent": len(bookings)}
    except Exception as e:
        logger.error(f"Daily reminders task failed: {str(e)}")
        return {"success": False, "error": str(e)}

@shared_task
def notify_admins_bank_payment_task(payment_id):
    """Notify all admins about a new bank transfer submission"""
    from users.models import User
    try:
        payment = Payment.objects.get(id=payment_id)
        admins = User.objects.filter(role='admin', is_active=True)
        
        message = (
            f"ALERT: New Bank Transfer Submission!\n"
            f"Amount: KES {payment.amount}\n"
            f"Ref: {payment.bank_reference}\n"
            f"Booking: #{payment.booking.id}\n"
            f"Please verify in Admin Dashboard."
        )
        
        for admin in admins:
            if admin.phone_number:
                send_sms_task.delay(admin.phone_number, message)
                
        return {"success": True, "notified": admins.count()}
    except Exception as e:
        logger.error(f"Notify admins task failed: {str(e)}")
        return {"success": False, "error": str(e)}