#!/usr/bin/env python
"""
Test SMS service directly without Celery
Run with: python manage.py shell < test_sms_direct.py
OR: python test_sms_direct.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from notifications.services import sms_service
from django.conf import settings

print("=" * 60)
print("TESTING SMS SERVICE")
print("=" * 60)

# Check if credentials are loaded
print(f"\n✓ Username: {settings.AFRICASTALKING_USERNAME}")
print(f"✓ API Key: {settings.AFRICASTALKING_API_KEY[:20]}...")
print(f"✓ Sender ID: {settings.AFRICASTALKING_SENDER_ID}")

# Check if service is configured
print(f"\n✓ SMS Service Configured: {sms_service.is_configured}")

if not sms_service.is_configured:
    print("\n❌ SMS Service is NOT configured!")
    print("Check your environment variables:")
    print("  - AFRICASTALKING_USERNAME")
    print("  - AFRICASTALKING_API_KEY")
    exit(1)

# Test sending SMS
print("\n" + "-" * 60)
print("Attempting to send test SMS...")
print("-" * 60)

test_number = "+254787778181"  # Replace with your test number
test_message = "UsafiLink Test SMS - If you see this, SMS is working!"

result = sms_service.send_sms(test_number, test_message)

print(f"\nResponse: {result}")

if result.get("success"):
    print("\n✅ SMS SENT SUCCESSFULLY!")
    print(f"Message ID: {result.get('message_id')}")
    print(f"Cost: {result.get('cost')}")
else:
    print(f"\n❌ SMS FAILED!")
    print(f"Error: {result.get('error') or result.get('message')}")
