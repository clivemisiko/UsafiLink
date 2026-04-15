from django.db import connection
from tracking.models import DriverOrderRequest

# Get all driver IDs that don't exist in users_user table
with connection.cursor() as cursor:
    cursor.execute('''
        SELECT DISTINCT driver_id FROM tracking_driverorderrequest
        WHERE driver_id NOT IN (SELECT id FROM users_user WHERE role='driver')
    ''')
    invalid_drivers = [row[0] for row in cursor.fetchall()]

if invalid_drivers:
    count = DriverOrderRequest.objects.filter(driver_id__in=invalid_drivers).delete()[0]
    print(f'Deleted {count} orphaned tracking records')
else:
    print('No orphaned records found')
