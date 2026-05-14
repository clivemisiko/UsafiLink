from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('driver', 'Driver'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    is_online = models.BooleanField(default=False)
    
    # Email verification fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    token_created_at = models.DateTimeField(auto_now_add=True, null=True)

    # 2FA fields
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    is_two_factor_enabled = models.BooleanField(default=False)
    
    # Driver-specific fields
    driver_license_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    driver_license_expiry_date = models.DateField(null=True, blank=True, help_text="Driver license expiry date")
    is_driver_approved = models.BooleanField(default=False, help_text="Whether driver account is approved by admin")

    def __str__(self):
        return f"{self.username} - {self.role}"
    
    def generate_verification_token(self):
        """Generate a new verification token"""
        self.email_verification_token = uuid.uuid4()
        self.token_created_at = timezone.now()
        self.save(update_fields=['email_verification_token', 'token_created_at'])
        return self.email_verification_token
    
    def is_license_expiring_soon(self):
        """Check if driver license expires within 7 days"""
        if not self.driver_license_expiry_date:
            return False
        days_until_expiry = (self.driver_license_expiry_date - timezone.now().date()).days
        return 0 <= days_until_expiry <= 7

