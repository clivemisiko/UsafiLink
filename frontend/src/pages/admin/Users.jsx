import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users as UsersIcon,
  UserCheck,
  Shield,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  Edit,
  MoreVertical,
  Download,
  RefreshCw,
  Plus,
  ChevronRight,
  UserX,
  CreditCard,
  ExternalLink,
  Smartphone,
  Trash2
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/csvExport';
import UserDetailsModal from './UserDetailsModal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActions, setShowActions] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Determine the default role filter based on the URL path
    if (location.pathname === '/admin/drivers') {
      setRoleFilter('driver');
    } else if (location.pathname === '/admin/users') {
      // In this system, "Users" usually refers to Customers in the sidebar context
      // but let's keep it 'all' or 'customer' depending on preference.
      // If the user feels "Drivers" is separate, then "Users" should probably be "Customers".
      setRoleFilter('customer');
    } else {
      setRoleFilter('all');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone_number?.includes(term) ||
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u =>
        statusFilter === 'active' ? u.is_active : !u.is_active
      );
    }

    setFilteredUsers(filtered);
  };

  const handleActivateUser = async (userId) => {
    try {
      await adminAPI.activateUser(userId);
      toast.success('User activated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm('Deactivate this user? They will no longer be able to login.')) {
      try {
        await adminAPI.deactivateUser(userId);
        toast.success('User deactivated');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to deactivate user');
      }
    }
  };

  const handleApproveDriver = async (userId) => {
    try {
      await adminAPI.approveDriver(userId);
      toast.success('Driver approved');
      fetchUsers();
      setShowActions(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve driver');
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const roles = ['customer', 'driver', 'admin'];
    const newRole = prompt(`Change role from "${currentRole}" to:`, currentRole);

    if (newRole && roles.includes(newRole) && newRole !== currentRole) {
      try {
        await adminAPI.changeUserRole(userId, newRole);
        toast.success(`Role changed to ${newRole}`);
        fetchUsers();
        setShowActions(null);
      } catch (error) {
        toast.error('Failed to change role');
      }
    } else if (newRole && !roles.includes(newRole)) {
      toast.error('Invalid role. Must be: customer, driver, or admin');
    }
  };

  const handleViewDetails = (userId) => {
    setSelectedUserId(userId);
    setShowActions(null);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Remove user "${userName}"? Their account will be deactivated and personal login details anonymized, while booking history is kept.`)) {
      try {
        await adminAPI.deleteUser(userId);
        toast.success('User removed successfully');
        fetchUsers();
        setShowActions(null);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to remove user');
        console.error(error);
      }
    }
  };
  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.error("No data to export");
      return;
    }
    // Prepare data for export - remove sensitive or unnecessary fields
    const exportData = filteredUsers.map(({ password, ...u }) => u);
    exportToCSV(exportData, 'usafilink_users');
    toast.success("Exporting users CSV...");
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'driver': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'customer': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getAccountStatus = (user) => {
    if (!user.is_active) {
      return {
        label: 'Suspended',
        dotClass: 'bg-red-500',
        textClass: 'text-red-600',
      };
    }

    if (user.role === 'driver' && !user.is_driver_approved) {
      return {
        label: 'Pending Approval',
        dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]',
        textClass: 'text-amber-600',
      };
    }

    return {
      label: 'Active',
      dotClass: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]',
      textClass: 'text-green-600',
    };
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active && (u.role !== 'driver' || u.is_driver_approved)).length,
    drivers: users.filter(u => u.role === 'driver').length,
    customers: users.filter(u => u.role === 'customer').length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
            <UsersIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {roleFilter === 'driver' ? 'Driver Management' : roleFilter === 'customer' ? 'Customer Management' : 'User Directory'}
            </h1>
            <p className="text-xs text-slate-500">Manage and monitor all accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/users/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Link>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'blue', icon: UsersIcon },
          { label: 'Active', value: stats.active, color: 'emerald', icon: UserCheck },
          { label: 'Drivers', value: stats.drivers, color: 'violet', icon: Shield },
          { label: 'Customers', value: stats.customers, color: 'amber', icon: Smartphone }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-3">
              <div className={`bg-${stat.color}-50 p-2.5 rounded-xl text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
          {['all', 'customer', 'driver', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${roleFilter === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
        <select
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Any Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredUsers.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-8 py-5">Identity</th>
                  <th className="px-8 py-5">Contact Details</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => {
                  const accountStatus = getAccountStatus(u);
                  return (
                  <tr key={u.id} className="hover:bg-emerald-50/10 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-bold relative overflow-hidden ring-2 ring-transparent group-hover:ring-emerald-100 transition-all">
                          {u.username?.charAt(0).toUpperCase()}
                          {u.role === 'driver' && (
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${u.is_online ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {u.email}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {u.phone_number || 'No Phone'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${accountStatus.dotClass}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${accountStatus.textClass}`}>
                          {accountStatus.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/users/edit/${u.id}`} className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <div className="relative">
                          <button
                            onClick={() => setShowActions(showActions === u.id ? null : u.id)}
                            className={`p-2.5 rounded-xl transition-all ${showActions === u.id ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-400 hover:bg-slate-900 hover:text-white'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActions === u.id && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2 animate-in slide-in-from-top-2 duration-200">
                              {!u.is_active ? (
                                <button
                                  onClick={() => handleActivateUser(u.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                >
                                  <UserCheck className="w-4 h-4" /> Activate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeactivateUser(u.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <UserX className="w-4 h-4" /> Suspend
                                </button>
                              )}
                              {u.role === 'driver' && !u.is_driver_approved && u.is_active && (
                                <button
                                  onClick={() => handleApproveDriver(u.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                >
                                  <UserCheck className="w-4 h-4" /> Approve Driver
                                </button>
                              )}
                              <button
                                onClick={() => handleChangeRole(u.id, u.role)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                              >
                                <Shield className="w-4 h-4" /> Change Role
                              </button>
                              <div className="h-px bg-gray-50 my-2"></div>
                              <button
                                onClick={() => handleViewDetails(u.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              >
                                <ExternalLink className="w-4 h-4" /> View Details
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" /> Remove User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-20 flex flex-col items-center text-center">
              <div className="bg-gray-50 p-6 rounded-[2rem] mb-4">
                <Search className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900">No matches found</h3>
              <p className="text-sm text-gray-400 mt-2 font-medium max-w-xs">We couldn't find any users matching your current filters or search query.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-6 text-emerald-600 font-black text-xs uppercase tracking-widest hover:tracking-[0.2em] transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
