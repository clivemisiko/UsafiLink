from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vehicle
from .serializers import VehicleSerializer
from users.models import User

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return Vehicle.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        vehicle = self.get_object()
        driver_id = request.data.get('driver_id')

        if not driver_id:
            # Unassign
            vehicle.driver = None
            vehicle.save()
            return Response({'status': 'Driver unassigned'})

        try:
            driver = User.objects.get(id=driver_id, role='driver')
            
            # Check if driver already has a vehicle
            if hasattr(driver, 'vehicle') and driver.vehicle != vehicle:
                 return Response({'error': 'Driver already assigned to another vehicle'}, status=400)

            vehicle.driver = driver
            vehicle.save()
            return Response({'status': f'Vehicle assigned to {driver.username}'})
        except User.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
