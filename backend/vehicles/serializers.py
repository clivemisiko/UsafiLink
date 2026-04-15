from rest_framework import serializers
from .models import Vehicle
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

    class Meta:
        model = Vehicle
        fields = [
            'id', 'plate_number', 'vehicle_type', 'capacity', 
            'make', 'model', 'year', 'is_active', 
            'driver', 'driver_id', 'driver_details', 'created_at'
        ]
        read_only_fields = ['created_at']
