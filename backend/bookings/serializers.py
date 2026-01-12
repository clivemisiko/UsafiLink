from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()
    customer_name = serializers.ReadOnlyField(source='customer.get_full_name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone_number')

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('customer', 'driver', 'status', 'created_at')

    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except:
            return 'pending'

    def to_representation(self, instance):
        res = super().to_representation(instance)
        if not res['customer_name']:
            res['customer_name'] = instance.customer.username
        return res
