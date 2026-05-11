import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  CheckCircle,
  Phone,
  Clock,
  Navigation,
  MessageSquare,
  LogOut,
  Loader,
  Truck,
  Zap,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import RouteMap from '../components/RouteMap';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';
import { useDriverTracking } from '../hooks/useDriverTracking';
import Profile from './Profile';
import DriverSchedule from './DriverSchedule';

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState('home'); // home, profile, schedule
  const [isOnline, setIsOnline] = useState(false);
  const [jobStatus, setJobStatus] = useState('active'); // active, started, arrived, completed
  const [currentJob, setCurrentJob] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [sortedByDistance, setSortedByDistance] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const { startTracking, stopTracking } = useDriverTracking();
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchDriverData = async () => {
    try {
      const profile = await authAPI.getCurrentUser();
      setUser(profile);
      setIsOnline(profile.is_online);

      // Fetch vehicle details
      try {
        // This assumes an API endpoint to get the driver's vehicle
        // You may need to adjust based on your API structure
        const vehicleResponse = await fetch('/api/vehicles/me/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(r => r.json()).catch(() => null);
        if (vehicleResponse?.id) setVehicle(vehicleResponse);
      } catch (err) {
        console.log('Vehicle data not available');
      }

      const [myBookingsResult, availableResult, statsResult] = await Promise.allSettled([
        bookingsAPI.getUserBookings(),
        profile.is_online ? bookingsAPI.getAvailableBookings() : Promise.resolve([]),
        bookingsAPI.getStats()
      ]);

      console.log('🚗 Driver dashboard - myBookingsResult status:', myBookingsResult.status, myBookingsResult.value);
      console.log('🚗 Driver dashboard - availableResult status:', availableResult.status, availableResult.value);
      console.log('🚗 Driver dashboard - statsResult status:', statsResult.status, statsResult.value);

      const myBookingsValue = myBookingsResult.status === 'fulfilled' ? myBookingsResult.value : [];
      const bookings = Array.isArray(myBookingsValue) ? myBookingsValue : myBookingsValue.results || myBookingsValue.data || [];
      const available = availableResult.status === 'fulfilled' ? availableResult.value : [];
      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : {};
      
      console.log('🚗 Driver dashboard - processed bookings:', bookings);
      console.log('🚗 Driver dashboard - processed available jobs:', available);
      
      setMyBookings(bookings);

      // Current Job Logic
      const activeJob = bookings.find(b =>
        ['searching_driver', 'pending', 'accepted', 'started', 'arrived'].includes(b.status)
      );

      if (activeJob) {
        setCurrentJob({
          id: activeJob.id,
          type: activeJob.service_type?.replace('_', ' ').toUpperCase() || 'Service',
          customer: activeJob.customer_name || 'Customer',
          customer_phone: activeJob.customer_phone,
          location: activeJob.location_name || 'Mapped Location',
          customerLocation: {
            lat: parseFloat(activeJob.latitude) || -1.2921,
            lng: parseFloat(activeJob.longitude) || 36.8219
          },
          time: new Date(activeJob.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: activeJob.status
        });

        // Update local job status state
        if (activeJob.status === 'started') setJobStatus('started');
        else if (activeJob.status === 'arrived') setJobStatus('arrived');
        else if (activeJob.status === 'accepted') setJobStatus('active');
        else if (activeJob.status === 'pending' || activeJob.status === 'searching_driver') setJobStatus('pending');
      } else {
        setCurrentJob(null);
        setJobStatus('active');
      }

      // Available Jobs Logic: Sort by distance if online
      if (profile.is_online && available.length > 0) {
        // Get driver's current location (assume it's available in tracking)
        const driverLat = parseFloat(localStorage.getItem('driverLat')) || -1.2921;
        const driverLon = parseFloat(localStorage.getItem('driverLon')) || 36.8219;

        const jobsWithDistance = available.map(job => ({
          ...job,
          distance: calculateDistance(
            driverLat, driverLon,
            parseFloat(job.latitude), parseFloat(job.longitude)
          )
        }));

        // Sort by distance (nearest first)
        jobsWithDistance.sort((a, b) => a.distance - b.distance);
        setSortedByDistance(jobsWithDistance);
        setAvailableJobs(jobsWithDistance);
      } else {
        setAvailableJobs([]);
        setSortedByDistance([]);
      }

      // Daily Report Logic
      try {
        const dailyData = await fetch('/api/vehicles/daily-trips/today/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(r => r.json()).catch(() => null);
        if (dailyData) {
          setDailyReport({
            total_kilometers: dailyData.total_kilometers || 0,
            fuel_consumed_liters: dailyData.fuel_consumed_liters || 0,
            waste_emptied_liters: dailyData.waste_emptied_liters || 0,
            revenue_generated: statsData?.stats_table?.today?.earnings || dailyData.revenue_generated || 0
          });
        }
      } catch (err) {
        console.log('Daily report data not available');
      }

      // Stats Logic
      if (statsData.summary) setSummary(statsData.summary);
      if (statsData.stats_table) setStats(statsData.stats_table);
      if (myBookingsResult.status === 'rejected' || availableResult.status === 'rejected' || statsResult.status === 'rejected') {
        toast.error('Some dashboard sections could not be loaded.');
      }

    } catch (error) {
      console.error("Error fetching driver jobs", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId) => {
    const toastId = toast.loading('Accepting job...');
    try {
      await bookingsAPI.acceptBooking(jobId);
      toast.success('Job Accepted! It is now your active job.', { id: toastId });
      fetchDriverData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept job.', { id: toastId });
    }
  };

  const handleStartJob = async () => {
    try {
      await bookingsAPI.startJob(currentJob.id);
      setJobStatus('started');
      toast.success('✅ Job started! You are now on the way.', { duration: 3000, icon: '⏱️' });
      fetchDriverData();
    } catch (error) {
      toast.error('Failed to start job');
    }
  };

  const handleArrived = async () => {
    try {
      await bookingsAPI.arriveAtLocation(currentJob.id);
      setJobStatus('arrived');
      toast.success('📍 Marked as arrived!', { duration: 3000 });
      fetchDriverData();
    } catch (error) {
      toast.error('Failed to mark as arrived');
    }
  };

  const handleCompleteJob = async () => {
    if (window.confirm('Mark this job as completed? This will generate an invoice for the customer.')) {
      const toastId = toast.loading('Completing job...');
      try {
        await bookingsAPI.completeBooking(currentJob.id);
        toast.success('🎉 Job completed successfully!', { id: toastId, duration: 4000 });
        setJobStatus('active');
        setCurrentJob(null);
        fetchDriverData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to complete job.', { id: toastId });
      }
    }
  };

  const handleCall = () => {
    const phone = currentJob?.customer_phone;
    if (!phone) { toast.error("Phone not available"); return; }
    window.location.href = `tel:${phone}`;
  };

  const handleDirections = () => {
    if (!currentJob?.customerLocation) return;
    const { lat, lng } = currentJob.customerLocation;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  const handleMessage = () => {
    const phone = currentJob?.customer_phone;
    if (!phone) return;
    window.location.href = `sms:${phone}?body=Hello ${currentJob.customer}, I am your UsafiLink driver. I will arrive shortly.`;
  };

  const formatCurrency = (amount) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return `KES ${val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
    <div className="min-h-screen bg-parchment text-ink pb-20 md:pb-6">
      <header className="bg-parchment border-b border-muted sticky top-0 z-50">
        <div className="w-full px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Driver Portal</h1>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Manage your fleet & jobs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await authAPI.toggleOnline();
                    setIsOnline(res.is_online);
                    
                    // Start/stop location tracking
                    if (res.is_online) {
                      startTracking();
                      // Refresh to fetch jobs if turning online
                      fetchDriverData();
                    } else {
                      stopTracking();
                      setAvailableJobs([]);
                    }
                    
                    toast.success(res.is_online ? 'You are now Online' : 'You are now Offline', {
                      icon: res.is_online ? '🔵' : '⚪',
                      style: { borderRadius: '12px', fontWeight: 'bold' }
                    });
                  } catch (err) {
                    toast.error("Failed to update status");
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm border ${isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
              <button onClick={handleLogout} className="text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-6 border-b border-slate-100">
            {[
              { id: 'home', label: 'Dashboard', icon: TrendingUp },
              { id: 'schedule', label: 'Schedule', icon: Clock },
              { id: 'profile', label: 'Profile', icon: MapPin },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-3 px-1 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === id 
                    ? 'border-emerald-500 text-emerald-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="w-full p-4 space-y-6">
        {activeTab === 'profile' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Profile user={user} isEmbedded={true} />
          </div>
        ) : activeTab === 'schedule' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DriverSchedule />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Vehicle Details Section */}
            {vehicle && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Assigned Vehicle</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Number</p>
                    <p className="text-lg font-black text-slate-900">{vehicle.plate_number}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                    <p className="text-lg font-black text-slate-900">{vehicle.capacity}L</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</p>
                    <p className="text-lg font-black text-slate-900 capitalize">{vehicle.vehicle_type?.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      vehicle.service_status === 'operational' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${vehicle.service_status === 'operational' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {vehicle.service_status}
                    </span>
                  </div>
                </div>
                {vehicle.service_status !== 'operational' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Service Status:</span> {vehicle.service_notes || 'Vehicle under maintenance'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Today's Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Jobs Done</p>
                  <p className="text-2xl font-black text-slate-900">{summary.jobs_done}<span className="text-slate-400 text-lg font-semibold">/{summary.total_jobs}</span></p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Earnings</p>
                  <p className="text-2xl font-black text-emerald-700">{formatCurrency(summary.earnings)}</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Rating</p>
                  <p className="text-2xl font-black text-amber-700">{summary.rating}<span className="text-slate-400 text-lg font-semibold">/5</span></p>
                </div>
                <div className="bg-violet-50 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Hours Online</p>
                  <p className="text-2xl font-black text-violet-700">{summary.hours_online}h</p>
                </div>
              </div>
            </div>

            {/* Daily Report Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Today's Report</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Distance</p>
                  <p className="text-2xl font-black text-slate-900">{dailyReport.total_kilometers.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">km covered</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Fuel Used</p>
                  <p className="text-2xl font-black text-slate-900">{dailyReport.fuel_consumed_liters.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">litres</p>
                </div>
                <div className="bg-cyan-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-1">Waste Emptied</p>
                  <p className="text-2xl font-black text-slate-900">{dailyReport.waste_emptied_liters.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">litres</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Revenue</p>
                  <p className="text-2xl font-black text-emerald-700">{formatCurrency(dailyReport.revenue_generated)}</p>
                </div>
              </div>
            </div>

            {currentJob ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Current Job</h2>
                      <p className="text-xs text-slate-500">Booking #{currentJob.id}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm">In Progress</span>
                </div>
                <div className="p-5">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{currentJob.type.toLowerCase()}</h3>
                  </div>
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{currentJob.location}</p>
                        <p className="text-xs text-slate-500">{currentJob.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-700">{currentJob.time}</p>
                    </div>
                  </div>
                  <div className="mb-5 rounded-xl overflow-hidden border border-slate-100">
                    <RouteMap job={{ id: currentJob.id, customerLocation: currentJob.customerLocation, customerName: currentJob.customer, customerAddress: currentJob.location }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button onClick={handleDirections} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 hover:border-emerald-200">
                      <Navigation className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Directions</span>
                    </button>
                    <button onClick={handleCall} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 hover:border-emerald-200">
                      <Phone className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Call</span>
                    </button>
                    <button onClick={handleMessage} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 hover:border-emerald-200">
                      <MessageSquare className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Message</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {jobStatus === 'pending' && (
                      <div className="space-y-2">
                        <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Waiting for Acceptance
                        </div>
                        <button onClick={() => handleAcceptJob(currentJob.id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-200">Accept Job</button>
                      </div>
                    )}
                    {jobStatus === 'active' && <button onClick={handleStartJob} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-200">Start Job</button>}
                    {jobStatus === 'started' && <div className="w-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Job In Progress</div>}
                    {jobStatus === 'arrived' && <div className="w-full bg-violet-100 border border-violet-200 text-violet-800 font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /> At Customer Location</div>}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleArrived} disabled={jobStatus === 'completed'} className={`font-bold py-3 rounded-xl transition ${jobStatus === 'completed' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>Arrived</button>
                      <button onClick={handleCompleteJob} disabled={jobStatus === 'completed'} className={`font-bold py-3 rounded-xl transition ${jobStatus === 'completed' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'}`}>Complete</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Jobs</h3>
                <p className="text-slate-500 max-w-sm mx-auto">You don't have any jobs in progress. Go online to receive new job requests.</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Assigned Jobs</h2>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">{myBookings.length} Total</span>
              </div>
              {myBookings.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500">No assigned jobs yet. Accept a job or go online to receive requests.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {myBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-slate-900">Booking #{booking.id}</p>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{booking.status?.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-slate-600 capitalize">{booking.service_type?.replace('_', ' ') || 'Service'}</p>
                      <p className="text-sm text-slate-500 mt-1">{booking.location_name || 'Location not set'}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(booking.scheduled_date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Available Jobs</h2>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">{sortedByDistance.length} Nearby</span>
              </div>

              {!isOnline ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <div className="mx-auto w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mb-3">
                    <LogOut className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-slate-800 font-bold">You are Offline</p>
                  <p className="text-sm text-slate-500 mt-1">Go online to receive new job alerts</p>
                </div>
              ) : sortedByDistance.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm">No new jobs available in your area.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedByDistance.map((job, index) => (
                    <div key={job.id} className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold text-sm mr-4 shadow-sm">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{new Date(job.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - <span className="capitalize">{job.service_type?.replace('_', ' ')}</span></p>
                        <p className="text-sm text-slate-500 truncate">{job.customer_name} • {job.location_name}</p>
                        {job.distance && (
                          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                            <Navigation className="w-3 h-3" /> {job.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleAcceptJob(job.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm ml-3 flex-shrink-0">Accept</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Performance Stats</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Today', earnings: stats.today.earnings, jobs: stats.today.jobs },
                  { label: 'This Week', earnings: stats.week.earnings, jobs: stats.week.jobs },
                  { label: 'This Month', earnings: stats.month.earnings, jobs: stats.month.jobs },
                ].map((period) => (
                  <div key={period.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-900">{period.label}</p>
                      <p className="text-xs text-slate-500">{period.jobs} jobs completed</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(period.earnings)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;

