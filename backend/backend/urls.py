# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import AllowAny

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"status": "ok"})
    
    def head(self, request):
        return Response({"status": "ok"})

urlpatterns = [
    path('', HealthCheckView.as_view()),
    path('admin/', admin.site.urls), 
    
    # My custom admin API
    path('api/admin/', include('users.admin_panel.urls')),
    
    # Other API endpoints
    path('api/users/', include('users.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/tracking/', include('tracking.urls')),
]