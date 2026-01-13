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
  Loader
} from 'lucide-react';
import RouteMap from '../components/RouteMap';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';
import Profile from './Profile';

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState('home'); // home, profile
  const [isOnline, setIsOnline] = useState(false);
  const [jobStatus, setJobStatus] = useState('active'); // active, started, arrived, completed
  const [currentJob, setCurrentJob] = useState(null);
  const [user, setUser] = useState(null);
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
      const profile = await authAPI.getCurrentUser();
      const myBookings = await bookingsAPI.getUserBookings();
      const available = await bookingsAPI.getAvailableBookings();
      const statsData = await bookingsAPI.getStats();

      setUser(profile);
      setIsOnline(profile.is_online);

      // Current Job Logic
      const activeJob = myBookings.find(b =>
        ['accepted', 'started', 'arrived', 'pending', 'cancelled'].includes(b.status)
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
        else if (activeJob.status === 'pending') setJobStatus('pending');
        else if (activeJob.status === 'cancelled') setJobStatus('cancelled');
      } else {
        setCurrentJob(null);
        setJobStatus('active');
      }

      // Available Jobs Logic: Only show if online
      if (profile.is_online) {
        setAvailableJobs(available);
      } else {
        setAvailableJobs([]);
      }

      // Stats Logic
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">UsafiLink <span className="text-blue-600">Driver</span></h1>
              <p className="text-sm font-medium text-gray-400">Manage your fleet & jobs</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await authAPI.toggleOnline();
                    setIsOnline(res.is_online);
                    // Update available jobs visibility immediately upon toggle
                    if (!res.is_online) {
                      setAvailableJobs([]);
                    } else {
                      // Refresh to fetch jobs if turning online
                      fetchDriverData();
                    }
                    toast.success(res.is_online ? 'You are now Online' : 'You are now Offline', {
                      icon: res.is_online ? '🔵' : '⚪',
                      style: { borderRadius: '12px', fontWeight: 'bold' }
                    });
                  } catch (err) {
                    toast.error("Failed to update status");
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all text-sm border shadow-sm ${isOnline
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-white text-gray-500 border-gray-200'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isOnline ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
              <button onClick={handleLogout} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded-xl transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-8 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('home')}
              className={`pb-3 px-1 font-bold text-sm transition-all border-b-2 ${activeTab === 'home' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Job Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-1 font-bold text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              My Profile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {activeTab === 'profile' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Profile user={user} />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
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
                  <div className="mb-6">
                    <RouteMap job={{ id: currentJob.id, customerLocation: currentJob.customerLocation, customerName: currentJob.customer, customerAddress: currentJob.location }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button onClick={handleDirections} className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <Navigation className="w-6 h-6 text-blue-600 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Directions</span>
                    </button>
                    <button onClick={handleCall} className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <Phone className="w-6 h-6 text-green-600 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Call</span>
                    </button>
                    <button onClick={handleMessage} className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <MessageSquare className="w-6 h-6 text-purple-600 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Message</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {jobStatus === 'pending' && (
                      <div className="space-y-2">
                        <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold py-2 rounded-lg text-center mb-2">⚠️ Job Assigned (Waiting Acceptance)</div>
                        <button onClick={() => handleAcceptJob(currentJob.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">Accept Job</button>
                      </div>
                    )}
                    {jobStatus === 'active' && <button onClick={handleStartJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">Start Job</button>}
                    {jobStatus === 'started' && <div className="w-full bg-green-100 border border-green-300 text-green-800 font-bold py-3 rounded-lg text-center">⏱️ Job In Progress...</div>}
                    {jobStatus === 'arrived' && <div className="w-full bg-purple-100 border border-purple-300 text-purple-800 font-bold py-3 rounded-lg text-center">📍 At Customer Location</div>}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleArrived} disabled={jobStatus === 'completed'} className={`font-semibold py-2 rounded-lg transition ${jobStatus === 'completed' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Arrived</button>
                      <button onClick={handleCompleteJob} disabled={jobStatus === 'completed'} className={`font-semibold py-2 rounded-lg transition ${jobStatus === 'completed' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}>Complete</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-gray-400" /></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Jobs</h3>
                <p className="text-gray-600">You don't have any jobs in progress right now.</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Job Queue</h2>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{availableJobs.length} Available</span>
              </div>

              {!isOnline ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <LogOut className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-800 font-bold">You are Offline</p>
                  <p className="text-sm text-gray-500 mt-1">Go online to receive new job alerts</p>
                </div>
              ) : availableJobs.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No new jobs available.</div>
              ) : (
                availableJobs.map((job, index) => (
                  <div key={job.id} className="flex items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-4">{index + 1}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{new Date(job.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {job.service_type?.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-500">{job.customer_name} • {job.location_name}</p>
                    </div>
                    <button onClick={() => handleAcceptJob(job.id)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-blue-700 transition">Accept</button>
                  </div>
                ))
              )}
            </div>

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
                    <tr><td className="py-2">Today</td><td className="py-2 text-green-600 font-bold">{formatCurrency(stats.today.earnings)}</td><td>{stats.today.jobs}</td></tr>
                    <tr><td className="py-2">Week</td><td className="py-2 text-green-600 font-bold">{formatCurrency(stats.week.earnings)}</td><td>{stats.week.jobs}</td></tr>
                    <tr><td className="py-2">Month</td><td className="py-2 text-green-600 font-bold">{formatCurrency(stats.month.earnings)}</td><td>{stats.month.jobs}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
