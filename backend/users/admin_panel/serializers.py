# backend/users/admin/serializers.py
from rest_framework import serializers
from django.db import models
from users.models import User
from bookings.models import Booking
from payments.models import Payment
from .models import SystemLog, Dispute, Announcement

class UserSerializer(serializers.ModelSerializer):
    bookings_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    current_vehicle = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'is_active', 'is_online', 'date_joined',
            'last_login', 'bookings_count', 'driver_license_number', 
            'driver_license_expiry_date', 'is_license_expiring_soon', 'is_driver_approved',
            'average_rating', 'total_ratings', 'current_vehicle'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def get_bookings_count(self, obj):
        return obj.customer_bookings.count()
    
    def get_average_rating(self, obj):
        if obj.role != 'driver':
            return 0.0
        from bookings.models import Rating
        ratings = Rating.objects.filter(driver=obj)
        if ratings.exists():
            return round(ratings.aggregate(avg=models.Avg('score'))['avg'] or 0, 1)
        return 0.0
    
    def get_total_ratings(self, obj):
        if obj.role != 'driver':
            return 0
        from bookings.models import Rating
        return Rating.objects.filter(driver=obj).count()
    
    def get_current_vehicle(self, obj):
        if hasattr(obj, 'vehicle') and obj.vehicle:
            from vehicles.serializers import VehicleSerializer
            return VehicleSerializer(obj.vehicle).data
        return None

class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    driver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = '__all__'
    
    def get_driver_name(self, obj):
        if obj.driver:
            return obj.driver.get_full_name() or obj.driver.username
        return None

class PaymentSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='booking.customer.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
    
    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'location': obj.booking.location_name,
            'service_type': obj.booking.service_type,
        }

class DisputeSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    raised_by_name = serializers.CharField(source='raised_by.get_full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Dispute
        fields = '__all__'
    
    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'customer': obj.booking.customer.get_full_name(),
            'location': obj.booking.location_name,
            'amount': obj.booking.estimated_price,
        }

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

class SystemLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    user_role = serializers.CharField(source='user.role', read_only=True, allow_null=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S.%fZ', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = ['id', 'action', 'action_display', 'user', 'user_id', 'user_name', 'user_role', 
                  'details', 'ip_address', 'created_at']
