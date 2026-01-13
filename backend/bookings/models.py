from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('payment_pending', 'Payment Pending'),
        ('accepted', 'Accepted'),
        ('started', 'On the Way'),
        ('arrived', 'Arrived/Working'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    SERVICE_TYPE_CHOICES = (
        ('septic', 'Septic Tank'),
        ('pit_latrine', 'Pit Latrine'),
        ('grease_trap', 'Grease Trap'),
        ('other', 'Other'),
    )
    
    TANK_SIZE_CHOICES = (
        ('1000', '1000 Liters'),
        ('2000', '2000 Liters'),
        ('3000', '3000 Liters'),
        ('5000', '5000 Liters'),
        ('10000', '10000 Liters'),
    )

    customer = models.ForeignKey(User, related_name='customer_bookings', on_delete=models.CASCADE)
    driver = models.ForeignKey(User, related_name='driver_bookings', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Location details
    location_name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True) 
    
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    # Service details
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, default='septic')
    tank_size = models.CharField(max_length=10, choices=TANK_SIZE_CHOICES, default='1000')
    special_instructions = models.TextField(blank=True)
    
    # Scheduling
    scheduled_date = models.DateTimeField()
    
    # Pricing
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Booking {self.id} - {self.get_service_type_display()} - {self.status}"

class Rating(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='rating')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_ratings')
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_ratings')
    score = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating for Booking {self.booking.id}: {self.score}/5"