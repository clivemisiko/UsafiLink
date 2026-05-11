import React from 'react';
import { useAuth } from '../hooks/useAuth';
import DriverRatings from '../components/bookings/DriverRatings';
import { Truck, Star, Shield } from 'lucide-react';

const MyRatings = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'driver') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Only drivers can view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">My Ratings</h1>
            <p className="text-xs text-slate-500">View customer feedback</p>
          </div>
        </div>
        <DriverRatings driverId={user.id} />
      </div>
    </div>
  );
};

export default MyRatings;
