from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class Vehicle(models.Model):
    VEHICLE_TYPE_CHOICES = (
        ('exhauster', 'Exhauster Truck'),
        ('sewage', 'Sewage Truck'),
        ('other', 'Other'),
    )
    
    driver = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vehicle')
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, default='exhauster')
    capacity = models.PositiveIntegerField(help_text="Capacity in liters")
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.plate_number} - {self.driver.get_full_name()}"