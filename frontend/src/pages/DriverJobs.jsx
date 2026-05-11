import React, { useState, useEffect } from 'react';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, DollarSign, Navigation, XCircle, CheckCircle, Power, Truck, Loader2 } from 'lucide-react';
import { useDriverTracking } from '../hooks/useDriverTracking';

const DriverJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const { startTracking, stopTracking } = useDriverTracking();

  const fetchJobs = async () => {
    try {
      const data = await bookingsAPI.getAvailableBookings();
      setJobs(data);
      setIsOffline(false);

      // Check for active incoming requests
      // In our modified backend, they come first
      const incoming = data.find(job => job.is_current_user_notified);
      setActiveRequest(incoming || null);

    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (error.response && error.response.status === 403) {
        // Likely offline
        setIsOffline(true);
      }
      // toast.error('Check your internet connection');
    } finally {
      setLoading(false);
    }
  };

  const handleGoOnline = async () => {
    try {
      await authAPI.toggleOnline();
      startTracking(); // Start location tracking when coming online
      toast.success('You are now ONLINE');
      setIsOffline(false);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to go online');
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll every 5 seconds for new jobs, unless offline
    const interval = setInterval(() => {
      if (!isOffline) fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const handleAccept = async (id) => {
    try {
      await bookingsAPI.acceptBooking(id);
      toast.success('Job Accepted! Navigating to details...');
      fetchJobs();
      // Redirect or show details
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept job');
      fetchJobs();
    }
  };

  const handleReject = async (id) => {
    try {
      await bookingsAPI.rejectBooking(id);
      toast.success('Job Ignored');
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject job');
    }
  };

  if (isOffline) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Power className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You are Offline</h2>
          <p className="text-slate-500 mb-8">Go online to start receiving job requests in your area.</p>
          <button
            onClick={handleGoOnline}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
          >
            GO ONLINE
          </button>
        </div>
      </div>
    );
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
          <p className="text-slate-500 font-medium">Loading available jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Job Board</h1>
              <p className="text-xs text-slate-500">Find and accept jobs</p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold border border-emerald-200">
            Online & Searching
          </span>
        </div>

        {/* Active Incoming Request Card (Uber-style) */}
        {activeRequest && (
          <div className="bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-100 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Incoming Request</h2>
                  <p className="text-xs text-emerald-100">Action required</p>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1.5 rounded-full font-bold">
                {activeRequest.distance_km ? `${activeRequest.distance_km} km away` : 'Nearby'}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-lg block">{activeRequest.location_name}</span>
                      <p className="text-slate-500 text-sm">{activeRequest.address}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">KES {parseInt(activeRequest.estimated_price).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 capitalize">{activeRequest.service_type.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleReject(activeRequest.id)}
                  className="flex items-center justify-center gap-2 py-4 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-5 h-5" /> Decline
                </button>
                <button
                  onClick={() => handleAccept(activeRequest.id)}
                  className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" /> Accept Job
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 text-center text-xs text-slate-500 border-t border-slate-100">
              Auto-declining in 30 seconds if no response
            </div>
          </div>
        )}

        {/* Other Available Jobs */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Available Jobs</h3>
          </div>

          {jobs.filter(j => j.id !== activeRequest?.id).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No other jobs currently available.</p>
            </div>
          ) : (
            jobs.filter(j => j.id !== activeRequest?.id).map(job => (
              <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{job.location_name}</h4>
                      <p className="text-slate-500 text-sm mt-1 capitalize">{job.service_type.replace('_', ' ')} • {job.tank_size}L tank</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-lg">KES {parseInt(job.estimated_price).toLocaleString()}</span>
                    <button
                      onClick={() => handleAccept(job.id)}
                      className="block mt-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-semibold transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverJobs;
