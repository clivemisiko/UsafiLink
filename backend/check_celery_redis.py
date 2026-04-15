#!/usr/bin/env python
"""
Check if Celery and Redis are running
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
import redis
from celery import Celery

print("=" * 60)
print("CHECKING CELERY & REDIS SETUP")
print("=" * 60)

# Check Redis
print("\n1. Testing Redis Connection...")
redis_url = settings.REDIS_URL
print(f"   Redis URL: {redis_url}")

try:
    r = redis.from_url(redis_url)
    r.ping()
    print("   ✅ Redis is CONNECTED and WORKING")
except Exception as e:
    print(f"   ❌ Redis FAILED: {str(e)}")
    print("   ➜ Make sure Redis is running: redis-server")
    sys.exit(1)

# Check Celery Broker
print("\n2. Testing Celery Broker...")
broker_url = settings.CELERY_BROKER_URL
print(f"   Broker URL: {broker_url}")

try:
    from celery.app import app as celery_app
    
    # Try to get broker connection
    with celery_app.connection() as conn:
        pass
    print("   ✅ Celery Broker is CONNECTED")
except Exception as e:
    print(f"   ❌ Celery Broker FAILED: {str(e)}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ BOTH REDIS AND CELERY ARE WORKING!")
print("=" * 60)
print("\nNow run the Celery worker in another terminal:")
print("  celery -A backend worker -l info")
