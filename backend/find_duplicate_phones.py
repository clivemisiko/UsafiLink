#!/usr/bin/env python
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()
from users.models import User
phones = {}
for u in User.objects.exclude(phone_number__isnull=True).exclude(phone_number__exact=''):
    phones.setdefault(u.phone_number, []).append((u.id, u.username, u.role))
for phone, users in phones.items():
    if len(users) > 1:
        print(f"{phone}: {users}")
