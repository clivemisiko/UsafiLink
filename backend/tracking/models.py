from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class DriverLocation(models.Model):
    driver = models.OneToOneField(User, on_delete=models.CASCADE)
    latitude = models.FloatField()
    longitude = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.driver} location"
