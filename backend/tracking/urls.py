from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverLocationViewSet

router = DefaultRouter()
router.register(r'driver-locations', DriverLocationViewSet, basename='driverlocation')

urlpatterns = [
    path('', include(router.urls)),
]
