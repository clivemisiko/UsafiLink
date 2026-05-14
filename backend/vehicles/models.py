from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class Vehicle(models.Model):
    VEHICLE_TYPE_CHOICES = (
        ('exhauster', 'Exhauster Truck'),
        ('sewage', 'Sewage Truck'),
        ('other', 'Other'),
    )
    
    SERVICE_STATUS_CHOICES = (
        ('operational', 'Operational'),
        ('repair', 'Under Repair'),
        ('maintenance', 'Maintenance'),
        ('service', 'In Service'),
    )
    
    driver = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicle')
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, default='exhauster')
    capacity = models.PositiveIntegerField(help_text="Capacity in liters")
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # New fields for insurance and registration
    insurance_expiry_date = models.DateField(null=True, blank=True, help_text="Vehicle insurance expiry date")
    registration_expiry_date = models.DateField(null=True, blank=True, help_text="Vehicle registration expiry date")
    
    # Service and maintenance tracking
    service_status = models.CharField(max_length=20, choices=SERVICE_STATUS_CHOICES, default='operational')
    last_service_date = models.DateField(null=True, blank=True)
    next_service_date = models.DateField(null=True, blank=True)
    service_notes = models.TextField(blank=True, null=True)
    
    def clean(self):
        """Ensure a driver can only have one vehicle"""
        if self.driver and self.id:
            existing_vehicle = Vehicle.objects.filter(driver=self.driver).exclude(id=self.id).exists()
            if existing_vehicle:
                raise ValidationError(f"Driver {self.driver.username} already has an assigned vehicle.")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def is_insurance_expiring_soon(self):
        """Check if insurance expires within 7 days"""
        if not self.insurance_expiry_date:
            return False
        days_until_expiry = (self.insurance_expiry_date - timezone.now().date()).days
        return 0 <= days_until_expiry <= 7
    
    def is_insurance_expired(self):
        """Check if insurance has expired"""
        if not self.insurance_expiry_date:
            return False
        days_until_expiry = (self.insurance_expiry_date - timezone.now().date()).days
        return days_until_expiry < 0
    
    def is_registration_expiring_soon(self):
        """Check if registration expires within 7 days"""
        if not self.registration_expiry_date:
            return False
        days_until_expiry = (self.registration_expiry_date - timezone.now().date()).days
        return 0 <= days_until_expiry <= 7
    
    def is_registration_expired(self):
        """Check if registration has expired"""
        if not self.registration_expiry_date:
            return False
        days_until_expiry = (self.registration_expiry_date - timezone.now().date()).days
        return days_until_expiry < 0
    
    def __str__(self):
        driver_name = self.driver.get_full_name() if self.driver else "Unassigned"
        return f"{self.plate_number} - {driver_name}"


class VehicleComplaint(models.Model):
    """Track complaints and issues reported by drivers"""
    STATUS_CHOICES = (
        ('reported', 'Reported'),
        ('acknowledged', 'Acknowledged by Admin'),
        ('resolved', 'Resolved'),
        ('transferred', 'Driver Transferred'),
    )
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='complaints')
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicle_complaints')
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Complaint on {self.vehicle.plate_number} - {self.title}"


class DailyTrip(models.Model):
    """Track daily trip metrics for drivers"""
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_trips')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='daily_trips')
    date = models.DateField()
    
    # Trip metrics
    total_kilometers = models.FloatField(default=0.0, help_text="Total kilometers driven")
    fuel_consumed_liters = models.FloatField(default=0.0, help_text="Total fuel consumed in liters")
    waste_emptied_liters = models.FloatField(default=0.0, help_text="Total waste emptied in liters")
    
    # Earnings
    revenue_generated = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['driver', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"Trip {self.driver.username} - {self.date}"


class FuelLog(models.Model):
    """Log fuel purchases and consumption"""
    FUEL_TYPE_CHOICES = (
        ('purchase', 'Fuel Purchase'),
        ('consumption', 'Fuel Consumption'),
    )
    
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fuel_logs')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='fuel_logs')
    log_type = models.CharField(max_length=20, choices=FUEL_TYPE_CHOICES)
    liters = models.FloatField()
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.get_log_type_display()} - {self.driver.username} - {self.liters}L"