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

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [paymentsDue, setPaymentsDue] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookings, statsData] = await Promise.all([
        bookingsAPI.getUserBookings(),
        bookingsAPI.getStats()
      ]);

      setStats({
        total: statsData.total || 0,
        completed: statsData.completed || 0,
        pending: statsData.pending || 0,
        cancelled: statsData.cancelled || 0
      });

      // Sort bookings by date
      const sortedBookings = [...bookings].sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
      setRecentBookings(sortedBookings.slice(0, 5));

      const upcoming = bookings.filter(b =>
        (b.status === 'accepted' || b.status === 'pending') &&
        new Date(b.scheduled_date) > new Date()
      ).slice(0, 3);
      setUpcomingBookings(upcoming);

      const due = bookings.filter(b => b.payment_status === 'pending' && b.status === 'completed');
      setPaymentsDue(due);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UsafiLink Customer Dashboard</h1>
              <p className="text-gray-600">Welcome back!</p>
            </div>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium text-sm">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
            <p className="text-gray-500 text-sm">Cancelled</p>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/bookings/new" className="bg-blue-600 text-white p-4 rounded-lg shadow hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold">
            <Plus className="w-5 h-5" /> Book Now
          </Link>
          <Link to="/bookings" className="bg-white text-gray-700 p-4 rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-center gap-2 font-semibold border border-gray-200">
            <List className="w-5 h-5" /> View Bookings
          </Link>
          <Link to="/payments" className="bg-white text-gray-700 p-4 rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-center gap-2 font-semibold border border-gray-200">
            <CreditCard className="w-5 h-5" /> Make Payment
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Recent Bookings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <Link to="/bookings" className="text-blue-600 hover:text-blue-800 text-sm">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.length > 0 ? (
                      recentBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(booking.scheduled_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.service_type?.replace('_', ' ') || 'Service'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.status === 'completed' && booking.payment_status !== 'completed' && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(booking.estimated_price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No recent bookings found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar: Upcoming & Payment Due */}
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h3>
              {upcomingBookings.length > 0 ? (
                <ul className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <li key={booking.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(booking.scheduled_date)}</p>
                        <p className="text-sm text-gray-600">{booking.service_type.replace('_', ' ')} @ {booking.location_name || 'Home'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No upcoming bookings scheduled.</p>
              )}
            </div>

            {/* Payment Due */}
            <div className="bg-red-50 rounded-lg shadow-sm p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Payment Due</h3>
              {paymentsDue.length > 0 ? (
                <ul className="space-y-4">
                  {paymentsDue.map(payment => (
                    <li key={payment.id} className="pb-3 border-b border-red-200 last:border-0 last:pb-0">
                      <p className="font-medium text-gray-900">Booking #{payment.id}</p>
                      <p className="text-sm text-red-700 font-bold">{formatCurrency(payment.amount_due || payment.estimated_price)}</p>
                      <p className="text-xs text-red-600 mt-1">Due immediately</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;