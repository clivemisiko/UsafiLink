from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet, 
    IntasendCallbackView,
    PaymentWebhookView,
    PaymentReportView
)

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    
    # Intasend payment endpoints
    path('intasend/callback/', IntasendCallbackView.as_view(), name='intasend-callback'),
    
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
         PaymentViewSet.as_view({'get': 'status'}), 
         name='payment-status'),
    path('payments/<int:pk>/receipt/', 
         PaymentViewSet.as_view({'get': 'receipt'}), 
         name='payment-receipt'),
]