import React from 'react';
import { useAuth } from '../hooks/useAuth';
import DriverRatings from '../components/bookings/DriverRatings';

const MyRatings = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'driver') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Only drivers can view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto">
        <DriverRatings driverId={user.id} />
      </div>
    </div>
  );
};

export default MyRatings;
