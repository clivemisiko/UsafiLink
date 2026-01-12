# backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls), 
    
    # My custom admin API
    path('api/admin/', include('users.admin_panel.urls')),  # FIX THIS LINE
    
    # Other API endpoints
    path('api/users/', include('users.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/tracking/', include('tracking.urls')),
]