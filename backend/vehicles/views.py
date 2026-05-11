from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import Vehicle, VehicleComplaint, DailyTrip, FuelLog
from .serializers import (
    VehicleSerializer, VehicleComplaintSerializer, 
    DailyTripSerializer, FuelLogSerializer
)
from users.models import User

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'

class IsDriver(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'driver'

class IsAdminOrDriver(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role in ['admin', 'driver']

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
    
    @action(detail=True, methods=['post'])
    def transfer_driver(self, request, pk=None):
        """Transfer a driver from one vehicle to another"""
        old_vehicle = self.get_object()
        new_vehicle_id = request.data.get('new_vehicle_id')
        
        try:
            new_vehicle = Vehicle.objects.get(id=new_vehicle_id)
            
            # Get current driver
            old_driver = old_vehicle.driver
            if not old_driver:
                return Response({'error': 'No driver assigned to current vehicle'}, status=400)
            
            # Check if new vehicle already has a driver
            if new_vehicle.driver and new_vehicle.driver != old_driver:
                return Response({'error': 'Target vehicle already has a driver'}, status=400)
            
            # Transfer driver
            old_vehicle.driver = None
            old_vehicle.save()
            
            new_vehicle.driver = old_driver
            new_vehicle.save()
            
            # Create a complaint record to track the transfer
            VehicleComplaint.objects.create(
                vehicle=old_vehicle,
                driver=old_driver,
                title='Driver Transfer',
                description=f'Driver transferred from {old_vehicle.plate_number} to {new_vehicle.plate_number}',
                status='transferred'
            )
            
            return Response({
                'status': f'Driver transferred from {old_vehicle.plate_number} to {new_vehicle.plate_number}'
            })
        except Vehicle.DoesNotExist:
            return Response({'error': 'Target vehicle not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def expiring_registrations(self, request):
        """Get vehicles with expiring insurance/registration"""
        expiring = Vehicle.objects.filter(
            Q(insurance_expiry_date__lte=timezone.now().date() + timedelta(days=7)) |
            Q(registration_expiry_date__lte=timezone.now().date() + timedelta(days=7))
        )
        serializer = self.get_serializer(expiring, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def driver_metrics(self, request):
        """Get fuel and revenue metrics for all drivers"""
        from bookings.models import Booking
        from django.db.models import Sum
        from decimal import Decimal

        drivers = User.objects.filter(role='driver').prefetch_related('vehicle', 'daily_trips', 'fuel_logs')
        metrics = []

        for driver in drivers:
            total_fuel = FuelLog.objects.filter(
                driver=driver,
                log_type='consumption'
            ).aggregate(total=Sum('liters'))['total'] or 0

            # Calculate total revenue from completed bookings (same as driver dashboard stats)
            total_revenue = Booking.objects.filter(
                driver=driver,
                status='completed'
            ).aggregate(total=Sum('final_price'))['total'] or Decimal('0.00')

            # Calculate total jobs from completed bookings
            total_jobs = Booking.objects.filter(
                driver=driver,
                status='completed'
            ).count()

            # Calculate total distance from completed bookings
            total_distance = Booking.objects.filter(
                driver=driver,
                status='completed'
            ).aggregate(total=Sum('distance_km'))['total'] or 0

            metrics.append({
                'driver_id': driver.id,
                'driver_name': driver.get_full_name(),
                'phone': driver.phone_number,
                'vehicle': driver.vehicle.plate_number if hasattr(driver, 'vehicle') and driver.vehicle else None,
                'total_fuel_consumed_liters': float(total_fuel),
                'total_revenue': float(total_revenue),
                'total_jobs': total_jobs,
                'total_distance_km': float(total_distance) if total_distance else 0,
                'is_online': driver.is_online
            })

        return Response(metrics)


class VehicleComplaintViewSet(viewsets.ModelViewSet):
    queryset = VehicleComplaint.objects.all()
    serializer_class = VehicleComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'driver':
            return VehicleComplaint.objects.filter(driver=self.request.user)
        elif self.request.user.role == 'admin':
            return VehicleComplaint.objects.all()
        return VehicleComplaint.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(driver=self.request.user)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Admin resolves a complaint"""
        complaint = self.get_object()
        if request.user.role != 'admin':
            return Response({'error': 'Only admins can resolve complaints'}, status=403)
        
        complaint.status = 'resolved'
        complaint.admin_notes = request.data.get('admin_notes', '')
        complaint.resolved_at = timezone.now()
        complaint.save()
        
        return Response({'status': 'Complaint resolved'})


class DailyTripViewSet(viewsets.ModelViewSet):
    queryset = DailyTrip.objects.all()
    serializer_class = DailyTripSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'driver':
            return DailyTrip.objects.filter(driver=self.request.user).order_by('-date')
        elif self.request.user.role == 'admin':
            return DailyTrip.objects.all().order_by('-date')
        return DailyTrip.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(driver=self.request.user)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's trip data for current driver"""
        from bookings.models import Booking
        from django.db.models import Sum
        from decimal import Decimal

        today = timezone.now().date()
        trip = DailyTrip.objects.filter(driver=request.user, date=today).first()

        # Calculate today's revenue from completed bookings
        today_revenue = Booking.objects.filter(
            driver=request.user,
            status='completed',
            completed_at__date=today
        ).aggregate(total=Sum('final_price'))['total'] or Decimal('0.00')

        # Calculate today's completed jobs count
        today_jobs = Booking.objects.filter(
            driver=request.user,
            status='completed',
            completed_at__date=today
        ).count()

        # Calculate today's distance from completed bookings
        today_distance = Booking.objects.filter(
            driver=request.user,
            status='completed',
            completed_at__date=today
        ).aggregate(total=Sum('distance_km'))['total'] or 0

        # Calculate today's waste emptied from completed bookings
        today_waste = Booking.objects.filter(
            driver=request.user,
            status='completed',
            completed_at__date=today
        ).aggregate(total=Sum('waste_emptied_liters'))['total'] or 0

        if not trip:
            # Return calculated data from bookings even if no DailyTrip record exists
            return Response({
                'driver': request.user.id,
                'date': today.isoformat(),
                'total_kilometers': float(today_distance) if today_distance else 0,
                'fuel_consumed_liters': 0,
                'waste_emptied_liters': float(today_waste) if today_waste else 0,
                'revenue_generated': float(today_revenue),
                'jobs_completed': today_jobs
            })

        # Merge DailyTrip data with calculated revenue from bookings
        data = self.get_serializer(trip).data
        data['revenue_generated'] = float(today_revenue)
        data['jobs_completed'] = today_jobs
        # Use booking data if DailyTrip data is zero
        if not data.get('total_kilometers') or data['total_kilometers'] == 0:
            data['total_kilometers'] = float(today_distance) if today_distance else 0
        if not data.get('waste_emptied_liters') or data['waste_emptied_liters'] == 0:
            data['waste_emptied_liters'] = float(today_waste) if today_waste else 0

        return Response(data)


class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'driver':
            return FuelLog.objects.filter(driver=self.request.user).order_by('-date')
        elif self.request.user.role == 'admin':
            return FuelLog.objects.all().order_by('-date')
        return FuelLog.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(driver=self.request.user)

