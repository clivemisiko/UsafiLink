from rest_framework.decorators import action
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from notifications.tasks import send_booking_confirmation_task, send_driver_on_the_way_task, send_driver_accepted_task
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
        return Booking.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def available(self, request):
        """Get available bookings for drivers (Uber-like notification system)."""
        if request.user.role != 'driver' and not request.user.is_superuser:
            return Response({'detail': 'Only drivers can view available bookings.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Only allow online drivers to see jobs
        if not request.user.is_online:
            return Response({'detail': 'You must be online to receive jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Priority 1: Bookings where this driver is the SPECIFIC notified driver
        # These are urgent "Incoming Job" requests
        incoming_bookings = Booking.objects.filter(
            status__in=['pending', 'searching_driver'],
            current_notified_driver=request.user
        )
        
        # Priority 2: General pool (legacy or fallback) - 'searching_driver' with no specific target yet?
        # Actually, in Uber system, you usually don't see a "pool" unless it's scheduled/later.
        # But we can keep legacy behavior for 'pending' requests that somehow didn't go through matching
        pool_bookings = Booking.objects.filter(
            status='pending', 
            driver__isnull=True,
            current_notified_driver__isnull=True
        )
        
        # Combine
        combined = incoming_bookings | pool_bookings
        
        serializer = self.get_serializer(combined.distinct(), many=True)
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

            # Calculate average rating
            from .models import Rating
            from django.db.models import Avg
            avg_rating = Rating.objects.filter(driver=user).aggregate(Avg('score'))['score__avg'] or 5.0

            return Response({
                'summary': {
                    'jobs_done': completed,
                    'total_jobs': total,
                    'earnings': float(earnings_total),
                    'rating': round(float(avg_rating), 1),
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
            
            from .models import Rating
            from django.db.models import Avg
            avg_system_rating = Rating.objects.aggregate(Avg('score'))['score__avg'] or 5.0

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
                    'support_tickets': 0, # Placeholder for future ticket system
                    'avg_rating': round(float(avg_system_rating), 1)
                }
            })

        else:
            # For customers: Sum of all payments that are actually 'paid'
            spent_total = bookings.filter(
                payment__status='paid'
            ).aggregate(
                total=Sum('payment__amount')
            )['total'] or Decimal('0.00')
            
            return Response({
                'total': total,
                'completed': completed,
                'pending': bookings.filter(status__in=['pending', 'payment_pending']).count(),
                'cancelled': cancelled,
                'spent': float(spent_total)
            })

    def perform_create(self, serializer):
        """Create booking and automatically initiate Uber-like driver search"""
        booking = serializer.save(customer=self.request.user, status='searching_driver')
        
        # Send confirmation SMS asynchronously
        try:
            send_booking_confirmation_task.delay(booking.id)
        except Exception as e:
            logger.error(f"Failed to queue confirmation SMS: {str(e)}")
        
        # Initiate automatic driver search (Uber-like)
        try:
            from .tasks import initiate_driver_search_task
            initiate_driver_search_task.delay(booking.id)
            logger.info(f"Driver search initiated for booking {booking.id}")
        except Exception as e:
            logger.error(f"Failed to initiate driver search: {str(e)}")
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        """Driver accepts a booking (Uber-like system)"""
        from .services import DriverMatchingService
        
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is a driver
        is_driver = hasattr(request.user, 'role') and request.user.role == 'driver'
        is_admin = (hasattr(request.user, 'role') and request.user.role == 'admin') or request.user.is_superuser
        
        if not (is_driver or is_admin):
            return Response({'detail': 'Only drivers can accept bookings.'}, status=status.HTTP_403_FORBIDDEN)
        
        # For drivers: Use the Uber-like matching service
        if is_driver:
            # Check if this driver is the currently notified one
            if booking.current_notified_driver != request.user:
                return Response({
                    'detail': 'This order has been assigned to another driver or you were not selected for this order.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if booking is in pending status (waiting for driver response)
            if booking.status not in ['pending', 'searching_driver']:
                return Response({
                    'detail': 'Booking is no longer available.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use the service to handle acceptance
            success = DriverMatchingService.handle_driver_accept(booking, request.user)
            
            if not success:
                return Response({
                    'detail': 'Failed to accept booking. It may have been assigned to another driver.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Send SMS to customer that driver has accepted
            try:
                send_driver_accepted_task.delay(booking.id)
            except Exception as e:
                logger.error(f"Failed to send driver acceptance SMS: {str(e)}")
            
            return Response({
                'detail': 'Booking accepted successfully!',
                'booking': BookingSerializer(booking).data
            })
        
        # For admins: Manual assignment (legacy behavior)
        else:
            if booking.status != 'pending' and booking.status != 'searching_driver':
                return Response({'detail': 'Booking cannot be accepted.'}, status=status.HTTP_400_BAD_REQUEST)
            
            booking.driver = request.user
            booking.status = 'accepted'
            booking.current_notified_driver = None
            booking.save()
            
            return Response({'detail': 'Booking accepted (admin override).'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Driver rejects a booking (Uber-like system - automatically notifies next driver)"""
        from .services import DriverMatchingService
        
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only drivers can reject
        is_driver = hasattr(request.user, 'role') and request.user.role == 'driver'
        
        if not is_driver:
            return Response({'detail': 'Only drivers can reject bookings.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if this driver is the currently notified one
        if booking.current_notified_driver != request.user:
            return Response({
                'detail': 'You cannot reject this order as you were not selected for it.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Use the service to handle rejection (automatically notifies next driver)
        has_more_drivers = DriverMatchingService.handle_driver_reject(booking, request.user)
        
        if has_more_drivers:
            return Response({
                'detail': 'Order rejected. Finding another driver...',
                'status': 'searching_next_driver'
            })
        else:
            return Response({
                'detail': 'Order rejected. No more drivers available.',
                'status': 'no_driver_available'
            })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        """Mark booking as started (On the Way)"""
        booking = self.get_object()
        if booking.status != 'accepted':
            return Response({'detail': 'Job must be accepted before starting.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if booking.driver_id != request.user.id:
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
        
        if booking.driver_id != request.user.id:
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
        if booking.driver_id != request.user.id and not is_admin:
            print(f"DEBUG: Complete 403: DriverID={booking.driver_id}, UserID={request.user.id}")
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
            
            # Create or Update Payment to PAID
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                defaults={
                    'amount': final_price,
                    'status': 'paid',
                    'payment_method': 'cash' # Default to cash if driver completes it without prior payment
                }
            )
            
            # If it existed (e.g. pending), update it to paid
            if not created:
                payment.amount = final_price
                payment.status = 'paid'
                if not payment.payment_method:
                    payment.payment_method = 'cash'
                payment.save()
        
        # Send completion SMS
        try:
            from notifications.tasks import send_sms_task
            message = f"Service for booking #{booking.id} completed! Payment of KES {final_price} has been recorded. Thank you for using UsafiLink."
            send_sms_task.delay(booking.customer.phone_number, message)
        except Exception as e:
            logger.error(f"Failed to send completion SMS: {str(e)}")
            # Continue without failing the request
        
        return Response({'detail': 'Booking completed successfully. Invoice generated.'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_driver(self, request, pk=None):
        """Assign a driver to a booking"""
        if not (hasattr(request.user, 'role') and request.user.role == 'admin') and not request.user.is_superuser:
            return Response({'detail': 'Only admins can assign drivers.'}, status=status.HTTP_403_FORBIDDEN)
        
        booking = self.get_object()
        driver_id = request.data.get('driver_id')
        
        if not driver_id:
            return Response({'detail': 'Driver ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            driver = User.objects.get(id=driver_id, role='driver')
        except User.DoesNotExist:
            return Response({'detail': 'Driver not found or invalid role.'}, status=status.HTTP_404_NOT_FOUND)
        
        booking.driver = driver
        if booking.status == 'pending':
            booking.status = 'accepted'
        booking.save()
        
        return Response({'detail': f'Driver {driver.username} successfully assigned to booking #{booking.id}.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """Submit a rating for a completed booking"""
        booking = self.get_object()
        
        if booking.status != 'completed':
            return Response({'detail': 'You can only rate completed bookings.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if booking.customer != request.user:
            return Response({'detail': 'Only the customer who made the booking can rate it.'}, status=status.HTTP_403_FORBIDDEN)
            
        if hasattr(booking, 'rating'):
            return Response({'detail': 'This booking has already been rated.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not booking.driver:
            return Response({'detail': 'Cannot rate a booking that had no driver assigned.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import Rating
        score = request.data.get('score')
        comment = request.data.get('comment', '')

        if not score or not (1 <= int(score) <= 5):
            return Response({'detail': 'Score must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        Rating.objects.create(
            booking=booking,
            customer=request.user,
            driver=booking.driver,
            score=int(score),
            comment=comment
        )

        return Response({'detail': 'Thank you for your feedback!'})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def driver_ratings(self, request):
        """Get ratings for a specific driver with statistics"""
        driver_id = request.query_params.get('driver_id')
        
        if not driver_id:
            return Response({'detail': 'driver_id parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            driver = User.objects.get(id=driver_id, role='driver')
        except User.DoesNotExist:
            return Response({'detail': 'Driver not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        from .models import Rating
        from django.db.models import Avg, Count, Q
        from .serializers import RatingDetailSerializer, DriverRatingsStatsSerializer
        
        ratings = Rating.objects.filter(driver=driver).order_by('-created_at')
        
        # Calculate statistics
        stats = ratings.aggregate(
            avg_score=Avg('score'),
            total_count=Count('id'),
            five_star=Count('id', filter=Q(score=5)),
            four_star=Count('id', filter=Q(score=4)),
            three_star=Count('id', filter=Q(score=3)),
            two_star=Count('id', filter=Q(score=2)),
            one_star=Count('id', filter=Q(score=1)),
        )
        
        # Get recent 10 ratings
        recent_ratings = ratings[:10]
        recent_serializer = RatingDetailSerializer(recent_ratings, many=True)
        
        return Response({
            'driver': {
                'id': driver.id,
                'name': driver.get_full_name(),
                'username': driver.username,
                'phone': getattr(driver, 'phone_number', ''),
            },
            'statistics': {
                'average_rating': round(stats['avg_score'] or 0, 2),
                'total_ratings': stats['total_count'],
                'distribution': {
                    '5_stars': stats['five_star'],
                    '4_stars': stats['four_star'],
                    '3_stars': stats['three_star'],
                    '2_stars': stats['two_star'],
                    '1_star': stats['one_star'],
                }
            },
            'recent_ratings': recent_serializer.data,
            'all_ratings_count': ratings.count()
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def all_ratings(self, request):
        """Get all ratings for admin review"""
        if not (hasattr(request.user, 'role') and request.user.role == 'admin') and not request.user.is_superuser:
            return Response({'detail': 'Only admins can view all ratings.'}, status=status.HTTP_403_FORBIDDEN)
        
        from .models import Rating
        from .serializers import RatingDetailSerializer
        from django_filters.rest_framework import DjangoFilterBackend
        
        # Get filter parameters
        unreviewed_only = request.query_params.get('unreviewed', 'false').lower() == 'true'
        flagged_only = request.query_params.get('flagged', 'false').lower() == 'true'
        driver_id = request.query_params.get('driver_id')
        
        ratings = Rating.objects.all().order_by('-created_at')
        
        if unreviewed_only:
            ratings = ratings.filter(is_reviewed_by_admin=False)
        
        if flagged_only:
            ratings = ratings.filter(is_flagged=True)
        
        if driver_id:
            ratings = ratings.filter(driver__id=driver_id)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_ratings = ratings[start:end]
        serializer = RatingDetailSerializer(paginated_ratings, many=True)
        
        return Response({
            'count': ratings.count(),
            'page': page,
            'page_size': page_size,
            'total_pages': (ratings.count() + page_size - 1) // page_size,
            'results': serializer.data
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review_rating(self, request):
        """Admin reviews and responds to a rating"""
        if not (hasattr(request.user, 'role') and request.user.role == 'admin') and not request.user.is_superuser:
            return Response({'detail': 'Only admins can review ratings.'}, status=status.HTTP_403_FORBIDDEN)
        
        rating_id = request.data.get('rating_id')
        admin_response = request.data.get('admin_response', '')
        is_flagged = request.data.get('is_flagged', False)
        flag_reason = request.data.get('flag_reason', '')
        
        from .models import Rating
        
        try:
            rating = Rating.objects.get(id=rating_id)
        except Rating.DoesNotExist:
            return Response({'detail': 'Rating not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        rating.is_reviewed_by_admin = True
        rating.admin_response = admin_response
        rating.reviewed_by = request.user
        rating.reviewed_at = timezone.now()
        
        if is_flagged:
            rating.is_flagged = True
            rating.flag_reason = flag_reason
        
        rating.save()
        
        from .serializers import RatingDetailSerializer
        return Response({
            'detail': 'Rating reviewed successfully.',
            'rating': RatingDetailSerializer(rating).data
        })

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