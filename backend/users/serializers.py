from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    driver_license_number = serializers.CharField(required=False, allow_blank=True)
    driver_license_expiry_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'password2', 'email', 'role', 'phone_number',
            'first_name', 'last_name', 'driver_license_number', 'driver_license_expiry_date'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        username = attrs.get('username')
        phone_number = attrs.get('phone_number')

        # If an unverified user exists with this username, allow re-registration by updating that record.
        # If the existing user is verified, keep normal uniqueness behavior.
        if username:
            existing_by_username = User.objects.filter(username=username).first()
            if existing_by_username and getattr(existing_by_username, 'is_email_verified', False):
                raise serializers.ValidationError({"username": "This username is already taken."})

        # Prevent attaching a phone number that belongs to a *verified* different user.
        if phone_number:
            existing_by_phone = User.objects.filter(phone_number=phone_number).first()
            if existing_by_phone and getattr(existing_by_phone, 'is_email_verified', False):
                if not username or existing_by_phone.username != username:
                    raise serializers.ValidationError({"phone_number": "This phone number is already in use."})

        if attrs.get('role') == 'driver':
            license_number = attrs.get('driver_license_number')
            expiry_date = attrs.get('driver_license_expiry_date')

            if not license_number:
                raise serializers.ValidationError({
                    'driver_license_number': 'Driver license number is required for driver registration.'
                })
            if not expiry_date:
                raise serializers.ValidationError({
                    'driver_license_expiry_date': 'Driver license expiry date is required for driver registration.'
                })
            if expiry_date <= timezone.now().date():
                raise serializers.ValidationError({
                    'driver_license_expiry_date': 'Driver license expiry date must be in the future.'
                })

            existing_license = User.objects.filter(driver_license_number=license_number).first()
            if existing_license and existing_license.username != username:
                raise serializers.ValidationError({
                    'driver_license_number': 'This driver license number is already registered.'
                })

        return attrs

    def create(self, validated_data):
        password2 = validated_data.pop('password2', None)
        raw_password = validated_data.get('password')
        username = validated_data.get('username')

        existing = None
        if username:
            existing = User.objects.filter(username=username).first()

        # If there's an existing unverified account with same username, update it instead of creating a new row.
        if existing and not getattr(existing, 'is_email_verified', False):
            for field in ('email', 'role', 'phone_number', 'first_name', 'last_name', 'driver_license_number', 'driver_license_expiry_date'):
                if field in validated_data:
                    setattr(existing, field, validated_data[field])

            # Set driver approval status based on role
            if 'role' in validated_data:
                existing.is_driver_approved = validated_data['role'] != 'driver'

            if raw_password:
                existing.set_password(raw_password)

            # Reset verification token so user can verify the corrected email.
            if hasattr(existing, 'generate_verification_token'):
                existing.generate_verification_token()

            existing.save()
            return existing

        # Set driver approval status for new users
        validated_data['is_driver_approved'] = validated_data.get('role') != 'driver'

        user = User.objects.create_user(**validated_data)
        if raw_password:
            user.set_password(raw_password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'phone_number', 'first_name', 'last_name',
            'driver_license_number', 'driver_license_expiry_date', 'is_online', 'is_driver_approved', 'date_joined'
        )
        read_only_fields = ('username', 'role', 'date_joined')
