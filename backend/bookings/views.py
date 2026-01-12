from rest_framework.decorators import action
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from notifications.tasks import send_booking_confirmation_task, send_driver_on_the_way_task
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter queryset based on user role.
        Customers see their own bookings.
        Drivers see bookings assigned to them.
        Admins see all bookings.
        """
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'customer':
                return Booking.objects.filter(customer=user)
            elif user.role == 'driver':
                return Booking.objects.filter(driver=user)
            elif user.role == 'admin':
                return Booking.objects.all()
        return Booking.objects.none() # Should not happen if IsAuthenticated

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def available(self, request):
        """
        Get available bookings for drivers (pending and unassigned).
        """
        if request.user.role != 'driver' and not request.user.is_superuser:
            return Response({'detail': 'Only drivers can view available bookings.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Filter for pending bookings that have no driver assigned
        available_bookings = Booking.objects.filter(status='pending', driver__isnull=True)
        
        serializer = self.get_serializer(available_bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get summary statistics for the dashboard.
        """
        user = request.user
        bookings = self.get_queryset()
        
        total = bookings.count()
        completed = bookings.filter(status='completed').count()
        pending = bookings.filter(status='pending').count()
        cancelled = bookings.filter(status='cancelled').count()
        
        # Calculate earnings/spent
        from django.db.models import Sum, Q
        from decimal import Decimal

        if user.role == 'driver':
            # For drivers: Earnings from completed jobs
            earnings_total = bookings.filter(status='completed').aggregate(
                total=Sum('final_price')
            )['total'] or Decimal('0.00')
            
            # Additional stats for drivers
            today = timezone.now().date()
            today_earnings = bookings.filter(
                status='completed', 
                completed_at__date=today
            ).aggregate(total=Sum('final_price'))['total'] or Decimal('0.00')
            
            today_jobs = bookings.filter(
                status='completed', 
                completed_at__date=today
            ).count()

            return Response({
                'summary': {
                    'jobs_done': completed,
                    'total_jobs': total,
                    'earnings': float(earnings_total),
                    'rating': 4.8, # Mock rating until we have a rating model
                    'hours_online': 0 # Mock until we have a shift/tracking model
                },
                'stats_table': {
                    'today': {'earnings': float(today_earnings), 'jobs': today_jobs},
                    'week': {'earnings': float(earnings_total), 'jobs': completed}, # Simplified for now
                    'month': {'earnings': float(earnings_total), 'jobs': completed}
                }
            })
            
        elif user.role == 'admin' or user.is_superuser:
            # System-wide stats
            all_bookings = Booking.objects.all()
            total_revenue = all_bookings.filter(status='completed').aggregate(
                total=Sum('final_price')
            )['total'] or Decimal('0.00')
            
            active_bookings = all_bookings.filter(status__in=['pending', 'accepted', 'started', 'arrived']).count()
            
            from users.models import User
            available_drivers = User.objects.filter(role='driver').count() # Simplified
            
            return Response({
                'revenue': {
                    'today': float(total_revenue), # Simplified
                    'week': float(total_revenue),
                    'month': float(total_revenue),
                    'ytd': float(total_revenue)
                },
                'quickStats': {
                    'active_bookings': active_bookings,
                    'available_drivers': available_drivers,
                    'pending_payments': all_bookings.filter(payment__status='pending').count(),
                    'support_tickets': 0
                }
            })

        else:
            # For customers
            spent_total = bookings.filter(status='completed').aggregate(
                total=Sum('final_price')
            )['total'] or Decimal('0.00')
            
            return Response({
                'total': total,
                'completed': completed,
                'pending': pending,
                'cancelled': cancelled,
                'spent': float(spent_total)
            })

    def perform_create(self, serializer):
        """Create booking and send confirmation SMS"""
        booking = serializer.save(customer=self.request.user)
        
        # Send confirmation SMS asynchronously
        try:
            send_booking_confirmation_task.delay(booking.id)
        except Exception as e:
            logger.error(f"Failed to queue confirmation SMS: {str(e)}")
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if booking.status != 'pending':
            return Response({'detail': 'Booking cannot be accepted.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if booking.driver is not None and booking.driver != request.user:
            return Response({'detail': 'Booking already assigned to another driver.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is a driver or admin/superuser
        is_driver = hasattr(request.user, 'role') and request.user.role == 'driver'
        is_admin = (hasattr(request.user, 'role') and request.user.role == 'admin') or request.user.is_superuser
        
        print(f"ACCEPT LOG: User={request.user.username}, Role={getattr(request.user, 'role', 'N/A')}, IsAdminOrSuper={is_admin}, Status={booking.status}")

        if not (is_driver or is_admin):
            print(f"ACCEPT FAILED: Permission denied for {request.user.username}")
            return Response({'detail': 'Only drivers or admins can accept bookings.'}, status=status.HTTP_403_FORBIDDEN)

        booking.driver = request.user
        booking.status = 'accepted'
        booking.save()
        print(f"ACCEPT SUCCESS: Booking {booking.id} accepted by {request.user.username}")
        
        # Send SMS to customer that driver is assigned
        try:
            send_driver_on_the_way_task.delay(
                booking.id, 
                booking.driver.get_full_name() or booking.driver.username,
                "30 minutes"  # You can calculate ETA based on distance
            )
        except Exception as e:
            logger.error(f"Failed to send driver assignment SMS: {str(e)}")
        
        return Response({'detail': 'Booking accepted.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        """Mark booking as started (On the Way)"""
        booking = self.get_object()
        if booking.status != 'accepted':
            return Response({'detail': 'Job must be accepted before starting.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if booking.driver != request.user:
            return Response({'detail': 'Not your job.'}, status=status.HTTP_403_FORBIDDEN)

        booking.status = 'started'
        booking.save()
        return Response({'detail': 'Job started. You are now on the way.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def arrive(self, request, pk=None):
        """Mark booking as arrived"""
        booking = self.get_object()
        if booking.status != 'started':
            return Response({'detail': 'Job must be started before arrival.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if booking.driver != request.user:
            return Response({'detail': 'Not your job.'}, status=status.HTTP_403_FORBIDDEN)

        booking.status = 'arrived'
        booking.save()
        return Response({'detail': 'Arrived at destination.'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, pk=None):
        """Complete booking"""
        booking = self.get_object()
        
        # Idempotency check
        if booking.status == 'completed':
             return Response({'detail': 'Booking is already completed.'}, status=status.HTTP_200_OK)

        if booking.status not in ['accepted', 'started', 'arrived']:
            return Response({'detail': f'Only ongoing bookings can be completed. Current status: {booking.status}'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        is_admin = (hasattr(request.user, 'role') and request.user.role == 'admin') or request.user.is_superuser
        if booking.driver != request.user and not is_admin:
            return Response({'detail': 'Only assigned driver or admin can complete booking.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Determine final price (could be calculated or passed in request) 
        final_price = booking.estimated_price
        
        # Use transaction to ensure data integrity
        from django.db import transaction
        from payments.models import Payment
        
        with transaction.atomic():
            booking.status = 'completed'
            booking.completed_at = timezone.now()
            booking.final_price = final_price
            booking.save()
            
            # Create Invoice/Payment record if not exists
            if not hasattr(booking, 'payment'):
                Payment.objects.create(
                    booking=booking,
                    amount=final_price,
                    status='pending',
                    payment_method='mpesa' # Default, user can change later
                )
        
        # Send completion SMS
        try:
            from notifications.tasks import send_sms_task
            message = f"Service for booking #{booking.id} completed! An invoice of KES {final_price} has been generated. Please login to pay."
            send_sms_task.delay(booking.customer.phone_number, message)
        except Exception as e:
            logger.error(f"Failed to send completion SMS: {str(e)}")
            # Continue without failing the request
        
        return Response({'detail': 'Booking completed successfully. Invoice generated.'})

from rest_framework.views import APIView

class PricingView(APIView):
    permission_classes = [permissions.AllowAny] # Or IsAuthenticated

    def post(self, request):
        service_type = request.data.get('service_type', 'septic')
        tank_size = request.data.get('tank_size', '1000')
        
        # Simple pricing logic
        base_price = 2
        
        tank_prices = {
            '10': 1,
            '2000': 2000,
            '3000': 3000,
            '5000': 5000,
            '10000': 10000
        }
        
        tank_charge = tank_prices.get(str(tank_size), 0)
        distance_charge = 0 
        
        total = base_price + tank_charge + distance_charge
        
        return Response({
            'base_price': base_price,
            'tank_charge': tank_charge,
            'distance_charge': distance_charge,
            'total': total
        })