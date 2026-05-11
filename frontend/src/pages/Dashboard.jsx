import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  CreditCard,
  Plus,
  List,
  AlertCircle
} from 'lucide-react';
import { bookingsAPI } from '../api/bookings';
import { trackingAPI } from '../api/tracking';
import DriverRouteMap from '../components/DriverRouteMap';
import Profile from './Profile';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  });
  const [bookings, setBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [paymentsDue, setPaymentsDue] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [activeDriverLocation, setActiveDriverLocation] = useState(null);
  const [activeTrackingLoading, setActiveTrackingLoading] = useState(false);
  const [disputeFormData, setDisputeFormData] = useState({
    booking: '',
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  useEffect(() => {
    fetchDashboardData();

    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        localStorage.removeItem('pendingBooking');
        navigate('/bookings/new', {
          state: {
            tankSize: bookingData.tankSize,
            location: bookingData.location
          }
        });
      } catch (error) {
        console.error('Error parsing pending booking:', error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    let intervalId;
    const activeBooking = bookings.find((b) =>
      b.driver && ['accepted', 'started', 'arrived'].includes(b.status)
    );

    const fetchActiveDriverLocation = async () => {
      if (!activeBooking) {
        setActiveDriverLocation(null);
        return;
      }

      setActiveTrackingLoading(true);
      try {
        const driverId = activeBooking.driver?.id || activeBooking.driver;
        const location = await trackingAPI.getDriverLocation(driverId);
        setActiveDriverLocation(location);
      } catch (error) {
        console.error('Error fetching active driver location:', error);
      } finally {
        setActiveTrackingLoading(false);
      }
    };

    if (activeBooking) {
      fetchActiveDriverLocation();
      intervalId = window.setInterval(fetchActiveDriverLocation, 15000);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [bookings]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      const [bookingsResult, statsResult, disputesResult] = await Promise.allSettled([
        bookingsAPI.getUserBookings(),
        bookingsAPI.getStats(),
        bookingsAPI.getUserDisputes()
      ]);

      const bookingsResponse = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : {};
      const disputesData = disputesResult.status === 'fulfilled' ? disputesResult.value : [];

      console.log('✅ Received bookings response:', bookingsResponse);
      console.log('✅ Received stats response:', statsData);
      console.log('✅ Received disputes response:', disputesData);

      const decodedBookings = Array.isArray(bookingsResponse) ? bookingsResponse : bookingsResponse.results || bookingsResponse.data || [];
      console.log('📋 Processed bookings:', decodedBookings);

      setBookings(decodedBookings);
      setStats({
        total: statsData.total || 0,
        completed: statsData.completed || 0,
        pending: statsData.pending || 0,
        cancelled: statsData.cancelled || 0,
        spent: statsData.spent || 0
      });

      const sortedBookings = [...decodedBookings].sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
      setRecentBookings(sortedBookings.slice(0, 5));

      const upcoming = bookings.filter(b =>
        ['searching_driver', 'pending', 'accepted', 'payment_pending'].includes(b.status) &&
        new Date(b.scheduled_date) > new Date()
      ).slice(0, 3);
      setUpcomingBookings(upcoming);

      const due = bookings.filter(b => b.payment_status === 'pending' && b.status === 'completed');
      setPaymentsDue(due);

      setDisputes(disputesData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeSubmit = async () => {
    try {
      await bookingsAPI.createDispute(disputeFormData);
      toast.success('Dispute submitted successfully');
      setShowDisputeModal(false);
      setDisputeFormData({ booking: '', reason: '', description: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to submit dispute');
      console.error('Error submitting dispute:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-emerald-100 text-emerald-800';
      case 'pending':
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return `KES ${val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const activeBooking = bookings.find((b) =>
    b.driver && ['accepted', 'started', 'arrived'].includes(b.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--parchment)] pb-10">
      <header className="bg-[var(--white)] shadow">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--ink)] tracking-tight">UsafiLink</h1>
              <p className="text-[var(--stone)] font-medium">Customer Portal</p>
            </div>
            <button onClick={handleLogout} className="text-[var(--rust)] hover:bg-red-50 px-4 py-2 rounded-lg transition font-semibold">Logout</button>
          </div>

          <div className="mt-8 flex gap-6 border-b border-gray-100">
            <button
              onClick={() => setActiveView('overview')}
              className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeView === 'overview' ? 'border-[var(--sage)] text-[var(--sage)]' : 'border-transparent text-[var(--stone)] hover:text-[var(--ink)]'}`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveView('disputes')}
              className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeView === 'disputes' ? 'border-[var(--sage)] text-[var(--sage)]' : 'border-transparent text-[var(--stone)] hover:text-[var(--ink)]'}`}
            >
              Disputes
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeView === 'profile' ? 'border-[var(--sage)] text-[var(--sage)]' : 'border-transparent text-[var(--stone)] hover:text-[var(--ink)]'}`}
            >
              Profile & Account
            </button>
          </div>
        </div>
      </header>

      {activeView === 'profile' ? (
        <div className="w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Profile />
        </div>
      ) : activeView === 'disputes' ? (
        <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-[var(--ink)]">My Disputes</h2>
              <p className="text-[var(--stone)]">Raise and track disputes for your bookings</p>
            </div>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="bg-[var(--sage)] text-[var(--white)] px-4 py-2 rounded-lg font-semibold hover:bg-[var(--sage-light)] transition flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" /> New Dispute
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-[var(--white)] rounded-lg shadow-sm p-12 text-center border border-gray-100">
              <AlertCircle className="w-16 h-16 text-[var(--stone)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">No Disputes</h3>
              <p className="text-[var(--stone)]">You haven't raised any disputes yet.</p>
            </div>
          ) : (
            <div className="bg-[var(--white)] rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[var(--cream)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--stone)] uppercase tracking-wider">Booking</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--stone)] uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--stone)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--stone)] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--white)] divide-y divide-gray-100">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-[var(--cream)]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--ink)]">#{dispute.booking_id}</td>
                      <td className="px-6 py-4 text-sm text-[var(--stone)]">{dispute.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--stone)]">{formatDate(dispute.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showDisputeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-[var(--white)] rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[var(--ink)]">Raise a Dispute</h3>
                  <button onClick={() => setShowDisputeModal(false)} className="text-[var(--stone)] hover:text-[var(--ink)]">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Booking ID</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--sage)]"
                      value={disputeFormData.booking}
                      onChange={(e) => setDisputeFormData({ ...disputeFormData, booking: e.target.value })}
                    >
                      <option value="">Select a booking</option>
                      {recentBookings.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          #{booking.id} - {formatDate(booking.scheduled_date)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Reason</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--sage)]"
                      value={disputeFormData.reason}
                      onChange={(e) => setDisputeFormData({ ...disputeFormData, reason: e.target.value })}
                    >
                      <option value="">Select a reason</option>
                      <option value="service_quality">Service Quality Issue</option>
                      <option value="payment">Payment Issue</option>
                      <option value="driver_behavior">Driver Behavior</option>
                      <option value="timing">Timing Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Description</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--sage)]"
                      rows="3"
                      value={disputeFormData.description}
                      onChange={(e) => setDisputeFormData({ ...disputeFormData, description: e.target.value })}
                      placeholder="Describe your issue in detail..."
                    />
                  </div>
                  <button
                    onClick={handleDisputeSubmit}
                    className="w-full py-3 bg-[var(--sage)] text-[var(--white)] font-bold rounded-lg hover:bg-[var(--sage-light)] transition"
                  >
                    Submit Dispute
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-[2rem] bg-gradient-to-br from-[var(--sage)] via-[var(--sage-light)] to-[var(--rust)] p-8 shadow-2xl overflow-hidden text-[var(--white)] relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_55%)] pointer-events-none"></div>
              <div className="relative z-10">
                <p className="text-sm uppercase tracking-[0.32em] text-[var(--cream)]">Welcome back</p>
                <h2 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight">Your UsafiLink dashboard</h2>
                <p className="mt-4 max-w-2xl text-sm text-[var(--cream)]/90 leading-7">
                  Everything you need to track your bookings, payments and driver updates in one place.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white/10 border border-white/15 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--cream)]">Bookings</p>
                    <p className="mt-3 text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 border border-white/15 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--cream)]">Completed</p>
                    <p className="mt-3 text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 border border-white/15 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--cream)]">Spent</p>
                    <p className="mt-3 text-3xl font-bold">{formatCurrency(stats.spent || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--white)] rounded-[2rem] p-6 shadow-xl border border-gray-100">
                <h3 className="text-lg font-semibold text-[var(--ink)]">Quick Actions</h3>
                <p className="mt-2 text-sm text-[var(--stone)]">Jump to the most important flows for your bookings.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Link
                    to="/bookings/new"
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[var(--sage)] px-4 py-3 text-sm font-semibold text-[var(--white)] shadow-lg shadow-[var(--sage)]/30 hover:bg-[var(--sage-light)] transition"
                  >
                    <Plus className="w-4 h-4" /> Book Now
                  </Link>
                  <Link
                    to="/bookings"
                    className="inline-flex items-center justify-center gap-2 rounded-3xl border border-gray-200 bg-[var(--white)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--sage)] hover:text-[var(--sage)] transition"
                  >
                    <List className="w-4 h-4" /> My Bookings
                  </Link>
                  <Link
                    to="/payments"
                    className="inline-flex items-center justify-center gap-2 rounded-3xl border border-gray-200 bg-[var(--white)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--sage)] hover:text-[var(--sage)] transition"
                  >
                    <CreditCard className="w-4 h-4" /> Make Payment
                  </Link>
                </div>
              </div>

              {activeBooking && (
                <div className="bg-[var(--white)] rounded-[2rem] p-6 shadow-xl border border-[var(--sage)]/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-[var(--sage)]">Active Ride</p>
                      <h3 className="mt-2 text-2xl font-bold text-[var(--ink)]">Booking #{activeBooking.id}</h3>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[var(--sage-muted)] px-3 py-1 text-sm font-semibold text-[var(--sage)]">
                      {activeBooking.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl bg-[var(--cream)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--stone)]">Driver</p>
                      <p className="mt-2 font-semibold text-[var(--ink)]">{activeBooking.driver?.name || 'Assigned Driver'}</p>
                    </div>
                    <div className="rounded-3xl bg-[var(--cream)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--stone)]">Service</p>
                      <p className="mt-2 font-semibold text-[var(--ink)]">{activeBooking.service_type?.replace('_', ' ') || 'Service'}</p>
                    </div>
                    <div className="rounded-3xl bg-[var(--cream)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--stone)]">Location</p>
                      <p className="mt-2 font-semibold text-[var(--ink)]">{activeBooking.location_name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/bookings/${activeBooking.id}`}
                      className="inline-flex items-center justify-center rounded-3xl bg-[var(--sage)] px-4 py-3 text-sm font-semibold text-[var(--white)] hover:bg-[var(--sage-light)] transition"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      disabled={!activeDriverLocation}
                      onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                      className="inline-flex items-center justify-center rounded-3xl border border-gray-200 bg-[var(--white)] px-4 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition disabled:opacity-50"
                    >
                      {activeDriverLocation ? 'Tracking Active' : 'Awaiting Location'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              <div className="bg-[var(--white)] rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--ink)]">Recent Bookings</h3>
                    <p className="text-sm text-[var(--stone)]">Quick access to your latest service history.</p>
                  </div>
                  <Link
                    to="/bookings"
                    className="text-[var(--sage)] hover:text-[var(--sage-light)] text-sm font-semibold"
                  >
                    View All
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[var(--cream)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--stone)]">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--stone)]">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--stone)]">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--stone)]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--white)] divide-y divide-gray-100">
                      {recentBookings.length > 0 ? (
                        recentBookings.map((booking) => (
                          <tr key={booking.id} onClick={() => navigate(`/bookings/${booking.id}`)} className="cursor-pointer hover:bg-[var(--sage-muted)] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--ink)] font-medium">{formatDate(booking.scheduled_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--stone)]">{booking.service_type?.replace('_', ' ') || 'Service'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                {booking.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--ink)]">{formatCurrency(booking.estimated_price)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-[var(--stone)]">No recent bookings found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[var(--white)] rounded-[2rem] shadow-xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] mb-5">Upcoming Bookings</h3>
                {upcomingBookings.length > 0 ? (
                  <ul className="space-y-4">
                    {upcomingBookings.map(booking => (
                      <li key={booking.id} className="flex items-start gap-4 rounded-3xl border border-gray-100 bg-[var(--cream)] p-4">
                        <div className="bg-[var(--sage-muted)] p-3 rounded-2xl">
                          <Clock className="w-5 h-5 text-[var(--sage)]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink)]">{formatDate(booking.scheduled_date)}</p>
                          <p className="text-sm text-[var(--stone)]">{booking.service_type?.replace('_', ' ')}</p>
                          <p className="text-xs text-[var(--stone)] mt-1">{booking.location_name || 'Location not specified'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-[var(--cream)] p-6 text-center text-sm text-[var(--stone)]">
                    No upcoming bookings yet.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--white)] rounded-[2rem] shadow-xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[var(--rust)] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[var(--rust)]" /> Payment Attention
                </h3>
                {paymentsDue.length > 0 ? (
                  <ul className="space-y-4">
                    {paymentsDue.map(payment => (
                      <li key={payment.id} className="rounded-3xl border border-[var(--rust)]/10 bg-[var(--sand)] p-4">
                        <p className="font-bold text-[var(--ink)]">Booking #{payment.id}</p>
                        <p className="mt-1 text-xl font-bold text-[var(--rust)]">{formatCurrency(payment.amount_due || payment.estimated_price)}</p>
                        <button
                          onClick={() => navigate('/payments', { state: { bookingId: payment.id, amount: payment.estimated_price } })}
                          className="mt-4 w-full rounded-3xl bg-[var(--rust)] py-3 text-sm font-semibold text-[var(--white)] hover:bg-[var(--rust)]/80 transition"
                        >
                          Pay Now
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 rounded-3xl border border-[var(--sage)]/10 bg-[var(--sage-muted)] p-4 text-sm font-semibold text-[var(--sage)]">
                    <CheckCircle className="w-5 h-5" /> All payments are up to date.
                  </div>
                )}
              </div>

              <div className="bg-[var(--white)] rounded-[2rem] shadow-xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] mb-4">Driver Tracking</h3>
                {activeBooking ? (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--stone)]">Your active service is being monitored in real time.</p>
                    <div className="rounded-3xl bg-[var(--cream)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--stone)]">Last location</p>
                      <p className="mt-2 text-base font-semibold text-[var(--ink)]">{activeDriverLocation ? `${activeDriverLocation.latitude.toFixed(4)}, ${activeDriverLocation.longitude.toFixed(4)}` : 'Waiting for driver data...'}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/bookings/${activeBooking.id}`)}
                      className="w-full rounded-3xl bg-[var(--sage)] py-3 text-sm font-semibold text-[var(--white)] hover:bg-[var(--sage-light)] transition"
                    >
                      Open active booking
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-[var(--cream)] p-6 text-center text-sm text-[var(--stone)]">
                    No active driver assigned right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default Dashboard;
