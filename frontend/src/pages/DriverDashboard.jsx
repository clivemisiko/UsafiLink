import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  Calendar,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Phone,
  Clock,
  Navigation,
  ToggleLeft,
  MessageSquare,
  ChevronRight,
  Loader
} from 'lucide-react';
import RouteMap from '../components/RouteMap';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';

const DriverDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [jobStatus, setJobStatus] = useState('active'); // active, started, arrived, completed
  const [currentJob, setCurrentJob] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
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

  const fetchDriverData = async () => {
    try {
      // 0. Get Profile for Online Status
      const profile = await authAPI.getCurrentUser();
      setIsOnline(profile.is_online);

      // 1. Get My Active Jobs
      const myBookings = await bookingsAPI.getUserBookings();
      const activeJob = myBookings.find(b => b.status === 'accepted' || b.status === 'started' || b.status === 'arrived' || b.status === 'pending');

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
        if (activeJob.status === 'started') setJobStatus('started');
        else if (activeJob.status === 'arrived') setJobStatus('arrived');
        else if (activeJob.status === 'accepted') setJobStatus('active');
        else if (activeJob.status === 'pending') setJobStatus('pending');
      } else {
        setCurrentJob(null);
        setJobStatus('active');
      }

      // 2. Get Available Jobs (Pending & Unassigned)
      const available = await bookingsAPI.getAvailableBookings();
      setAvailableJobs(available);

      // 3. Get Stats
      const statsData = await bookingsAPI.getStats();
      if (statsData.summary) setSummary(statsData.summary);
      if (statsData.stats_table) setStats(statsData.stats_table);

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
      fetchDriverData(); // Refresh to move it to current job
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept job.', { id: toastId });
    }
  };

  // Job action handlers
  const handleStartJob = async () => {
    try {
      await bookingsAPI.startJob(currentJob.id);
      setJobStatus('started');
      toast.success('✅ Job started! You are now on the way.', {
        duration: 3000,
        icon: '⏱️'
      });
      fetchDriverData();
    } catch (error) {
      toast.error('Failed to start job');
    }
  };

  const handleArrived = async () => {
    try {
      await bookingsAPI.arriveAtLocation(currentJob.id);
      setJobStatus('arrived');
      toast.success('📍 Marked as arrived at customer location!', {
        duration: 3000,
      });
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
        toast.success('🎉 Job completed successfully! invoice generated.', {
          id: toastId,
          duration: 4000
        });
        setJobStatus('active');
        setCurrentJob(null);
        fetchDriverData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to complete job. Please try again.', { id: toastId });
      }
    }
  };

  const handleCall = () => {
    const phone = currentJob?.customer_phone;
    if (!phone) {
      toast.error("Customer phone number not available");
      return;
    }
    toast.success(`Calling customer at ${phone}`, {
      icon: '📞',
      duration: 2000
    });
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = () => {
    const phone = currentJob?.customer_phone;
    if (!phone) {
      toast.error("Customer phone number not available");
      return;
    }
    const message = `Hello ${currentJob.customer}, I am your UsafiLink driver. I will arrive shortly.`;
    toast.success('Opening messages...', {
      icon: '💬',
      duration: 2000
    });
    // SMS link (works on mobile)
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const handleDirections = () => {
    if (!currentJob?.customerLocation) return;
    const destination = currentJob.customerLocation;
    toast.success('Opening navigation...', {
      icon: '🗺️',
      duration: 2000
    });
    // Open in Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const formatCurrency = (amount) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return `KES ${val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">UsafiLink Driver</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await authAPI.toggleOnline();
                  setIsOnline(res.is_online);
                  toast.success(res.detail, { icon: res.is_online ? '🔵' : '⚪' });
                } catch (err) {
                  toast.error("Failed to update status");
                }
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full font-semibold transition text-sm ${isOnline
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-200 text-gray-700 border border-gray-300'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-600' : 'bg-gray-500'}`}></div>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>
            <button onClick={handleLogout} className="text-sm text-red-600 font-medium">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Today's Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Today's Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Jobs</p>
              <p className="text-xl font-bold text-gray-900">{summary.jobs_done}/{summary.total_jobs}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Earnings</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(summary.earnings)}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Rating</p>
              <p className="text-xl font-bold text-yellow-700">{summary.rating}/5</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Hours</p>
              <p className="text-xl font-bold text-purple-700">{summary.hours_online}h</p>
            </div>
          </div>
        </div>

        {/* Current Job */}
        {currentJob ? (
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-600 overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h2 className="font-bold text-blue-900">Current Job</h2>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">In Progress</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentJob.type}</h3>
                  <p className="text-gray-600">Booking #{currentJob.id}</p>
                </div>
                <div className="text-right">
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{currentJob.location}</p>
                    <p className="text-xs text-gray-500">{currentJob.customer}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <p>{currentJob.time}</p>
                </div>
              </div>

              {/* Google Maps Navigation */}
              <div className="mb-6">
                <RouteMap
                  job={{
                    id: currentJob.id,
                    customerLocation: currentJob.customerLocation,
                    customerName: currentJob.customer,
                    customerAddress: currentJob.location
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={handleDirections}
                  className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Navigation className="w-6 h-6 text-blue-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Directions</span>
                </button>
                <button
                  onClick={handleCall}
                  className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Phone className="w-6 h-6 text-green-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Call</span>
                </button>
                <button
                  onClick={handleMessage}
                  className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <MessageSquare className="w-6 h-6 text-purple-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700">Message</span>
                </button>
              </div>

              <div className="space-y-2">
                {jobStatus === 'pending' && (
                  <div className="space-y-2">
                    <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold py-2 rounded-lg text-center mb-2">
                      ⚠️ Job Assigned (Waiting Acceptance)
                    </div>
                    <button
                      onClick={() => handleAcceptJob(currentJob.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                    >
                      Accept Job
                    </button>
                  </div>
                )}
                {jobStatus === 'active' && (
                  <button
                    onClick={handleStartJob}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    Start Job
                  </button>
                )}
                {jobStatus === 'started' && (
                  <div className="w-full bg-green-100 border border-green-300 text-green-800 font-bold py-3 rounded-lg text-center">
                    ⏱️ Job In Progress...
                  </div>
                )}
                {jobStatus === 'arrived' && (
                  <div className="w-full bg-purple-100 border border-purple-300 text-purple-800 font-bold py-3 rounded-lg text-center">
                    📍 At Customer Location
                  </div>
                )}
                {jobStatus === 'completed' && (
                  <div className="w-full bg-green-500 text-white font-bold py-3 rounded-lg text-center">
                    ✅ Job Completed!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleArrived}
                    disabled={jobStatus === 'completed'}
                    className={`font-semibold py-2 rounded-lg transition ${jobStatus === 'completed'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                  >
                    Arrived
                  </button>
                  <button
                    onClick={handleCompleteJob}
                    disabled={jobStatus === 'completed'}
                    className={`font-semibold py-2 rounded-lg transition ${jobStatus === 'completed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Jobs</h3>
            <p className="text-gray-600">You don't have any jobs in progress right now.</p>
          </div>
        )}

        {/* Available Jobs Queue */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Job Queue</h2>
            <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {availableJobs.length} Available
            </span>
          </div>

          {availableJobs.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              No new jobs available at the moment.
            </div>
          ) : (
            availableJobs.map((job, index) => (
              <div key={job.id} className="flex items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {new Date(job.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {job.service_type?.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">{job.customer_name} • {job.location_name}</p>
                </div>
                <button
                  onClick={() => handleAcceptJob(job.id)}
                  className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-blue-700 transition"
                >
                  Accept
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Stats Table */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Statistics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 font-medium text-gray-500">Period</th>
                  <th className="pb-2 font-medium text-gray-500">Earnings</th>
                  <th className="pb-2 font-medium text-gray-500">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 text-gray-900">Today</td>
                  <td className="py-2 font-medium text-green-600">{formatCurrency(stats.today.earnings)}</td>
                  <td className="py-2 text-gray-900">{stats.today.jobs} jobs</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-900">Week</td>
                  <td className="py-2 font-medium text-green-600">{formatCurrency(stats.week.earnings)}</td>
                  <td className="py-2 text-gray-900">{stats.week.jobs} jobs</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-900">Month</td>
                  <td className="py-2 font-medium text-green-600">{formatCurrency(stats.month.earnings)}</td>
                  <td className="py-2 text-gray-900">{stats.month.jobs} jobs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DriverDashboard;
