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
import Profile from './Profile';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
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
        cancelled: statsData.cancelled || 0,
        spent: statsData.spent || 0
      });

      const sortedBookings = [...bookings].sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
      setRecentBookings(sortedBookings.slice(0, 5));

      const upcoming = bookings.filter(b =>
        (b.status === 'accepted' || b.status === 'pending' || b.status === 'payment_pending') &&
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">UsafiLink</h1>
              <p className="text-gray-500 font-medium">Customer Portal</p>
            </div>
            <button onClick={handleLogout} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-semibold">Logout</button>
          </div>

          <div className="mt-8 flex gap-6 border-b border-gray-100">
            <button
              onClick={() => setActiveView('overview')}
              className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeView === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeView === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Profile & Account
            </button>
          </div>
        </div>
      </header>

      {activeView === 'profile' ? (
        <div className="max-w-7xl mx-auto py-8">
          <Profile />
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-gray-500 text-sm font-medium">Money Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.spent || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/bookings/new" className="bg-blue-600 text-white p-4 rounded-lg shadow hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold ring-offset-2 focus:ring-2 focus:ring-blue-500">
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
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
                  <Link to="/bookings" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">View All</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {recentBookings.length > 0 ? (
                        recentBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatDate(booking.scheduled_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.service_type?.replace('_', ' ') || 'Service'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status?.replace('_', ' ')}
                              </span>
                              {booking.status === 'completed' && booking.payment_status !== 'paid' && (
                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Unpaid
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{formatCurrency(booking.estimated_price)}</td>
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

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Bookings</h3>
                {upcomingBookings.length > 0 ? (
                  <ul className="space-y-4">
                    {upcomingBookings.map(booking => (
                      <li key={booking.id} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="bg-blue-50 p-2.5 rounded-xl">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{formatDate(booking.scheduled_date)}</p>
                          <p className="text-sm text-gray-600 font-medium">{booking.service_type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-400 mt-1">{booking.location_name || 'Home'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 font-medium">No upcoming bookings</p>
                  </div>
                )}
              </div>

              <div className="bg-red-50 rounded-lg shadow-sm p-6 border border-red-100">
                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Payment Attention
                </h3>
                {paymentsDue.length > 0 ? (
                  <ul className="space-y-4">
                    {paymentsDue.map(payment => (
                      <li key={payment.id} className="pb-3 border-b border-red-200 last:border-0 last:pb-0">
                        <p className="font-bold text-gray-900">Booking #{payment.id}</p>
                        <p className="text-sm text-red-700 font-extrabold">{formatCurrency(payment.amount_due || payment.estimated_price)}</p>
                        <button
                          onClick={() => navigate('/payments', { state: { bookingId: payment.id, amount: payment.estimated_price } })}
                          className="mt-2 w-full text-xs font-bold text-white bg-red-600 py-1.5 rounded-lg hover:bg-red-700"
                        >
                          Pay Now
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm font-bold">All payments updated!</p>
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