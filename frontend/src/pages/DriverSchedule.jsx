import React from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

const DriverSchedule = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Schedule</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upcoming Shifts & Jobs</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Your scheduled jobs, shift hours, and availability settings will be managed here.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-left">
            <Clock className="w-8 h-8 text-teal-500" />
            <div>
              <p className="font-bold text-gray-900">Set Hours</p>
              <p className="text-xs text-gray-500">Define your working times</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-left">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-bold text-gray-900">Availability</p>
              <p className="text-xs text-gray-500">Manage your free days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSchedule;
