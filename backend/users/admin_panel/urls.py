# backend/users/admin/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminDashboardView,
    AdminUserViewSet,
    AdminBookingViewSet,
    DisputeViewSet,
    SystemLogViewSet,
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'bookings', AdminBookingViewSet, basename='admin-booking')
router.register(r'disputes', DisputeViewSet, basename='admin-dispute')
router.register(r'logs', SystemLogViewSet, basename='admin-log')

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('', include(router.urls)),
]