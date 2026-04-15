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
        service_label = booking.get_service_type_display()
        tank_label = f"{booking.tank_size}L"
        schedule_label = booking.scheduled_date.strftime('%Y-%m-%d %H:%M')
        est_price_label = f"KES {booking.estimated_price}"
        location_label = booking.location_name or "N/A"
        address_label = booking.address or "N/A"
        maps_link = f"https://maps.google.com/?q={booking.latitude},{booking.longitude}"

        message = (
            f"UsafiLink booking confirmed (#{booking.id}).\n"
            f"Service: {service_label} | Tank: {tank_label}\n"
            f"When: {schedule_label}\n"
            f"Location: {location_label}\n"
            f"Address: {address_label}\n"
            f"Estimate: {est_price_label}\n"
            f"Map: {maps_link}\n"
            f"We are now finding the nearest available driver."
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
def send_driver_accepted_task(booking_id):
    """Send SMS when driver accepts the booking"""
    try:
        booking = Booking.objects.get(id=booking_id)
        driver_name = booking.driver.get_full_name() or booking.driver.username
        driver_phone = booking.driver.phone_number
        service_type = booking.get_service_type_display()
        scheduled_time = booking.scheduled_date.strftime('%H:%M')
        
        message = (
            f"Great news! Driver {driver_name} has accepted your booking!\n"
            f"Service: {service_type}\n"
            f"Scheduled: {scheduled_time}\n"
            f"Driver Contact: {driver_phone}\n"
            f"Booking #: {booking.id}\n"
            f"Track your booking in the UsafiLink app."
        )
        return sms_service.send_sms(booking.customer.phone_number, message)
    except Exception as e:
        logger.error(f"Driver acceptance SMS task failed: {str(e)}")
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