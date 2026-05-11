// frontend/src/pages/admin/Disputes.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Search, Filter, Shield, Gavel } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const data = await adminAPI.getDisputes();
      setDisputes(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId) => {
    const resolution = prompt('Enter resolution details:');
    if (resolution) {
      try {
        await adminAPI.resolveDispute(disputeId, resolution);
        toast.success('Dispute resolved');
        fetchDisputes();
      } catch (error) {
        toast.error('Failed to resolve dispute');
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dismissed: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Dispute Management</h1>
              <p className="text-xs text-slate-500">Resolve customer disputes and issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield className="w-4 h-4" />
            <span>{disputes.filter(d => d.status === 'pending').length} pending</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: disputes.length, color: 'blue' },
            { label: 'Pending', value: disputes.filter(d => d.status === 'pending').length, color: 'amber' },
            { label: 'Resolved', value: disputes.filter(d => d.status === 'resolved').length, color: 'emerald' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Disputes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-bold text-slate-900">Dispute #{dispute.id}</span>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(dispute.status)}`}>
                  {dispute.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Booking</p>
                  <p className="font-bold text-slate-900">#{dispute.booking_details?.id}</p>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Raised By</p>
                  <p className="font-semibold text-slate-900">{dispute.raised_by_name}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</p>
                  <p className="text-sm text-slate-700">{dispute.reason}</p>
                </div>

                {dispute.resolution && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Resolution</p>
                    <p className="text-sm text-emerald-800">{dispute.resolution}</p>
                  </div>
                )}

                {dispute.status === 'pending' && (
                  <button
                    onClick={() => handleResolve(dispute.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold transition-colors shadow-sm"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {disputes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Disputes</h3>
            <p className="text-slate-500">All disputes have been resolved. Great job!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDisputes;