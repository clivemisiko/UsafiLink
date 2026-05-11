from rest_framework import serializers
from .models import Vehicle, VehicleComplaint, DailyTrip, FuelLog
from users.serializers import UserSerializer
from users.models import User

class VehicleSerializer(serializers.ModelSerializer):
    driver_details = UserSerializer(source='driver', read_only=True)
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='driver'),
        source='driver',
        write_only=True,
        required=False,
        allow_null=True
    )
    insurance_expiring_soon = serializers.SerializerMethodField()
    registration_expiring_soon = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'plate_number', 'vehicle_type', 'capacity', 
            'make', 'model', 'year', 'is_active', 
            'driver', 'driver_id', 'driver_details', 'created_at',
            'insurance_expiry_date', 'registration_expiry_date',
            'service_status', 'last_service_date', 'next_service_date',
            'service_notes', 'insurance_expiring_soon', 'registration_expiring_soon'
        ]
        read_only_fields = ['created_at', 'insurance_expiring_soon', 'registration_expiring_soon']
    
    def get_insurance_expiring_soon(self, obj):
        return obj.is_insurance_expiring_soon()
    
    def get_registration_expiring_soon(self, obj):
        return obj.is_registration_expiring_soon()


class VehicleComplaintSerializer(serializers.ModelSerializer):
    driver_details = UserSerializer(source='driver', read_only=True)
    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)
    
    class Meta:
        model = VehicleComplaint
        fields = [
            'id', 'vehicle', 'vehicle_details', 'driver', 'driver_details',
            'title', 'description', 'status', 'created_at', 'updated_at',
            'admin_notes', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'resolved_at']


class DailyTripSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.plate_number', read_only=True)
    
    class Meta:
        model = DailyTrip
        fields = [
            'id', 'driver', 'driver_name', 'vehicle', 'vehicle_plate', 'date',
            'total_kilometers', 'fuel_consumed_liters', 'waste_emptied_liters',
            'revenue_generated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class FuelLogSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.plate_number', read_only=True)
    
    class Meta:
        model = FuelLog
        fields = [
            'id', 'driver', 'driver_name', 'vehicle', 'vehicle_plate',
            'log_type', 'liters', 'cost', 'date', 'notes'
        ]
        read_only_fields = ['date']

