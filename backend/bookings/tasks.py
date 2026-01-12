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
        
        # You can either delete or archive them
        # old_bookings.delete()  # Delete them
        # Or mark them as archived
        for booking in old_bookings:
            booking.status = 'archived'
            booking.save()
        
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