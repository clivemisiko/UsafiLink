# backend/users/admin/apps.py
from django.apps import AppConfig

class AdminConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users.admin_panel'

    verbose_name = 'System Administration'