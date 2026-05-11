import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { bookingsAPI } from '../api/bookings';
import toast from 'react-hot-toast';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      const data = await bookingsAPI.getUserBookings();
      const bookingsData = Array.isArray(data) ? data : data.results || data.data || [];
      console.log('📚 Bookings Data:', bookingsData);
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
    } catch (error) {
      toast.error('Failed to fetch bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return `KES ${val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'pending':
      case 'payment_pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsAPI.cancelBooking(bookingId);
        toast.success('Booking cancelled successfully');
        fetchBookings(); // Refresh the list
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleExportBookings = () => {
    try {
      // Create CSV content
      const headers = ['ID', 'Service Type', 'Location', 'Date', 'Status', 'Amount'];
      const csvRows = [headers.join(',')];

      filteredBookings.forEach(booking => {
        const row = [
          booking.id,
          booking.service_type?.replace('_', ' ') || 'N/A',
          `"${booking.location_name}"`,
          formatDate(booking.scheduled_date),
          booking.status,
          booking.estimated_price || booking.final_price || 0
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Bookings exported successfully!');
    } catch (error) {
      toast.error('Failed to export bookings');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sage)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--parchment)]">
      {/* Header */}
      <header className="bg-[var(--white)] border-b border-gray-200">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[var(--ink)]">My Bookings</h1>
              <p className="text-sm text-[var(--stone)]">Manage your exhauster service bookings</p>
            </div>
            <Link
              to="/bookings/new"
              className="inline-flex items-center px-4 py-2 bg-[var(--sage)] text-[var(--white)] rounded-lg hover:bg-[var(--sage-light)] transition font-bold"
            >
              <Calendar className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--white)] rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--sage-muted)] p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-[var(--sage)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--stone)] uppercase">Total</p>
                <p className="text-xl font-bold text-[var(--ink)]">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--white)] rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--sand)] p-2 rounded-lg">
                <Clock className="h-5 w-5 text-[var(--rust)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--stone)] uppercase">Pending</p>
                <p className="text-xl font-bold text-[var(--ink)]">
                  {bookings.filter(b => ['pending', 'payment_pending'].includes(b.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--white)] rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--sage-muted)] p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[var(--sage)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--stone)] uppercase">Completed</p>
                <p className="text-xl font-bold text-[var(--ink)]">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--white)] rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--cream)] p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-[var(--ink)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--stone)] uppercase">Spent</p>
                <p className="text-xl font-bold text-[var(--ink)]">
                  {formatCurrency(bookings
                    .filter(b => b.payment_status === 'paid')
                    .reduce((sum, b) => {
                      const price = Number(b.final_price) || Number(b.estimated_price) || 0;
                      return sum + price;
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar - Compact */}
        <div className="bg-[var(--white)] rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--stone)]" />
            <input
              type="text"
              placeholder="Search location, service..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[var(--sage)] focus:border-[var(--sage)] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[var(--sage)] focus:border-[var(--sage)] outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-3 py-2 text-[var(--ink)] bg-[var(--cream)] hover:bg-[var(--sand)] rounded-lg text-sm font-bold transition"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleExportBookings}
            className="px-3 py-2 text-[var(--sage)] bg-[var(--sage-muted)] hover:bg-[var(--sage-light)]/20 rounded-lg text-sm font-bold transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-[var(--white)] rounded-lg border border-gray-200">
            <Calendar className="mx-auto h-12 w-12 text-[var(--stone)]" />
            <h3 className="mt-2 text-sm font-bold text-[var(--ink)]">No bookings found</h3>
            <p className="mt-1 text-sm text-[var(--stone)] mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'No bookings match your filters'
                : 'Create a new booking to get started'}
            </p>
            <Link
              to="/bookings/new"
              className="inline-flex items-center px-4 py-2 bg-[var(--sage)] text-[var(--white)] rounded-lg hover:bg-[var(--sage-light)] font-bold text-sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[var(--white)] rounded-lg border border-gray-200 hover:border-[var(--sage)] hover:shadow-md transition p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Side - Booking Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {booking.location_name || 'No location'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[var(--stone)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.scheduled_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(booking.scheduled_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {booking.service_type?.replace('_', ' ') || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Price & Action */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--ink)]">
                      {formatCurrency(booking.final_price || booking.estimated_price || 0)}
                    </p>
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-bold text-[var(--sage)] bg-[var(--sage-muted)] hover:bg-[var(--sage-light)]/20 rounded-lg transition"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookings;