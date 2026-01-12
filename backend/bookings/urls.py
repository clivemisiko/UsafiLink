from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, PricingView

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
    path('estimate-price/', PricingView.as_view(), name='estimate-price'),
]
