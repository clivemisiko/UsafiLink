from rest_framework import serializers
from .models import DriverLocation, DriverOrderRequest

class DriverLocationSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DriverLocation
        fields = ['id', 'driver', 'driver_name', 'latitude', 'longitude', 
                  'heading', 'speed', 'accuracy', 'updated_at']
        read_only_fields = ('driver', 'updated_at')
    
    def get_driver_name(self, obj):
        return obj.driver.get_full_name() or obj.driver.username


class DriverOrderRequestSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    
    class Meta:
        model = DriverOrderRequest
        fields = ['id', 'booking', 'booking_id', 'driver', 'driver_name', 
                  'distance_km', 'notified_at', 'responded_at', 'status', 'queue_position']
        read_only_fields = ['notified_at', 'responded_at']
    
    def get_driver_name(self, obj):
        return obj.driver.get_full_name() or obj.driver.username
