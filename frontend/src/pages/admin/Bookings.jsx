import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  User,
  Truck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  Navigation,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  X,
  UserCheck,
  Plus
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { bookingsAPI } from '../../api/bookings';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActions, setShowActions] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null); // bookingId or null

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getBookings();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await adminAPI.getUsers({ role: 'driver' });
      setDrivers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelBooking = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsAPI.cancelBooking(id);
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleAssignDriver = async (bookingId, driverId) => {
    try {
      await adminAPI.assignDriver(bookingId, driverId);
      toast.success('Driver assigned successfully');
      setShowAssignModal(null);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to assign driver');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-100 ring-4 ring-green-50/50';
      case 'accepted': return 'bg-blue-50 text-blue-700 border-blue-100 ring-4 ring-blue-50/50';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100 ring-4 ring-yellow-50/50';
      case 'payment_pending': return 'bg-orange-50 text-orange-700 border-orange-100 ring-4 ring-orange-50/50';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100 ring-4 ring-red-50/50';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesSearch =
      b.id.toString().includes(searchTerm) ||
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending' || b.status === 'payment_pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + Number(b.final_price || b.estimated_price), 0),
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Service Bookings</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time monitoring and dispatch control</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
            <Download className="w-5 h-5" />
            <span>Export Registry</span>
          </button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Volume', value: stats.total, color: 'blue', icon: Calendar },
          { label: 'Needs Action', value: stats.pending, color: 'orange', icon: AlertCircle },
          { label: 'Completed Jobs', value: stats.completed, color: 'green', icon: CheckCircle2 },
          { label: 'Gross Potential', value: `KES ${stats.revenue.toLocaleString()}`, color: 'indigo', icon: DollarSign }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className={`bg-${stat.color}-50 p-3 rounded-2xl text-${stat.color}-600`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search booking ID, customer or location..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl overflow-x-auto">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredBookings.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-8 py-5">Service Ticket</th>
                  <th className="px-8 py-5">Client Profile</th>
                  <th className="px-8 py-5">Assigned Agent</th>
                  <th className="px-8 py-5">Value</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border border-gray-200 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white transition-all">
                          <Navigation className="w-4 h-4 mb-0.5 opacity-50 group-hover:opacity-100" />
                          <span className="text-[10px] font-black">#{b.id}</span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors capitalize">
                            {b.service_type?.replace('_', ' ')}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {b.location_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                          {b.customer_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-700">{b.customer_name || 'Anonymous'}</div>
                          <div className="text-[10px] font-bold text-gray-400">{b.customer_phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {b.driver_name && b.driver_name !== 'Not Assigned' ? (
                        <div className="flex items-center gap-3 text-blue-600">
                          <Truck className="w-4 h-4" />
                          <div className="text-xs font-bold">{b.driver_name}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAssignModal(b.id)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 rounded-full text-[9px] font-black tracking-widest uppercase hover:bg-red-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Assign Driver
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-sm font-black text-gray-900">KES {(b.final_price || b.estimated_price)?.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent ${getStatusBadge(b.status)}`}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="relative flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/bookings/${b.id}`)}
                          className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowActions(showActions === b.id ? null : b.id)}
                            className={`p-2.5 rounded-xl transition-all ${showActions === b.id ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActions === b.id && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2 animate-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => {
                                  setShowAssignModal(b.id);
                                  setShowActions(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                              >
                                <UserCheck className="w-4 h-4" /> Assign Agent
                              </button>
                              <div className="h-px bg-gray-50 my-2"></div>
                              {b.status !== 'cancelled' && b.status !== 'completed' && (
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <XCircle className="w-4 h-4" /> Cancel Job
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/bookings/${b.id}`)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <ArrowUpRight className="w-4 h-4" /> Track Service
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 flex flex-col items-center text-center">
              <div className="bg-gray-50 p-6 rounded-[2rem] mb-4">
                <Calendar className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900">No bookings found</h3>
              <p className="text-sm text-gray-400 mt-2 font-medium max-w-xs">We couldn't find any bookings matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">Assign Field Agent</h3>
                <p className="text-sm text-gray-500 mt-1">Select a driver for Booking #{showAssignModal}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(null)}
                className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              {drivers.length > 0 ? drivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => handleAssignDriver(showAssignModal, driver.id)}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-600 group rounded-2xl transition-all border border-transparent hover:border-blue-500 shadow-sm"
                >
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black transition-all group-hover:bg-white group-hover:text-blue-600">
                    {driver.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-gray-900 group-hover:text-white">{driver.first_name ? `${driver.first_name} ${driver.last_name}` : driver.username}</div>
                    <div className="text-[10px] font-bold text-gray-400 group-hover:text-blue-200 uppercase tracking-widest">@{driver.username} • {driver.id}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-white" />
                </button>
              )) : (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400 font-bold">No available drivers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;