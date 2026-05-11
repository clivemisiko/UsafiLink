from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, PricingView, CustomerDisputeViewSet, DriverSlotViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'disputes', CustomerDisputeViewSet, basename='customer-dispute')
router.register(r'driver-slots', DriverSlotViewSet, basename='driver-slot')

urlpatterns = [
    path('', include(router.urls)),
    path('estimate-price/', PricingView.as_view(), name='estimate-price'),
]
