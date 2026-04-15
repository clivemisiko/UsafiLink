from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DriverLocation
from .serializers import DriverLocationSerializer

class DriverLocationViewSet(viewsets.ModelViewSet):
    queryset = DriverLocation.objects.all()
    serializer_class = DriverLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Update or create driver location"""
        # Use update_or_create to avoid duplicate entries
        instance, created = DriverLocation.objects.update_or_create(
            driver=self.request.user,
            defaults={
                'latitude': serializer.validated_data['latitude'],
                'longitude': serializer.validated_data['longitude'],
                'heading': serializer.validated_data.get('heading'),
                'speed': serializer.validated_data.get('speed'),
                'accuracy': serializer.validated_data.get('accuracy'),
            }
        )
        serializer.instance = instance
    
    def perform_update(self, serializer):
        """Ensure driver can only update their own location"""
        if serializer.instance.driver != self.request.user:
            raise permissions.PermissionDenied("You can only update your own location")
        serializer.save()

    def get_queryset(self):
        """Drivers only see their location; Admins and customers see all"""
        user = self.request.user
        if user.role == 'driver':
            return self.queryset.filter(driver=user)
        return self.queryset
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """
        Get nearby online drivers.
        Query params: lat, lon, radius_km (optional, default 50)
        """
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius_km = float(request.query_params.get('radius_km', 50))
        
        if not lat or not lon:
            return Response(
                {'detail': 'lat and lon parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lat = float(lat)
        lon = float(lon)
        
        # Get all online drivers with locations
        from users.models import User
        online_drivers = User.objects.filter(
            role='driver',
            is_online=True,
            is_active=True,
            location__isnull=False
        ).select_related('location')
        
        # Calculate distances and filter by radius
        nearby_drivers = []
        for driver in online_drivers:
            try:
                distance = driver.location.distance_to(lat, lon)
                if distance <= radius_km:
                    location_data = DriverLocationSerializer(driver.location).data
                    location_data['distance_km'] = round(distance, 2)
                    location_data['driver_name'] = driver.get_full_name() or driver.username
                    location_data['driver_id'] = driver.id
                    nearby_drivers.append(location_data)
            except Exception:
                continue
        
        # Sort by distance
        nearby_drivers.sort(key=lambda x: x['distance_km'])
        
        return Response({
            'count': len(nearby_drivers),
            'drivers': nearby_drivers
        })
