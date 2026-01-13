from rest_framework import serializers
from .models import Payment, TransactionLog
from bookings.models import Booking

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['booking', 'amount', 'payment_method', 'mpesa_receipt']
        read_only_fields = ['status', 'created_at']

class PaymentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['status', 'mpesa_receipt', 'notes']
        read_only_fields = ['booking', 'amount', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('status', 'created_at', 'updated_at')
    
    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'location': obj.booking.location_name,
            'scheduled_date': obj.booking.scheduled_date,
            'service_type': obj.booking.service_type
        }
    
    def get_customer_name(self, obj):
        return obj.booking.customer.get_full_name() or obj.booking.customer.username

class MpesaSTKPushSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField(required=True)
    phone_number = serializers.CharField(required=True, max_length=15)
    
    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking does not exist.")
        return value
    
    def validate_phone_number(self, value):
        # Basic phone validation for Kenya
        value = value.strip().replace(' ', '').replace('-', '')
        
        if value.startswith('0'):
            if len(value) != 10:
                raise serializers.ValidationError("Invalid phone number format.")
        elif value.startswith('254'):
            if len(value) != 12:
                raise serializers.ValidationError("Invalid phone number format.")
        elif value.startswith('+254'):
            value = value[1:]
            if len(value) != 12:
                raise serializers.ValidationError("Invalid phone number format.")
        else:
            raise serializers.ValidationError("Phone number must start with 0, 254, or +254.")
        
        return value

class BankTransferSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField(required=True)
    bank_reference = serializers.CharField(required=True, max_length=50)

    def validate_booking_id(self, value):
        try:
            Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking does not exist.")
        return value

class TransactionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionLog
        fields = '__all__'