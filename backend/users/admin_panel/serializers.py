# backend/users/admin/serializers.py
from rest_framework import serializers
from users.models import User
from bookings.models import Booking
from payments.models import Payment
from .models import SystemLog, Dispute, Announcement

class UserSerializer(serializers.ModelSerializer):
    bookings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'is_active', 'is_online', 'date_joined',
            'last_login', 'bookings_count'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def get_bookings_count(self, obj):
        return obj.customer_bookings.count()

class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Booking
        fields = '__all__'

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
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = '__all__'