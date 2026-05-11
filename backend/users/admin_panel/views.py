# backend/users/admin/views.py
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User
from tracking.models import DriverLocation
from tracking.serializers import DriverLocationSerializer
from bookings.models import Booking
from payments.models import Payment
from .models import SystemLog, Dispute, Announcement
from .serializers import (
    UserSerializer,
    BookingSerializer,
    PaymentSerializer,
    DisputeSerializer,
    AnnouncementSerializer,
    SystemLogSerializer
)
from .services import log_system_action

# In users/admin_panel/views.py, update the permission classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'
class AdminDashboardView(APIView):
    authentication_classes = [JWTAuthentication]  # Add this
    permission_classes = [IsAuthenticated, IsAdmin]  # Make sure both are there
    
    def get(self, request):
        # Date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # User stats
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        
        users_by_role = User.objects.values('role').annotate(count=Count('id'))
        
        # Booking stats
        total_bookings = Booking.objects.count()
        bookings_today = Booking.objects.filter(created_at__date=today).count()
        bookings_week = Booking.objects.filter(created_at__date__gte=week_ago).count()
        
        bookings_by_status = Booking.objects.values('status').annotate(count=Count('id'))
        
        # Revenue stats
        total_revenue = Payment.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        revenue_today = Payment.objects.filter(status='paid', created_at__date=today).aggregate(total=Sum('amount'))['total'] or 0
        revenue_week = Payment.objects.filter(status='paid', created_at__date__gte=week_ago).aggregate(total=Sum('amount'))['total'] or 0
        
        # Driver stats
        active_drivers = User.objects.filter(role='driver', is_active=True).count()
        online_drivers = User.objects.filter(role='driver', is_online=True).count()
        
        # Dispute stats
        pending_disputes = Dispute.objects.filter(status='pending').count()

        # Rating stats
        from bookings.models import Rating
        from django.db.models import Avg
        avg_rating = Rating.objects.aggregate(Avg('score'))['score__avg'] or 5.0
        
        # Recent activities
        recent_logs = SystemLog.objects.select_related('user').order_by('-created_at')[:10]
        
        data = {
            'overview': {
                'total_users': total_users,
                'total_bookings': total_bookings,
                'total_revenue': float(total_revenue),
                'active_drivers': active_drivers,
                'online_drivers': online_drivers,
                'pending_disputes': pending_disputes,
                'avg_rating': round(float(avg_rating), 1),
            },
            'today': {
                'new_users': new_users_today,
                'new_bookings': bookings_today,
                'revenue': float(revenue_today),
            },
            'weekly': {
                'new_users': new_users_week,
                'new_bookings': bookings_week,
                'revenue': float(revenue_week),
            },
            'breakdown': {
                'users_by_role': list(users_by_role),
                'bookings_by_status': list(bookings_by_status),
            },
            'recent_activities': SystemLogSerializer(recent_logs, many=True).data,
        }
        
        return Response(data)

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filters
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
            
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        user = serializer.save()
        ip_address = self.request.META.get('HTTP_X_FORWARDED_FOR', self.request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='user_created',
            user=self.request.user,
            details={
                'created_user_id': user.id,
                'created_user_email': user.email,
                'created_user_role': user.role,
            },
            ip_address=ip_address,
        )

    def perform_update(self, serializer):
        user = serializer.save()
        ip_address = self.request.META.get('HTTP_X_FORWARDED_FOR', self.request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='user_updated',
            user=self.request.user,
            details={
                'updated_user_id': user.id,
                'updated_user_email': user.email,
                'updated_user_role': user.role,
            },
            ip_address=ip_address,
        )

    def perform_destroy(self, instance):
        log_system_action(
            action='user_deleted',
            user=self.request.user,
            details={
                'deleted_user_id': instance.id,
                'deleted_user_email': instance.email,
                'deleted_user_role': instance.role,
            },
            ip_address=self.request.META.get('HTTP_X_FORWARDED_FOR', self.request.META.get('REMOTE_ADDR')),
        )
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='user_updated',
            user=request.user,
            details={
                'user_id': user.id,
                'action': 'activate',
                'is_active': user.is_active,
            },
            ip_address=ip_address,
        )
        return Response({'status': 'User activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='user_updated',
            user=request.user,
            details={
                'user_id': user.id,
                'action': 'deactivate',
                'is_active': user.is_active,
            },
            ip_address=ip_address,
        )
        return Response({'status': 'User deactivated'})
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['customer', 'driver', 'admin']:
            return Response({'error': 'Invalid role'}, status=400)
        
        previous_role = user.role
        user.role = new_role
        user.save()
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='user_updated',
            user=request.user,
            details={
                'user_id': user.id,
                'previous_role': previous_role,
                'new_role': new_role,
            },
            ip_address=ip_address,
        )
        return Response({'status': f'Role changed to {new_role}'})

class AdminBookingViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('customer', 'driver')
        
        # Filters
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
            
        return queryset

class DriverLocationViewSet(viewsets.ViewSet):
    """Admin view for all driver locations"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def list(self, request):
        """Get all active driver locations for live map"""
        online_drivers = User.objects.filter(
            role='driver',
            is_online=True,
            is_active=True,
            location__isnull=False
        ).select_related('location')
        
        locations = []
        for driver in online_drivers:
            location_data = DriverLocationSerializer(driver.location).data
            location_data['driver_name'] = driver.get_full_name() or driver.username
            location_data['driver_id'] = driver.id
            location_data['driver_phone'] = driver.phone_number
            location_data['vehicle_info'] = getattr(driver, 'vehicle_info', None)
            locations.append(location_data)
        
        return Response({
            'count': len(locations),
            'locations': locations
        })
    
    @action(detail=False, methods=['get'])
    def all_drivers(self, request):
        """Get all drivers with their locations (for admin map)"""
        drivers = User.objects.filter(
            role='driver',
            is_active=True,
            location__isnull=False
        ).select_related('location')
        
        locations = []
        for driver in drivers:
            location_data = DriverLocationSerializer(driver.location).data
            location_data['driver_name'] = driver.get_full_name() or driver.username
            location_data['driver_id'] = driver.id
            location_data['driver_phone'] = driver.phone_number
            location_data['is_online'] = driver.is_online
            location_data['is_approved'] = getattr(driver, 'is_driver_approved', False)
            locations.append(location_data)
        
        return Response({
            'count': len(locations),
            'locations': locations
        })

class DisputeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('booking', 'raised_by', 'resolved_by')
        
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        dispute = self.get_object()
        resolution = request.data.get('resolution')
        
        if not resolution:
            return Response({'error': 'Resolution text is required'}, status=400)
        
        dispute.resolution = resolution
        dispute.status = 'resolved'
        dispute.resolved_by = request.user
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        # Log the action
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='booking_updated',
            user=request.user,
            details={
                'dispute_id': dispute.id,
                'booking_id': dispute.booking.id,
                'action': 'resolve_dispute',
                'resolution': resolution,
                'raised_by': dispute.raised_by.get_full_name() if dispute.raised_by else 'Unknown'
            },
            ip_address=ip_address,
        )
        
        return Response({'status': 'Dispute resolved'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        dispute = self.get_object()
        dispute.status = 'dismissed'
        dispute.resolved_by = request.user
        dispute.resolved_at = timezone.now()
        dispute.save()
        
        # Log the action
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        log_system_action(
            action='booking_updated',
            user=request.user,
            details={
                'dispute_id': dispute.id,
                'booking_id': dispute.booking.id,
                'action': 'dismiss_dispute',
                'raised_by': dispute.raised_by.get_full_name() if dispute.raised_by else 'Unknown'
            },
            ip_address=ip_address,
        )
        
        return Response({'status': 'Dispute dismissed'})

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('user')
        
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
            
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
            
        return queryset