import pyotp
import qrcode
import io
import base64
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .email_utils import send_verification_email, send_welcome_email

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # We need to check if 2FA is required BEFORE issuing tokens
        username = attrs.get(self.username_field)
        password = attrs.get('password')
        
        try:
            user = User.objects.get(username=username)
            if user.check_password(password):
                # Check if email is verified
                if not user.is_email_verified:
                    raise serializers.ValidationError({
                        'detail': 'Email not verified. Please check your email for the verification link.',
                        'email_verified': False,
                        'email': user.email
                    })
                
                # Check if 2FA is enabled
                if user.is_two_factor_enabled:
                    # Don't return tokens yet, just tell the frontend 2FA is required
                    return {
                        'two_factor_required': True,
                        'user_id': user.id,
                        'username': user.username
                    }
        except User.DoesNotExist:
            pass

        # If 2FA not required or user is incorrect, let super() handle it
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'phone_number': self.user.phone_number,
            'is_email_verified': self.user.is_email_verified,
            'is_two_factor_enabled': self.user.is_two_factor_enabled
        }
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class TwoFactorLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        token = request.data.get('token')
        
        if not all([username, password, token]):
            return Response({'detail': 'Username, password and 2FA token are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(username=username)
            if user.check_password(password):
                if not user.is_two_factor_enabled:
                    return Response({'detail': 'Two-Factor Authentication is not enabled for this account.'}, status=status.HTTP_400_BAD_REQUEST)
                
                totp = pyotp.TOTP(user.two_factor_secret)
                if totp.verify(token):
                    # Generate regular JWT tokens
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken.for_user(user)
                    
                    return Response({
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'role': user.role,
                            'is_two_factor_enabled': True
                        }
                    })
                else:
                    return Response({'detail': 'Invalid 2FA token.'}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

class TwoFactorSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.is_two_factor_enabled:
            return Response({'detail': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Generate new secret if not exists
        if not user.two_factor_secret:
            user.two_factor_secret = pyotp.random_base32()
            user.save(update_fields=['two_factor_secret'])
            
        # Generate TOTP provisioning URL
        totp = pyotp.TOTP(user.two_factor_secret)
        provisioning_url = totp.provisioning_uri(name=user.email, issuer_name="UsafiLink")
        
        # Generate QR code image
        img = qrcode.make(provisioning_url)
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return Response({
            'secret': user.two_factor_secret,
            'provisioning_url': provisioning_url,
            'qr_code': f"data:image/png;base64,{qr_base64}"
        })

class TwoFactorVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        token = request.data.get('token')
        
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.two_factor_secret:
            return Response({'detail': '2FA has not been initiated.'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(token):
            user.is_two_factor_enabled = True
            user.save(update_fields=['is_two_factor_enabled'])
            return Response({'detail': 'Two-Factor Authentication enabled successfully.'})
        else:
            return Response({'detail': 'Invalid token. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        token = request.data.get('token')
        
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(token):
            user.is_two_factor_enabled = False
            user.two_factor_secret = None
            user.save(update_fields=['is_two_factor_enabled', 'two_factor_secret'])
            return Response({'detail': 'Two-Factor Authentication disabled successfully.'})
        else:
            return Response({'detail': 'Invalid token. Verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print('RegisterView received data:', request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print('RegisterView serializer errors:', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = serializer.save()
        
        # Send verification email
        try:
            frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
            email_sent = send_verification_email(user, frontend_url)
            if email_sent:
                print(f'✅ EMAIL SUCCESS: Verification email sent to {user.email}')
            else:
                print(f'❌ EMAIL FAILURE: Failed to send verification email to {user.email}')
        except Exception as e:
            print(f'⚠️ EMAIL ERROR: {e}')
        
        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        response_data['message'] = 'Registration successful! Please check your email to verify your account.'
        
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        """Verify email using the token"""
        try:
            user = User.objects.get(email_verification_token=token)
            
            # Check if token is expired (24 hours)
            token_age = timezone.now() - user.token_created_at
            if token_age > timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS):
                return Response({
                    'detail': 'Verification link has expired. Please request a new one.',
                    'expired': True
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if already verified
            if user.is_email_verified:
                return Response({
                    'detail': 'Email already verified. You can login now.',
                    'already_verified': True
                }, status=status.HTTP_200_OK)
            
            # Verify the email
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])
            
            # Send welcome email
            try:
                send_welcome_email(user)
            except Exception as e:
                print(f'Error sending welcome email: {e}')
            
            return Response({
                'detail': 'Email verified successfully! You can now login.',
                'verified': True,
                'user': {
                    'email': user.email,
                    'username': user.username,
                    'role': user.role
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'detail': 'Invalid verification link.',
                'invalid': True
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Resend verification email"""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'detail': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            if user.is_email_verified:
                return Response({
                    'detail': 'Email is already verified. You can login now.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new token
            user.generate_verification_token()
            
            # Send verification email
            frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
            send_verification_email(user, frontend_url)
            
            return Response({
                'detail': 'Verification email sent successfully. Please check your inbox.',
                'email': user.email
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response({
                'detail': 'If this email is registered, a verification link will be sent.'
            }, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({'detail': 'Both old and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({'detail': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            return Response({'detail': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        # We can either deactivate or permanently delete.
        # Usually, deactivation is safer for audit trails, but "Delete Account" often implies permanent removal.
        # The user requested "delete an account".
        user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

class ToggleOnlineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'driver' and not request.user.is_superuser:
            return Response({'detail': 'Only drivers can toggle online status.'}, status=status.HTTP_403_FORBIDDEN)
        
        request.user.is_online = not request.user.is_online
        request.user.save()
        
        return Response({
            'is_online': request.user.is_online,
            'detail': f"You are now {'online' if request.user.is_online else 'offline'}."
        })


