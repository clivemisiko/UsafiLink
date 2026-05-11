#!/usr/bin/env python
"""
Clear stuck tasks from Celery queue and restart processing.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, '/root/app' if os.path.exists('/root/app') else os.path.dirname(__file__))
django.setup()

from celery import Celery
from django.conf import settings
import redis
import json
import time

print("\n" + "="*80)
print("CELERY QUEUE RECOVERY")
print("="*80 + "\n")

# Connect to Redis
print("Connecting to Redis...")
r = redis.from_url(settings.CELERY_BROKER_URL)

# Get queue details
print("\n1. CURRENT QUEUE STATUS")
print("-" * 80)
queue_length = r.llen('celery')
print(f"Tasks in queue: {queue_length}")

# Print queue contents (first 10 items)
if queue_length > 0:
    print(f"\nFirst {min(10, queue_length)} queued tasks:")
    for i in range(min(10, queue_length)):
        task_data = r.lindex('celery', i)
        if task_data:
            try:
                task = json.loads(task_data)
                print(f"  {i+1}. {task.get('headers', {}).get('task', 'Unknown')}")
            except:
                pass

# Clear the queue
print("\n2. CLEARING STUCK TASKS")
print("-" * 80)
# Automatically clear stuck tasks
if queue_length > 0:
    try:
        # Purge the default queue
        r.delete('celery')
        print("✓ Queue cleared!")
        
        # Verify
        queue_length = r.llen('celery')
        print(f"Tasks remaining in queue: {queue_length}")
        
    except Exception as e:
        print(f"✗ Error clearing queue: {e}")
else:
    print("Skipped clearing queue")

# Restart newly created bookings
print("\n3. RESTART DRIVER SEARCH FOR STUCK BOOKINGS")
print("-" * 80)
from bookings.models import Booking
from bookings.tasks import initiate_driver_search_task

stuck_bookings = Booking.objects.filter(status='searching_driver')
print(f"Found {stuck_bookings.count()} bookings in 'searching_driver' status")

if stuck_bookings.count() > 0:
    # Automatically restart
    print("\nRestarting driver search for stuck bookings...")
    for booking in stuck_bookings:
            try:
                # Clear existing requests first
                booking.driver_requests.all().delete()
                booking.current_notified_driver = None
                booking.save()
                
                # Queue new search
                result = initiate_driver_search_task.apply_async(
                    args=[booking.id],
                    countdown=0
                )
                print(f"✓ Requeued booking #{booking.id} (Task: {result.id})")
                time.sleep(0.1)  # Small delay between tasks
                
            except Exception as e:
                print(f"✗ Error requeuing booking #{booking.id}: {e}")
else:
    print("No bookings in 'searching_driver' status - system is already recovered!")

print("\n4. RECOMMENDATIONS")
print("-" * 80)
print("""
Next steps:
1. Restart Celery worker: celery -A backend worker -l info
2. Monitor Redis queue: redis-cli LLEN celery
3. Check Celery logs for errors
4. Verify tasks are being processed (should decrease over time)
""")

print("="*80 + "\n")
