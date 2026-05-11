from rest_framework import serializers
from .models import Booking, Rating, DriverSlot
from users.admin_panel.models import Dispute


class CustomerDisputeSerializer(serializers.ModelSerializer):
    """Lightweight dispute serializer for customer view"""
    booking_id = serializers.ReadOnlyField(source='booking.id')
    booking = serializers.PrimaryKeyRelatedField(queryset=Dispute._meta.get_field('booking').related_model.objects.all(), write_only=True)

    class Meta:
        model = Dispute
        fields = ['id', 'booking', 'booking_id', 'reason', 'status', 'resolution', 'created_at', 'updated_at']
        read_only_fields = ['status', 'resolution', 'created_at', 'updated_at', 'raised_by']

class RatingSerializer(serializers.ModelSerializer):
    """Basic rating serializer for customer view"""
    customer_name = serializers.ReadOnlyField(source='customer.get_full_name')
    driver_name = serializers.ReadOnlyField(source='driver.get_full_name')
    
    class Meta:
        model = Rating
        fields = ['id', 'booking', 'customer', 'customer_name', 'driver', 'driver_name', 'score', 'comment', 'created_at']
        read_only_fields = ['customer', 'driver', 'created_at']

class RatingDetailSerializer(serializers.ModelSerializer):
    """Detailed rating serializer including admin review fields"""
    customer_name = serializers.ReadOnlyField(source='customer.get_full_name')
    driver_name = serializers.ReadOnlyField(source='driver.get_full_name')
    reviewed_by_name = serializers.ReadOnlyField(source='reviewed_by.get_full_name')
    
    class Meta:
        model = Rating
        fields = [
            'id', 'booking', 'customer', 'customer_name', 'driver', 'driver_name', 
            'score', 'comment', 'created_at',
            'is_reviewed_by_admin', 'admin_response', 'reviewed_by', 'reviewed_by_name',
            'is_flagged', 'flag_reason', 'reviewed_at'
        ]
        read_only_fields = ['customer', 'driver', 'created_at', 'reviewed_by', 'reviewed_at']

class RatingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ratings"""
    class Meta:
        model = Rating
        fields = ['booking', 'score', 'comment']

class RatingAdminReviewSerializer(serializers.ModelSerializer):
    """Serializer for admin to review and respond to ratings"""
    class Meta:
        model = Rating
        fields = ['admin_response', 'is_flagged', 'flag_reason']

class DriverRatingsStatsSerializer(serializers.Serializer):
    """Serializer for driver rating statistics"""
    driver_id = serializers.IntegerField()
    driver_name = serializers.CharField()
    average_rating = serializers.FloatField()
    total_ratings = serializers.IntegerField()
    five_star = serializers.IntegerField()
    four_star = serializers.IntegerField()
    three_star = serializers.IntegerField()
    two_star = serializers.IntegerField()
    one_star = serializers.IntegerField()
    recent_ratings = serializers.ListField()

class DriverSlotSerializer(serializers.ModelSerializer):
    """Serializer for viewing driver slots (customers and drivers)"""
    driver_name = serializers.ReadOnlyField(source='driver.get_full_name')
    driver_phone = serializers.ReadOnlyField(source='driver.phone_number')
    driver_id = serializers.ReadOnlyField(source='driver.id')
    label = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = DriverSlot
        fields = [
            'id', 'driver', 'driver_id', 'driver_name', 'driver_phone',
            'date', 'start_time', 'end_time', 'status', 'note',
            'label', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']


class DriverSlotCreateSerializer(serializers.ModelSerializer):
    """Serializer for drivers creating their own slots"""
    class Meta:
        model = DriverSlot
        fields = ['id', 'date', 'start_time', 'end_time', 'note']
        read_only_fields = ['status']

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time.")
        return data


class BookingSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()
    payment_id = serializers.SerializerMethodField()
    customer_name = serializers.ReadOnlyField(source='customer.get_full_name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone_number')
    driver_name = serializers.ReadOnlyField(source='driver.get_full_name')
    driver_phone = serializers.ReadOnlyField(source='driver.phone_number')
    rating_data = serializers.SerializerMethodField()

    # New Uber-like fields
    current_notified_driver_name = serializers.SerializerMethodField()
    driver_requests_count = serializers.SerializerMethodField()
    is_current_user_notified = serializers.SerializerMethodField()

    # Slot-based fields
    slot_data = serializers.SerializerMethodField()
    slot_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Booking
        exclude = ('slot',)
        read_only_fields = ('customer', 'driver', 'status', 'created_at', 'current_notified_driver')

    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except:
            return 'pending'

    def get_payment_id(self, obj):
        try:
            return obj.payment.id
        except:
            return None

    def get_rating_data(self, obj):
        try:
            return RatingSerializer(obj.rating).data
        except:
            return None
    
    def get_current_notified_driver_name(self, obj):
        """Get name of driver currently being notified"""
        if obj.current_notified_driver:
            return obj.current_notified_driver.get_full_name() or obj.current_notified_driver.username
        return None
    
    def get_driver_requests_count(self, obj):
        """Get count of drivers notified so far"""
        return obj.driver_requests.count()
    
    def get_is_current_user_notified(self, obj):
        """Check if current request user is the one being notified"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.current_notified_driver == request.user
        return False

    def get_slot_data(self, obj):
        """Get slot details if booking is linked to a slot"""
        if obj.slot:
            return DriverSlotSerializer(obj.slot).data
        return None

    def create(self, validated_data):
        # Remove slot_id from validated_data as it's not a model field
        validated_data.pop('slot_id', None)
        return super().create(validated_data)

    def to_representation(self, instance):
        res = super().to_representation(instance)
        if not res['customer_name']:
            res['customer_name'] = instance.customer.username
        if not instance.driver:
            res['driver_name'] = "Not Assigned"
        elif not res.get('driver_name'):
            res['driver_name'] = instance.driver.username
        return res
