from rest_framework import viewsets, permissions
from .models import DriverLocation
from .serializers import DriverLocationSerializer

class DriverLocationViewSet(viewsets.ModelViewSet):
    queryset = DriverLocation.objects.all()
    serializer_class = DriverLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Set driver to current user
        serializer.save(driver=self.request.user)

    def get_queryset(self):
        # Drivers only see their location; Admins see all
        user = self.request.user
        if user.role == 'driver':
            return self.queryset.filter(driver=user)
        return self.queryset
