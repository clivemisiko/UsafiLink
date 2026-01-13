from django.urls import path
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    ProfileView, 
    ToggleOnlineView,
    VerifyEmailView,
    ResendVerificationEmailView,
    ChangePasswordView,
    TwoFactorSetupView,
    TwoFactorVerifyView,
    TwoFactorDisableView,
    TwoFactorLoginView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ProfileView.as_view(), name='profile_me'),
    path('profile/', ProfileView.as_view(), name='profile_update'),
    path('toggle-online/', ToggleOnlineView.as_view(), name='toggle_online'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # 2FA endpoints
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa_setup'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa_verify'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa_disable'),
    path('2fa/login/', TwoFactorLoginView.as_view(), name='2fa_login'),
    
    # Email verification endpoints
    path('verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
]

