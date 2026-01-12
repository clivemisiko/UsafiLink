from django.urls import path
from .views import RegisterView, CustomTokenObtainPairView, ProfileView, ToggleOnlineView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ProfileView.as_view(), name='profile_me'),
    path('profile/', ProfileView.as_view(), name='profile_update'),
    path('toggle-online/', ToggleOnlineView.as_view(), name='toggle_online'),
]
