import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Phone, Loader } from 'lucide-react';
import { bookingsAPI } from '../api/bookings';
import toast from 'react-hot-toast';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await bookingsAPI.getBooking(id);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsAPI.cancelBooking(id);
        toast.success('Booking cancelled successfully');
        navigate('/bookings');
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleMakePayment = () => {
    // Pick final_price if it exists and is > 0, otherwise use estimated_price
    const final = Number(booking?.final_price);
    const estimated = Number(booking?.estimated_price);
    const paymentAmount = (final > 0) ? final : estimated;

    navigate('/payments', { state: { bookingId: id, amount: paymentAmount } });
  };

  const handleReschedule = () => {
    toast.info('Reschedule feature coming soon!');
    // In real app: navigate to reschedule form
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatServiceType = (type) => {
    if (!type) return 'N/A';
    return type.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Booking not found</p>
          <Link to="/bookings" className="text-blue-600 hover:text-blue-800">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/bookings"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Booking #{booking.id}</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Created on {new Date(booking.created_at || booking.scheduled_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Service Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="font-medium">{formatServiceType(booking.service_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tank Size</p>
                  <p className="font-medium">{booking.tank_size ? `${booking.tank_size} Liters` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </span>
                  {booking.payment_status !== 'completed' && booking.status === 'completed' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Incomplete Payment
                    </span>
                  )}
                  {booking.payment_status === 'completed' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Price</p>
                  <p className="font-medium text-lg">KES {booking.estimated_price?.toLocaleString() || 'N/A'}</p>
                </div>
                {booking.final_price && (
                  <div>
                    <p className="text-sm text-gray-500">Final Price</p>
                    <p className="font-medium text-lg text-green-600">KES {booking.final_price.toLocaleString()}</p>
                  </div>
                )}
                {booking.payment_status && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className={`font-medium ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {booking.payment_status.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Location</h2>
              </div>
              <div>
                <p className="font-medium">{booking.location_name || 'Location'}</p>
                {booking.address && <p className="text-gray-600 mt-1">{booking.address}</p>}
                {booking.latitude && booking.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    View on Map →
                  </a>
                )}
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Schedule</h2>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{new Date(booking.scheduled_date).toLocaleDateString('en-KE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{new Date(booking.scheduled_date).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>

            {/* Driver Info (if assigned) */}
            {booking.driver && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Assigned Driver</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.driver.username || 'Driver'}</p>
                    {booking.driver.phone_number && (
                      <p className="text-gray-600 text-sm flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        {booking.driver.phone_number}
                      </p>
                    )}
                  </div>
                  {booking.driver.phone_number && (
                    <a
                      href={`tel:${booking.driver.phone_number}`}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Call Driver
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
              <div className="space-y-3">
                {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                  <button
                    onClick={handleMakePayment}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Make Payment
                  </button>
                )}
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={handleReschedule}
                      className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={handleCancelBooking}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                {booking.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium">Service Completed</p>
                    <p className="text-green-600 text-sm mt-1">Thank you for using UsafiLink!</p>
                  </div>
                )}
                {booking.status === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-800 font-medium">Booking Cancelled</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions Card */}
            {booking.special_instructions && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Special Instructions</h2>
                <p className="text-gray-600">
                  {booking.special_instructions}
                </p>
              </div>
            )}

            {/* Booking Info */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Booking Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{booking.id}</span>
                </div>
                {booking.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</span>
                  </div>
                )}
                {booking.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{new Date(booking.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingDetail;