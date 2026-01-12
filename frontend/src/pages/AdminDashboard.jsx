import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  DollarSign,
  Truck,
  AlertCircle,
  TrendingUp,
  Activity,
  CreditCard,
  MessageSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState({
    today: 0,
    week: 0,
    month: 0,
    ytd: 0
  });
  const [quickStats, setQuickStats] = useState({
    active_bookings: 0,
    available_drivers: 0,
    pending_payments: 0,
    support_tickets: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsData, bookingsData] = await Promise.all([
        bookingsAPI.getStats(),
        bookingsAPI.getUserBookings()
      ]);

      if (statsData.revenue) setRevenue(statsData.revenue);
      if (statsData.quickStats) setQuickStats(statsData.quickStats);

      // Create activity from bookings
      const activity = bookingsData.slice(0, 5).map(b => ({
        id: b.id,
        time: new Date(b.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: b.customer_name || 'User',
        action: b.status.charAt(0).toUpperCase() + b.status.slice(1),
        details: `Booking #${b.id}`,
        type: b.status === 'completed' ? 'success' : (b.status === 'cancelled' ? 'warning' : 'info')
      }));
      setRecentActivity(activity);

    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const alerts = [
    { id: 1, text: 'System operating normally', type: 'info' },
    { id: 2, text: quickStats.pending_payments > 0 ? `${quickStats.pending_payments} payments awaiting verification` : 'All payments processed', type: 'info' }
  ];

  const StatBox = ({ label, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: color }}>
      <p className="text-gray-500 text-sm font-medium uppercase">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        KES {Number(value).toLocaleString('en-KE', { minimumFractionDigits: 0 })}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UsafiLink Admin</h1>
          <p className="text-gray-600 mt-1">System Overview & Analytics</p>
        </div>
        <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">Logout</button>
      </div>

      {/* Overview Cards (Revenue) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatBox label="Today" value={revenue.today} color="#3b82f6" />
        <StatBox label="Week" value={revenue.week} color="#10b981" />
        <StatBox label="Month" value={revenue.month} color="#8b5cf6" />
        <StatBox label="YTD" value={revenue.ytd} color="#f59e0b" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full"><Calendar className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-2xl font-bold">{quickStats.active_bookings}</p>
            <p className="text-sm text-gray-500">Active Bookings</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-full"><Truck className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-2xl font-bold">{quickStats.available_drivers}</p>
            <p className="text-sm text-gray-500">Available Drivers</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-full"><CreditCard className="w-6 h-6 text-yellow-600" /></div>
          <div>
            <p className="text-2xl font-bold">{quickStats.pending_payments}</p>
            <p className="text-sm text-gray-500">Pending Payments</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-full"><MessageSquare className="w-6 h-6 text-purple-600" /></div>
          <div>
            <p className="text-2xl font-bold">{quickStats.support_tickets}</p>
            <p className="text-sm text-gray-500">Support Tickets</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Charts & Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Charts & Graphs Placeholder */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Bookings Trend</h3>
            <div className="h-64 bg-gray-50 border border-gray-100 rounded flex items-end justify-between px-4 pb-0 relative">
              {/* Mock Bar Chart */}
              {[40, 60, 45, 90, 75, 30, 50].map((h, i) => (
                <div key={i} className="w-1/12 bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition" style={{ height: `${h}%` }}></div>
              ))}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 py-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">Mon</span>
                <span className="text-xs text-gray-500">Tue</span>
                <span className="text-xs text-gray-500">Wed</span>
                <span className="text-xs text-gray-500">Thu</span>
                <span className="text-xs text-gray-500">Fri</span>
                <span className="text-xs text-gray-500">Sat</span>
                <span className="text-xs text-gray-500">Sun</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentActivity.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="py-3 text-gray-500">{item.time}</td>
                      <td className="py-3 font-medium text-gray-900">{item.user}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.action === 'Completed' ? 'bg-green-100 text-green-800' :
                          item.action === 'Payment' ? 'bg-blue-100 text-blue-800' :
                            item.action === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{item.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alerts & Notifications</h3>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                  alert.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                    'bg-blue-50 border-blue-500 text-blue-800'
                  }`}>
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p className="text-sm font-medium">{alert.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-700">
              View All Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;