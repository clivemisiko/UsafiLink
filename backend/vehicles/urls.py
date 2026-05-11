from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, VehicleComplaintViewSet, DailyTripViewSet, FuelLogViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'complaints', VehicleComplaintViewSet, basename='complaint')
router.register(r'daily-trips', DailyTripViewSet, basename='daily-trip')
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')

urlpatterns = [
    path('', include(router.urls)),
]

