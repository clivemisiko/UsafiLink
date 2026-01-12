from rest_framework import serializers
from .models import DriverLocation

class DriverLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverLocation
        fields = '__all__'
        read_only_fields = ('driver',)
