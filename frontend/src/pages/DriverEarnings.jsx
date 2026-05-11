import React from 'react';
import { DollarSign, TrendingUp, Calendar, CreditCard, Truck, Wallet, ArrowUpRight } from 'lucide-react';

const DriverEarnings = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">My Earnings</h1>
            <p className="text-xs text-slate-500">Track your income and payouts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Wallet className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Earnings Dashboard</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Your detailed earnings reports, payment history, and transfer options will appear here once you complete more jobs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-900">Weekly Stats</p>
              <p className="text-xs text-slate-500 mt-1">Track performance</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
              <p className="font-bold text-slate-900">Payout Schedule</p>
              <p className="text-xs text-slate-500 mt-1">View upcoming deposits</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-bold text-slate-900">Bank Accounts</p>
              <p className="text-xs text-slate-500 mt-1">Manage payment methods</p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Earned', value: 'KES 0.00', icon: DollarSign, color: 'emerald' },
            { label: 'This Week', value: 'KES 0.00', icon: TrendingUp, color: 'blue' },
            { label: 'Jobs Done', value: '0', icon: ArrowUpRight, color: 'violet' },
            { label: 'Avg per Job', value: 'KES 0.00', icon: Wallet, color: 'amber' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
