from celery import shared_task
from django.utils import timezone
from .models import Booking
import logging

logger = logging.getLogger(__name__)

@shared_task
def cleanup_old_bookings():
    """Archive or delete old completed bookings"""
    try:
        cutoff_date = timezone.now() - timezone.timedelta(days=90)  # 3 months ago
        
        # Get old completed bookings
        old_bookings = Booking.objects.filter(
            status='completed',
            completed_at__lt=cutoff_date
        )
        
        count = old_bookings.count()
        
        # Delete old bookings securely
        old_bookings.delete()
        
        logger.info(f"Cleaned up {count} old bookings")
        return {"cleaned": count, "status": "success"}
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {str(e)}")
        return {"error": str(e), "status": "failed"}

@shared_task
def auto_cancel_pending_bookings():
    """Automatically cancel bookings that have been pending for too long"""
    try:
        cutoff_time = timezone.now() - timezone.timedelta(hours=24)  # 24 hours
        
        pending_bookings = Booking.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        )
        
        cancelled_count = 0
        for booking in pending_bookings:
            booking.status = 'cancelled'
            booking.save()
            cancelled_count += 1
            
            # Notify customer
            from notifications.tasks import send_sms_task
            message = f"Booking #{booking.id} was automatically cancelled as no driver accepted it within 24 hours."
            send_sms_task.delay(booking.customer.phone_number, message)
        
        logger.info(f"Auto-cancelled {cancelled_count} pending bookings")
        return {"cancelled": cancelled_count, "status": "success"}
        
    except Exception as e:
        logger.error(f"Auto-cancel task failed: {str(e)}")
        return {"error": str(e), "status": "failed"}


@shared_task
def check_driver_timeouts():
    """
    Periodic task to check and handle driver notification timeouts.
    Should run every 10 seconds.
    """
    from bookings.services import DriverMatchingService
    logger.info("Checking for driver notification timeouts...")
    DriverMatchingService.check_and_handle_timeouts()


@shared_task
def send_driver_order_notification_task(booking_id, driver_id):
    """
    Send notification to driver about new order.
    
    Args:
        booking_id: Booking ID
        driver_id: Driver user ID
    """
    from users.models import User
    from notifications.tasks import send_sms_task
    
    try:
        booking = Booking.objects.get(id=booking_id)
        driver = User.objects.get(id=driver_id)
        
        message = (
            f"🚛 New Order Alert! #{booking.id}\n"
            f"📍 {booking.location_name}\n"
            f"📏 Service: {booking.get_service_type_display()}\n"
            f"💰 KES {booking.estimated_price}\n"
            f"⏰ {booking.scheduled_date.strftime('%d/%m/%Y %H:%M')}\n"
            f"Tap to accept within 30 seconds!"
        )
        
        # Send SMS
        send_sms_task.delay(driver.phone_number, message)
        
        logger.info(f"Sent order notification to driver {driver.username} for booking {booking_id}")
        
    except Exception as e:
        logger.error(f"Failed to send driver notification: {e}")


@shared_task
def initiate_driver_search_task(booking_id):
    """
    Asynchronous task to initiate driver search.
    Called after a booking is created.
    
    Args:
        booking_id: Booking ID
    """
    from bookings.services import DriverMatchingService
    
    try:
        booking = Booking.objects.get(id=booking_id)
        logger.info(f"Starting driver search for booking {booking_id}")
        
        success = DriverMatchingService.initiate_driver_search(booking)
        
        if success:
            logger.info(f"Driver search initiated successfully for booking {booking_id}")
        else:
            logger.warning(f"No drivers available for booking {booking_id}")
            
            # Send notification to customer
            from notifications.tasks import send_sms_task
            message = (
                f"Sorry, no exhauster drivers are currently available in your area. "
                f"We'll keep searching and notify you when a driver is found. "
                f"Booking #{booking.id}"
            )
            send_sms_task.delay(booking.customer.phone_number, message)
            
    except Exception as e:
        logger.error(f"Error initiating driver search for booking {booking_id}: {e}")