import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  RefreshCw,
  Download,
  Activity,
  Clock,
  Shield,
  AlertCircle,
  Database
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getLogs();
      setLogs(data);
    } catch (error) {
      toast.error('Failed to fetch audit trails');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogBadge = (action) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('fail') || act.includes('error'))
      return 'bg-red-50 text-red-600 border-red-100 ring-4 ring-red-50/50';
    if (act.includes('create') || act.includes('success') || act.includes('add'))
      return 'bg-green-50 text-green-600 border-green-100 ring-4 ring-green-50/50';
    if (act.includes('update') || act.includes('edit') || act.includes('change'))
      return 'bg-blue-50 text-blue-600 border-blue-100 ring-4 ring-blue-50/50';
    return 'bg-slate-50 text-slate-600 border-slate-100 ring-4 ring-slate-50/50';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action?.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  if (loading && logs.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            System Infrastructure Logs
            <Database className="w-8 h-8 text-blue-600 opacity-20" />
          </h1>
          <p className="text-gray-500 font-medium mt-1">Immutable audit trail of all platform administrative actions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Total Events</p>
              <p className="text-2xl font-black text-gray-900">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-2xl text-green-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Secure Actions</p>
              <p className="text-2xl font-black text-gray-900">{logs.filter(l => !l.action.includes('delete')).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-2xl text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Destructive</p>
              <p className="text-2xl font-black text-gray-900">{logs.filter(l => l.action.includes('delete')).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Active Admin</p>
              <p className="text-2xl font-black text-gray-900">{new Set(logs.map(l => l.user_id)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by admin, action, or details..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl shrink-0">
          {['all', 'create', 'update', 'delete'].map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${actionFilter === a ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Audit Timestamp</th>
                <th className="px-8 py-5">Administrator</th>
                <th className="px-8 py-5">Action Performed</th>
                <th className="px-8 py-5">Data Context</th>
                <th className="px-8 py-5 text-right">Network ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/5 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-xs font-black text-gray-800">{formatDate(log.created_at).split(',')[0]}</div>
                    <div className="text-[10px] font-bold text-gray-400">{formatDate(log.created_at).split(', 1')[1] || formatDate(log.created_at).split(',')[1]}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">
                        {log.user_name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-black text-gray-900">{log.user_name || 'System Engine'}</div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{log.user_role || 'Automation'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent ${getLogBadge(log.action)}`}>
                      {log.action_display?.replace('None.', '')}
                    </span>
                  </td>
                  <td className="px-8 py-5 max-w-sm">
                    <div className="text-[11px] font-medium text-gray-500 bg-gray-50 p-2 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 break-all">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="text-[10px] font-black text-slate-300 font-mono tracking-tighter">
                      {log.ip_address || '127.0.0.1'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No matching audit logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;