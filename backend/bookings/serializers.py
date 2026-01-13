from rest_framework import serializers
from .models import Booking, Rating

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'booking', 'customer', 'driver', 'score', 'comment', 'created_at']
        read_only_fields = ['customer', 'driver', 'created_at']

class BookingSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()
    payment_id = serializers.SerializerMethodField()
    customer_name = serializers.ReadOnlyField(source='customer.get_full_name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone_number')
    driver_name = serializers.ReadOnlyField(source='driver.get_full_name')
    rating_data = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('customer', 'driver', 'status', 'created_at')

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

    def to_representation(self, instance):
        res = super().to_representation(instance)
        if not res['customer_name']:
            res['customer_name'] = instance.customer.username
        if not instance.driver:
            res['driver_name'] = "Not Assigned"
        elif not res.get('driver_name'):
            res['driver_name'] = instance.driver.username
        return res
