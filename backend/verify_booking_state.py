#!/usr/bin/env python
"""
Verify booking state after driver search
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from bookings.models import Booking
from tracking.models import DriverOrderRequest

print("=" * 60)
print("BOOKING STATE VERIFICATION")
print("=" * 60)

booking = Booking.objects.get(id=13)
print(f"\nBooking #13:")
print(f"  Status: {booking.status}")
print(f"  Driver: {booking.driver}")
print(f"  Current Notified Driver: {booking.current_notified_driver}")
print(f"  Created: {booking.created_at}")

# Check driver order requests
requests = DriverOrderRequest.objects.filter(booking=booking)
print(f"\nDriver Order Requests: {requests.count()}")
for req in requests:
    print(f"  - Driver: {req.driver.username}")
    print(f"    Distance: {req.distance_km}km")
    print(f"    Queue Position: {req.queue_position}")
    print(f"    Status: {req.status}")
    print(f"    Notified At: {req.notified_at}")

print("\n" + "=" * 60)
