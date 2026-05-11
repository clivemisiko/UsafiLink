import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, 'C:\\Users\\ADMIN\\Documents\\UsafiLink\\backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from bookings.models import Booking
from users.models import User
from tracking.models import DriverLocation

# Recent bookings
print("=== RECENT BOOKINGS ===")
bookings = Booking.objects.all().order_by('-created_at')[:5]
for b in bookings:
    print(f"Booking {b.id}: {b.status}, Customer: {b.customer.username}, Current Driver: {b.current_notified_driver}")

# Online drivers
print("\n=== ONLINE DRIVERS ===")
drivers = User.objects.filter(is_online=True, user_type='driver')
print(f"Total online drivers: {drivers.count()}")
for d in drivers[:3]:
    loc = DriverLocation.objects.filter(driver=d).first()
    print(f"Driver {d.username}: location_exists={loc is not None}")
    if loc:
        print(f"  - Latitude: {loc.latitude}, Longitude: {loc.longitude}")

print("\n=== DRIVER LOCATION DATA ===")
all_locations = DriverLocation.objects.all().order_by('-updated_at')[:10]
print(f"Total location records: {DriverLocation.objects.count()}")
for loc in all_locations[:5]:
    print(f"Driver {loc.driver.username}: Updated at {loc.updated_at}")
