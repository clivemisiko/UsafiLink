"""
Uber-like driver matching service.
Implements proximity-based driver assignment with automatic fallback.
"""
from django.utils import timezone
from django.db.models import Q
from tracking.models import DriverLocation, DriverOrderRequest
from bookings.models import Booking
from users.models import User
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class DriverMatchingService:
    """
    Service to find and notify nearest available drivers.
    Works like Uber - finds nearest driver, notifies them, if they reject/timeout,
    moves to the next nearest driver.
    """
    
    # Configuration
    MAX_SEARCH_RADIUS_KM = 50  # Maximum distance to search for drivers
    DRIVER_RESPONSE_TIMEOUT_SECONDS = 30  # How long to wait for driver response
    MAX_DRIVERS_TO_NOTIFY = 10  # Maximum number of drivers to try
    
    @classmethod
    def find_nearest_drivers(cls, booking, limit=None):
        """
        Find nearest online drivers with active locations.
        
        Args:
            booking: Booking instance
            limit: Maximum number of drivers to return (default: MAX_DRIVERS_TO_NOTIFY)
        
        Returns:
            List of tuples: [(driver, distance_km), ...]
        """
        if limit is None:
            limit = cls.MAX_DRIVERS_TO_NOTIFY
        
        # Get all online drivers with locations
        online_drivers = User.objects.filter(
            role='driver',
            is_online=True,
            is_active=True,
            location__isnull=False
        ).select_related('location')
        
        # Calculate distances and filter by max radius
        driver_distances = []
        for driver in online_drivers:
            try:
                distance = driver.location.distance_to(booking.latitude, booking.longitude)
                
                if distance <= cls.MAX_SEARCH_RADIUS_KM:
                    driver_distances.append((driver, distance))
            except Exception as e:
                logger.error(f"Error calculating distance for driver {driver.id}: {e}")
                continue
        
        # Sort by distance (nearest first)
        driver_distances.sort(key=lambda x: x[1])
        
        # Return top N drivers
        return driver_distances[:limit]
    
    @classmethod
    def initiate_driver_search(cls, booking):
        """
        Start the Uber-like driver search process.
        Finds nearest drivers and creates notification queue.
        
        Args:
            booking: Booking instance
        
        Returns:
            bool: True if drivers found, False otherwise
        """
        logger.info(f"Initiating driver search for booking {booking.id}")
        
        # Update booking status to searching
        booking.status = 'searching_driver'
        booking.save(update_fields=['status'])
        
        # Find nearest drivers
        nearest_drivers = cls.find_nearest_drivers(booking)
        
        if not nearest_drivers:
            logger.warning(f"No drivers found within {cls.MAX_SEARCH_RADIUS_KM}km for booking {booking.id}")
            booking.status = 'no_driver_available'
            booking.save(update_fields=['status'])
            return False
        
        # Create driver order requests in order of proximity
        for position, (driver, distance) in enumerate(nearest_drivers, start=1):
            DriverOrderRequest.objects.create(
                booking=booking,
                driver=driver,
                distance_km=distance,
                queue_position=position,
                status='pending'
            )
            logger.info(f"Added driver {driver.username} to queue at position {position} (distance: {distance:.2f}km)")
        
        # Notify the first driver
        cls.notify_next_driver(booking)
        
        return True
    
    @classmethod
    def notify_next_driver(cls, booking):
        """
        Notify the next driver in the queue.
        
        Args:
            booking: Booking instance
        
        Returns:
            DriverOrderRequest or None: The request that was notified
        """
        # Find the next pending request
        next_request = DriverOrderRequest.objects.filter(
            booking=booking,
            status='pending'
        ).order_by('queue_position').first()
        
        if not next_request:
            logger.warning(f"No more drivers to notify for booking {booking.id}")
            booking.status = 'no_driver_available'
            booking.current_notified_driver = None
            booking.save(update_fields=['status', 'current_notified_driver'])
            return None
        
        # Update booking with current notified driver
        booking.current_notified_driver = next_request.driver
        booking.status = 'pending'  # Waiting for this driver's response
        booking.save(update_fields=['current_notified_driver', 'status'])
        
        # Update request timestamp
        next_request.notified_at = timezone.now()
        next_request.save(update_fields=['notified_at'])
        
        logger.info(f"Notified driver {next_request.driver.username} for booking {booking.id} (position {next_request.queue_position})")
        
        # Send actual notification (SMS, push, etc.) - implement in notifications app
        try:
            from bookings.tasks import send_driver_order_notification_task
            send_driver_order_notification_task.delay(booking.id, next_request.driver.id)
        except Exception as e:
            logger.error(f"Failed to send notification to driver: {e}")
        
        return next_request
    
    @classmethod
    def handle_driver_accept(cls, booking, driver):
        """
        Handle when a driver accepts an order.
        
        Args:
            booking: Booking instance
            driver: User instance (driver)
        
        Returns:
            bool: True if acceptance was successful
        """
        # Get the driver's request
        try:
            request = DriverOrderRequest.objects.get(booking=booking, driver=driver)
        except DriverOrderRequest.DoesNotExist:
            logger.error(f"No request found for driver {driver.id} and booking {booking.id}")
            return False
        
        # Check if this driver is the currently notified one
        if booking.current_notified_driver != driver:
            logger.warning(f"Driver {driver.id} tried to accept booking {booking.id} but is not the current notified driver")
            return False
        
        # Mark this request as accepted
        request.status = 'accepted'
        request.responded_at = timezone.now()
        request.save(update_fields=['status', 'responded_at'])
        
        # Update booking
        booking.driver = driver
        booking.status = 'accepted'
        booking.current_notified_driver = None
        booking.save(update_fields=['driver', 'status', 'current_notified_driver'])
        
        # Mark all other pending requests as cancelled
        DriverOrderRequest.objects.filter(
            booking=booking,
            status='pending'
        ).update(status='cancelled', responded_at=timezone.now())
        
        logger.info(f"Driver {driver.username} accepted booking {booking.id}")
        
        return True
    
    @classmethod
    def handle_driver_reject(cls, booking, driver):
        """
        Handle when a driver rejects an order.
        Automatically notifies the next driver in queue.
        
        Args:
            booking: Booking instance
            driver: User instance (driver)
        
        Returns:
            bool: True if there are more drivers to notify
        """
        # Get the driver's request
        try:
            request = DriverOrderRequest.objects.get(booking=booking, driver=driver)
        except DriverOrderRequest.DoesNotExist:
            logger.error(f"No request found for driver {driver.id} and booking {booking.id}")
            return False
        
        # Mark this request as rejected
        request.status = 'rejected'
        request.responded_at = timezone.now()
        request.save(update_fields=['status', 'responded_at'])
        
        logger.info(f"Driver {driver.username} rejected booking {booking.id}")
        
        # Notify next driver
        next_request = cls.notify_next_driver(booking)
        
        return next_request is not None
    
    @classmethod
    def handle_timeout(cls, booking, driver):
        """
        Handle when a driver doesn't respond in time.
        
        Args:
            booking: Booking instance
            driver: User instance (driver)
        
        Returns:
            bool: True if there are more drivers to notify
        """
        # Get the driver's request
        try:
            request = DriverOrderRequest.objects.get(booking=booking, driver=driver)
        except DriverOrderRequest.DoesNotExist:
            logger.error(f"No request found for driver {driver.id} and booking {booking.id}")
            return False
        
        # Mark this request as timeout
        request.status = 'timeout'
        request.responded_at = timezone.now()
        request.save(update_fields=['status', 'responded_at'])
        
        logger.info(f"Driver {driver.username} timed out for booking {booking.id}")
        
        # Notify next driver
        next_request = cls.notify_next_driver(booking)
        
        return next_request is not None
    
    @classmethod
    def check_and_handle_timeouts(cls):
        """
        Background task to check for timed out driver notifications.
        Should be run periodically (e.g., every 10 seconds via Celery).
        """
        timeout_threshold = timezone.now() - timedelta(seconds=cls.DRIVER_RESPONSE_TIMEOUT_SECONDS)
        
        # Find all pending requests that have timed out
        timed_out_requests = DriverOrderRequest.objects.filter(
            status='pending',
            notified_at__lt=timeout_threshold
        ).select_related('booking', 'driver')
        
        for request in timed_out_requests:
            # Only process if this driver is still the current notified driver
            if request.booking.current_notified_driver == request.driver:
                logger.info(f"Timeout detected for driver {request.driver.username} booking {request.booking.id}")
                cls.handle_timeout(request.booking, request.driver)
