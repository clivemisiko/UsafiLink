import React, { useState, useEffect } from 'react';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, DollarSign, Navigation, XCircle, CheckCircle, Power } from 'lucide-react';

const DriverJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

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
      <div className="p-6 text-center max-w-md mx-auto mt-20">
        <div className="bg-gray-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <Power className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">You are Offline</h2>
        <p className="text-gray-500 mb-8">Go online to start receiving job requests.</p>
        <button
          onClick={handleGoOnline}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg"
        >
          GO ONLINE
        </button>
      </div>
    );
  }

  if (loading && jobs.length === 0) {
    return <div className="p-6 text-center">Loading available jobs...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Job Board</h1>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          Online & Searching
        </span>
      </div>

      {/* Active Incoming Request Card (Uber-style) */}
      {activeRequest && (
        <div className="bg-white border-2 border-green-500 shadow-xl rounded-xl overflow-hidden animate-pulse">
          <div className="bg-green-600 text-white p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="animate-pulse" /> INCOMING REQUEST
            </h2>
            <span className="text-sm bg-green-700 px-2 py-1 rounded">
              Action Required
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="text-red-500" />
                  <span className="font-medium text-lg">{activeRequest.location_name}</span>
                </div>
                <p className="text-gray-500 ml-8 truncate max-w-md">{activeRequest.address}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-800">KES {parseInt(activeRequest.estimated_price).toLocaleString()}</p>
                <p className="text-sm text-gray-500">{activeRequest.service_type.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => handleReject(activeRequest.id)}
                className="flex items-center justify-center gap-2 py-4 border-2 border-red-500 text-red-600 rounded-lg font-bold text-lg hover:bg-red-50 transition-colors"
              >
                <XCircle /> IGNORE
              </button>
              <button
                onClick={() => handleAccept(activeRequest.id)}
                className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg transform transition active:scale-95"
              >
                <CheckCircle /> ACCEPT JOB
              </button>
            </div>
          </div>
          <div className="bg-gray-50 p-3 text-center text-sm text-gray-500">
            {activeRequest.distance_km ? `${activeRequest.distance_km} km away • ` : ''}
            Auto-rejecting in 30s
          </div>
        </div>
      )}

      {/* Other Available Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Other Available Jobs</h3>

        {jobs.filter(j => j.id !== activeRequest?.id).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No other jobs currently available.</p>
          </div>
        ) : (
          jobs.filter(j => j.id !== activeRequest?.id).map(job => (
            <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{job.location_name}</h4>
                  <p className="text-gray-500 text-sm mt-1">{job.service_type} • {job.tank_size}L</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-600">KES {parseInt(job.estimated_price).toLocaleString()}</span>
                  <button
                    onClick={() => handleAccept(job.id)}
                    className="block mt-2 text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
  );
};

export default DriverJobs;
