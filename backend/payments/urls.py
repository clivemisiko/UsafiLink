from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet, 
    MpesaCallbackView,
    MpesaC2BValidationView,
    MpesaC2BConfirmationView,
    PaymentWebhookView,
    PaymentReportView
)

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    
    # M-PESA endpoints
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa-callback'),
    path('mpesa/c2b/validation/', MpesaC2BValidationView.as_view(), name='mpesa-c2b-validation'),
    path('mpesa/c2b/confirmation/', MpesaC2BConfirmationView.as_view(), name='mpesa-c2b-confirmation'),
    
    # Webhooks for other providers
    path('webhook/<str:provider>/', PaymentWebhookView.as_view(), name='payment-webhook'),
    
    # Reports
    path('reports/', PaymentReportView.as_view(), name='payment-reports'),
    
    # Additional actions
    path('payments/<int:pk>/retry/', 
         PaymentViewSet.as_view({'post': 'retry_payment'}), 
         name='payment-retry'),
    path('payments/<int:pk>/cancel/', 
         PaymentViewSet.as_view({'post': 'cancel_payment'}), 
         name='payment-cancel'),
    path('payments/<int:pk>/status/', 
         PaymentViewSet.as_view({'get': 'payment_status'}), 
         name='payment-status'),
]