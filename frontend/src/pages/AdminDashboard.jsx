import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  DollarSign,
  ArrowUpRight,
  Clock,
  Star
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { paymentsAPI } from '../api/payments';
import { bookingsAPI } from '../api/bookings';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [verifyingPayment, setVerifyingPayment] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, paymentsData, bookingsData] = await Promise.all([
        adminAPI.getDashboardStats(),
        paymentsAPI.getPayments({ status: 'pending', payment_method: 'bank' }),
        bookingsAPI.getUserBookings({ limit: 5 })
      ]);
      setStats(statsData);
      setPendingPayments(paymentsData);
      setRecentBookings(bookingsData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching admin data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBankPayment = async (paymentId, bankRef) => {
    setVerifyingPayment(paymentId);
    try {
      await paymentsAPI.verifyPayment({
        payment_id: paymentId,
        status: 'paid'
      });
      toast.success("Payment verified successfully!");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to verify payment");
    } finally {
      setVerifyingPayment(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black">Welcome back, Admin!</h1>
          <p className="mt-2 text-blue-100 font-medium opacity-90">System operations are stable. You have {pendingPayments.length} pending verifications.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 -skew-x-12 translate-x-1/2"></div>
        <Activity className="absolute right-12 top-1/2 -translate-y-1/2 w-24 h-24 text-white/10" />
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">KES {stats?.overview?.total_revenue?.toLocaleString()}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-bold">+12.5%</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase ml-auto">Overall</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:shadow-green-500/5 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Bookings</p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{stats?.overview?.total_bookings}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-bold">{stats?.overview?.online_drivers || 0} Online / {stats?.overview?.active_drivers} Active</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:shadow-yellow-500/5 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">To Verify</p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{pendingPayments.length}</h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-yellow-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold">Unchecked Transfers</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:shadow-purple-500/5 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Satisfaction</p>
              <h3 className="text-2xl font-black text-gray-900 mt-2">{stats?.overview?.avg_rating || 0.0} / 5.0</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
              <Star className="w-6 h-6 text-purple-600 fill-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-purple-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-bold">System-wide Average</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Pending Payments & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Payments - High Priority */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900">Pending Bank Transfers</h3>
              <p className="text-sm text-gray-400 font-medium">Please verify these against your KCB statements</p>
            </div>
            {pendingPayments.length > 0 && (
              <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-3 py-1 rounded-full animate-pulse tracking-wider">
                Action Required
              </span>
            )}
          </div>
          <div className="flex-1 overflow-x-auto">
            {pendingPayments.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Service Details</th>
                    <th className="px-8 py-5">Amount</th>
                    <th className="px-8 py-5">Reference</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-gray-800">Booking #{p.booking_details?.id}</div>
                        <div className="text-xs text-gray-400">{p.booking_details?.location}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-blue-600 underline underline-offset-4 decoration-blue-200">KES {p.amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-5">
                        <code className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-mono font-bold">{p.bank_reference}</code>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleVerifyBankPayment(p.id, p.bank_reference)}
                          disabled={verifyingPayment === p.id}
                          className="bg-slate-900 hover:bg-blue-600 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-slate-200 transition-all flex items-center gap-2 ml-auto"
                        >
                          {verifyingPayment === p.id ? <Clock className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <CheckCircle2 className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-900 font-black">All Clear!</p>
                <p className="text-sm text-gray-400 mt-1">No bank transfers awaiting verification.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mini Chart / Trend Card */}
        <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden flex flex-col">
          <h3 className="text-xl font-bold mb-8">Weekly Trend</h3>
          <div className="flex-1 flex items-end justify-between gap-3 px-2 mb-8">
            {[30, 60, 45, 100, 75, 40, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative h-48 flex items-end">
                  <div
                    className="w-full bg-blue-500/20 rounded-t-xl group-hover:bg-blue-500 transition-all cursor-pointer relative"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                      {h}%
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Day {i + 1}</span>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Growth</p>
              <p className="text-2xl font-black text-blue-400">+24%</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Target</p>
              <p className="text-2xl font-black text-white">85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Activities */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900">Live Service Activity</h3>
          <Link to="/admin/bookings" className="text-xs font-bold text-blue-600 hover:tracking-widest transition-all flex items-center gap-2">
            FULL ARCHIVE <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Service Type</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Assigned To</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-800 capitalize leading-none">
                      {b.service_type?.replace('_', ' ')}
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-400 font-bold">BK-{b.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-500">{b.customer_name}</td>
                  <td className="px-8 py-5">
                    {b.driver_name ? (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-black text-blue-600 ring-4 ring-blue-50">
                          {b.driver_name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{b.driver_name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-red-50 text-red-500 font-black px-3 py-1 rounded-full uppercase tracking-tighter">WAITING FOR DRIVER</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${b.status === 'completed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-900 text-sm text-right">KES {(b.final_price || b.estimated_price)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;