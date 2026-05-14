import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Power,
  Route,
  Star,
  TrendingUp,
  Truck,
  User,
  XCircle,
  Loader
} from 'lucide-react';
import RouteMap from '../components/RouteMap';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';
import { useDriverTracking } from '../hooks/useDriverTracking';
import Profile from './Profile';
import DriverSchedule from './DriverSchedule';

const ACTIVE_STATUSES = ['accepted', 'started', 'arrived'];
const REQUEST_STATUSES = ['pending', 'searching_driver'];

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(false);
  const [jobStatus, setJobStatus] = useState('active');
  const [currentJob, setCurrentJob] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    jobs_done: 0,
    total_jobs: 0,
    earnings: 0,
    rating: 5.0,
    hours_online: 0
  });
  const [stats, setStats] = useState({
    today: { earnings: 0, jobs: 0 },
    week: { earnings: 0, jobs: 0 },
    month: { earnings: 0, jobs: 0 }
  });
  const [dailyReport, setDailyReport] = useState({
    total_kilometers: 0,
    fuel_consumed_liters: 0,
    waste_emptied_liters: 0,
    revenue_generated: 0
  });

  const navigate = useNavigate();
  const { startTracking, stopTracking } = useDriverTracking();

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(Number(value)))) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const normalizeJob = (booking) => ({
    id: booking.id,
    type: booking.service_type?.replace('_', ' ').toUpperCase() || 'Service',
    customer: booking.customer_name || 'Customer',
    customer_phone: booking.customer_phone,
    location: booking.location_name || booking.address || 'Mapped Location',
    address: booking.address,
    estimated_price: booking.estimated_price,
    tank_size: booking.tank_size,
    scheduled_date: booking.scheduled_date,
    customerLocation: {
      lat: parseFloat(booking.latitude) || -1.2921,
      lng: parseFloat(booking.longitude) || 36.8219
    },
    time: booking.scheduled_date
      ? new Date(booking.scheduled_date).toLocaleString('en-KE', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'To be confirmed',
    status: booking.status,
    distance: booking.distance
  });

  const formatCurrency = (amount) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return `KES ${val.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
  };

  const fetchDriverData = async ({ quiet = false } = {}) => {
    try {
      const profile = await authAPI.getCurrentUser();
      setUser(profile);
      setIsOnline(Boolean(profile.is_online));

      const vehicleRequest = fetch('/api/vehicles/me/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      }).then((r) => r.json()).catch(() => null);

      const [vehicleResult, myBookingsResult, availableResult, statsResult, dailyResult] = await Promise.allSettled([
        vehicleRequest,
        bookingsAPI.getUserBookings(),
        profile.is_online ? bookingsAPI.getAvailableBookings() : Promise.resolve([]),
        bookingsAPI.getStats(),
        fetch('/api/vehicles/daily-trips/today/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        }).then((r) => r.json()).catch(() => null)
      ]);

      if (vehicleResult.status === 'fulfilled' && vehicleResult.value?.id) {
        setVehicle(vehicleResult.value);
      }

      const bookingsValue = myBookingsResult.status === 'fulfilled' ? myBookingsResult.value : [];
      const bookings = Array.isArray(bookingsValue)
        ? bookingsValue
        : bookingsValue.results || bookingsValue.data || [];
      setMyBookings(bookings);

      const availableValue = availableResult.status === 'fulfilled' ? availableResult.value : [];
      const available = Array.isArray(availableValue)
        ? availableValue
        : availableValue.results || availableValue.data || [];

      const driverLat = parseFloat(localStorage.getItem('driverLat')) || -1.2921;
      const driverLon = parseFloat(localStorage.getItem('driverLon')) || 36.8219;
      const jobsWithDistance = available
        .map((job) => ({
          ...job,
          distance: job.distance_km || calculateDistance(
            driverLat,
            driverLon,
            parseFloat(job.latitude),
            parseFloat(job.longitude)
          )
        }))
        .sort((a, b) => Number(a.distance || 9999) - Number(b.distance || 9999));

      setAvailableJobs(profile.is_online ? jobsWithDistance : []);

      const incoming = jobsWithDistance.find((job) => job.is_current_user_notified) ||
        bookings.find((booking) => REQUEST_STATUSES.includes(booking.status));
      setActiveRequest(incoming ? normalizeJob(incoming) : null);

      const activeJob = bookings.find((booking) => ACTIVE_STATUSES.includes(booking.status));
      if (activeJob) {
        const normalized = normalizeJob(activeJob);
        setCurrentJob(normalized);
        setJobStatus(activeJob.status === 'accepted' ? 'active' : activeJob.status);
      } else {
        setCurrentJob(null);
        setJobStatus('active');
      }

      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : {};
      if (statsData.summary) setSummary(statsData.summary);
      if (statsData.stats_table) setStats(statsData.stats_table);

      if (dailyResult.status === 'fulfilled' && dailyResult.value) {
        const dailyData = dailyResult.value;
        setDailyReport({
          total_kilometers: Number(dailyData.total_kilometers || 0),
          fuel_consumed_liters: Number(dailyData.fuel_consumed_liters || 0),
          waste_emptied_liters: Number(dailyData.waste_emptied_liters || 0),
          revenue_generated: statsData?.stats_table?.today?.earnings || dailyData.revenue_generated || 0
        });
      }

      if (!quiet && [myBookingsResult, availableResult, statsResult].some((result) => result.status === 'rejected')) {
        toast.error('Some dashboard sections could not be loaded.');
      }
    } catch (error) {
      console.error('Error fetching driver dashboard', error);
      if (!quiet) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  useEffect(() => {
    if (!isOnline || activeTab !== 'home') return undefined;
    const interval = setInterval(() => fetchDriverData({ quiet: true }), 7000);
    return () => clearInterval(interval);
  }, [isOnline, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const handleToggleOnline = async () => {
    try {
      const res = await authAPI.toggleOnline();
      setIsOnline(res.is_online);
      if (res.is_online) {
        startTracking();
        fetchDriverData({ quiet: true });
      } else {
        stopTracking();
        setAvailableJobs([]);
        setActiveRequest(null);
      }
      toast.success(res.is_online ? 'You are online' : 'You are offline');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAcceptJob = async (jobId) => {
    const toastId = toast.loading('Accepting job...');
    try {
      await bookingsAPI.acceptBooking(jobId);
      toast.success('Job accepted', { id: toastId });
      fetchDriverData({ quiet: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept job', { id: toastId });
    }
  };

  const handleRejectJob = async (jobId) => {
    const toastId = toast.loading('Declining request...');
    try {
      await bookingsAPI.rejectBooking(jobId);
      toast.success('Request declined', { id: toastId });
      setActiveRequest(null);
      fetchDriverData({ quiet: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to decline request', { id: toastId });
    }
  };

  const handleStartJob = async () => {
    try {
      await bookingsAPI.startJob(currentJob.id);
      setJobStatus('started');
      toast.success('Job started');
      fetchDriverData({ quiet: true });
    } catch (error) {
      toast.error('Failed to start job');
    }
  };

  const handleArrived = async () => {
    try {
      await bookingsAPI.arriveAtLocation(currentJob.id);
      setJobStatus('arrived');
      toast.success('Marked as arrived');
      fetchDriverData({ quiet: true });
    } catch (error) {
      toast.error('Failed to mark as arrived');
    }
  };

  const handleCompleteJob = async () => {
    if (!window.confirm('Mark this job as completed?')) return;
    const toastId = toast.loading('Completing job...');
    try {
      await bookingsAPI.completeBooking(currentJob.id);
      toast.success('Job completed', { id: toastId });
      setCurrentJob(null);
      fetchDriverData({ quiet: true });
    } catch (error) {
      toast.error('Failed to complete job', { id: toastId });
    }
  };

  const handleCall = () => {
    if (!currentJob?.customer_phone) {
      toast.error('Phone not available');
      return;
    }
    window.location.href = `tel:${currentJob.customer_phone}`;
  };

  const handleMessage = () => {
    if (!currentJob?.customer_phone) return;
    window.location.href = `sms:${currentJob.customer_phone}?body=Hello ${currentJob.customer}, I am your UsafiLink driver. I will arrive shortly.`;
  };

  const handleDirections = (job = currentJob) => {
    if (!job?.customerLocation) return;
    const { lat, lng } = job.customerLocation;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  const todayBookings = useMemo(() => {
    const today = new Date().toDateString();
    return myBookings
      .filter((booking) => booking.scheduled_date && new Date(booking.scheduled_date).toDateString() === today)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  }, [myBookings]);

  const otherAvailableJobs = availableJobs.filter((job) => job.id !== activeRequest?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
          <p className="text-slate-500 font-medium">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 pb-20 md:pb-8">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black truncate">Driver Dispatch</h1>
                <p className="text-xs text-slate-500 truncate">{user?.first_name || user?.username || 'Driver'}{vehicle?.plate_number ? ` - ${vehicle.plate_number}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleOnline}
                className={`h-10 px-3 rounded-lg border font-bold text-xs flex items-center gap-2 ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </button>
              <button onClick={handleLogout} className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-red-600 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { id: 'home', label: 'Dispatch', icon: Route },
              { id: 'schedule', label: 'Schedule', icon: Clock },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                  activeTab === id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {activeTab === 'profile' ? (
          <Profile user={user} isEmbedded={true} />
        ) : activeTab === 'schedule' ? (
          <DriverSchedule />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)] gap-4">
            <section className="space-y-4">
              {activeRequest && (
                <div className="bg-white border-2 border-amber-400 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-black text-slate-950">Incoming Job Request</h2>
                        <p className="text-sm text-amber-800">Booking #{activeRequest.id} needs a response</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-amber-800 bg-white border border-amber-200 px-3 py-1.5 rounded-lg">
                      {activeRequest.distance ? `${Number(activeRequest.distance).toFixed(1)} km` : 'Nearby'}
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid md:grid-cols-[1fr_auto] gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                        <h3 className="text-2xl font-black text-slate-950 mt-1">{activeRequest.location}</h3>
                        <p className="text-sm text-slate-600 mt-1">{activeRequest.type.toLowerCase()} - {activeRequest.time}</p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase">Estimate</p>
                        <p className="text-2xl font-black text-emerald-700">{formatCurrency(activeRequest.estimated_price)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleDirections(activeRequest)} className="h-12 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Maps
                      </button>
                      <button onClick={() => handleRejectJob(activeRequest.id)} className="h-12 rounded-lg border border-red-200 text-red-700 font-bold flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                      <button onClick={() => handleAcceptJob(activeRequest.id)} className="h-12 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentJob ? (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase">Current Job</p>
                      <h2 className="text-xl font-black text-slate-950">Booking #{currentJob.id}</h2>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase">
                      {currentJob.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-0">
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-2xl font-black capitalize">{currentJob.type.toLowerCase()}</h3>
                        <div className="mt-3 grid sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase">Customer</p>
                            <p className="font-bold mt-1">{currentJob.customer}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase">Time</p>
                            <p className="font-bold mt-1">{currentJob.time}</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-bold">{currentJob.location}</p>
                            {currentJob.address && <p className="text-sm text-slate-500">{currentJob.address}</p>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleDirections()} className="h-12 rounded-lg bg-slate-950 text-white font-bold flex items-center justify-center gap-2">
                          <Navigation className="w-4 h-4" />
                          Maps
                        </button>
                        <button onClick={handleCall} className="h-12 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4" />
                          Call
                        </button>
                        <button onClick={handleMessage} className="h-12 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          SMS
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <button onClick={handleStartJob} disabled={jobStatus !== 'active'} className={`h-12 rounded-lg font-black ${jobStatus === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          Start
                        </button>
                        <button onClick={handleArrived} disabled={!['active', 'started'].includes(jobStatus)} className={`h-12 rounded-lg font-black ${['active', 'started'].includes(jobStatus) ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          Arrived
                        </button>
                        <button onClick={handleCompleteJob} disabled={!['started', 'arrived'].includes(jobStatus)} className={`h-12 rounded-lg font-black ${['started', 'arrived'].includes(jobStatus) ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          Complete
                        </button>
                      </div>
                    </div>
                    <div className="border-t lg:border-t-0 lg:border-l border-slate-200 min-h-[320px]">
                      <RouteMap job={{ id: currentJob.id, customerLocation: currentJob.customerLocation, customerName: currentJob.customer, customerAddress: currentJob.location }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Power className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black">{isOnline ? 'Ready For Dispatch' : 'You Are Offline'}</h2>
                        <p className="text-sm text-slate-500">{isOnline ? 'Waiting for the next job request.' : 'Go online when you are ready to receive jobs.'}</p>
                      </div>
                    </div>
                    <button onClick={handleToggleOnline} className={`h-12 px-5 rounded-lg font-black ${isOnline ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white'}`}>
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-lg">Nearby Available Jobs</h2>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">{otherAvailableJobs.length} jobs</span>
                </div>
                {!isOnline ? (
                  <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Go online to see nearby jobs.
                  </div>
                ) : otherAvailableJobs.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No nearby jobs right now.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {otherAvailableJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{job.location_name || job.address || `Booking #${job.id}`}</p>
                          <p className="text-sm text-slate-500 truncate">
                            {job.service_type?.replace('_', ' ') || 'Service'}{job.distance ? ` - ${Number(job.distance).toFixed(1)} km` : ''}
                          </p>
                        </div>
                        <button onClick={() => handleAcceptJob(job.id)} className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-bold">
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Jobs Today</p>
                  <p className="text-2xl font-black">{summary.jobs_done}<span className="text-base text-slate-400">/{summary.total_jobs}</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Earnings</p>
                  <p className="text-2xl font-black">{formatCurrency(summary.earnings)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <Star className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Rating</p>
                  <p className="text-2xl font-black">{summary.rating}<span className="text-base text-slate-400">/5</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <Clock className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Online</p>
                  <p className="text-2xl font-black">{summary.hours_online}h</p>
                </div>
              </div>

              {vehicle && (
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black">Vehicle</h2>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${vehicle.service_status === 'operational' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {vehicle.service_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Plate</p>
                      <p className="font-black">{vehicle.plate_number}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Capacity</p>
                      <p className="font-black">{vehicle.capacity}L</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black">Today</h2>
                  <button onClick={() => setActiveTab('schedule')} className="text-sm font-bold text-emerald-700">Schedule</button>
                </div>
                {todayBookings.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">No scheduled jobs today.</div>
                ) : (
                  <div className="space-y-2">
                    {todayBookings.slice(0, 4).map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => navigate(`/driver/bookings/${booking.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold truncate">#{booking.id} {booking.location_name || 'Mapped location'}</p>
                          <span className="text-xs font-bold text-slate-500">{new Date(booking.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-500 capitalize">{booking.status?.replace('_', ' ')}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h2 className="font-black mb-3">Trip Report</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase">Distance</p>
                    <p className="font-black">{dailyReport.total_kilometers.toFixed(1)} km</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase">Fuel</p>
                    <p className="font-black">{dailyReport.fuel_consumed_liters.toFixed(1)} L</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase">Waste</p>
                    <p className="font-black">{dailyReport.waste_emptied_liters.toFixed(1)} L</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase">Revenue</p>
                    <p className="font-black">{formatCurrency(dailyReport.revenue_generated)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h2 className="font-black mb-3">Performance</h2>
                {[
                  { label: 'Today', earnings: stats.today.earnings, jobs: stats.today.jobs },
                  { label: 'This Week', earnings: stats.week.earnings, jobs: stats.week.jobs },
                  { label: 'This Month', earnings: stats.month.earnings, jobs: stats.month.jobs }
                ].map((period) => (
                  <div key={period.label} className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-100">
                    <div>
                      <p className="font-bold">{period.label}</p>
                      <p className="text-xs text-slate-500">{period.jobs} jobs</p>
                    </div>
                    <p className="font-black text-emerald-700">{formatCurrency(period.earnings)}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
