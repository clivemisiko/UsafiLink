from django.conf import settings
from django.db import models
from math import radians, sin, cos, sqrt, atan2

User = settings.AUTH_USER_MODEL

class DriverLocation(models.Model):
    driver = models.OneToOneField(User, on_delete=models.CASCADE, related_name='location')
    latitude = models.FloatField()
    longitude = models.FloatField()
    heading = models.FloatField(null=True, blank=True, help_text="Direction in degrees (0-360)")
    speed = models.FloatField(null=True, blank=True, help_text="Speed in km/h")
    accuracy = models.FloatField(null=True, blank=True, help_text="GPS accuracy in meters")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.driver} location"
    
    def distance_to(self, lat, lon):
        """
        Calculate distance to a point using Haversine formula.
        Returns distance in kilometers.
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = radians(self.latitude), radians(self.longitude)
        lat2, lon2 = radians(lat), radians(lon)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    class Meta:
        verbose_name = "Driver Location"
        verbose_name_plural = "Driver Locations"


class DriverOrderRequest(models.Model):
    """
    Tracks which drivers were notified about an order (Uber-like queue system).
    When an order is created, the system finds nearest drivers and notifies them one by one.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),  # Notified, waiting for response
        ('accepted', 'Accepted'),  # Driver accepted
        ('rejected', 'Rejected'),  # Driver rejected
        ('timeout', 'Timeout'),  # Driver didn't respond in time
        ('cancelled', 'Cancelled'),  # Order was cancelled before response
    )
    
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='driver_requests')
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='order_requests')
    
    # Proximity data at time of notification
    distance_km = models.FloatField(help_text="Distance from driver to pickup location in km")
    
    # Request tracking
    notified_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Queue position (1 = first driver notified, 2 = second, etc.)
    queue_position = models.PositiveIntegerField()
    
    class Meta:
        verbose_name = "Driver Order Request"
        verbose_name_plural = "Driver Order Requests"
        ordering = ['booking', 'queue_position']
        unique_together = ['booking', 'driver']
    
    def __str__(self):
        return f"Booking #{self.booking.id} -> {self.driver.username} (Position {self.queue_position})"
