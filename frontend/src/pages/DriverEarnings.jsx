import React from 'react';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';

const DriverEarnings = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Earnings Dashboard</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Your detailed earnings reports, payment history, and transfer options will appear here once you complete more jobs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold">Weekly Stats</p>
            <p className="text-sm text-gray-500">Track performance</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="font-semibold">Payout Schedule</p>
            <p className="text-sm text-gray-500">View upcoming deposits</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <CreditCard className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="font-semibold">Bank Accounts</p>
            <p className="text-sm text-gray-500">Manage payment methods</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
