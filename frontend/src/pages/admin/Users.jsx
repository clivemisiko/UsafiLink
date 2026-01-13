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
  Smartphone
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActions, setShowActions] = useState(null);
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
      toast.error('Failed to fetch users');
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
    // Navigate to user details page or show modal
    toast.info(`Viewing details for user ID: ${userId}`);
    setShowActions(null);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700 border-purple-100 ring-4 ring-purple-50/50';
      case 'driver': return 'bg-blue-50 text-blue-700 border-blue-100 ring-4 ring-blue-50/50';
      case 'customer': return 'bg-green-50 text-green-700 border-green-100 ring-4 ring-green-50/50';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    drivers: users.filter(u => u.role === 'driver').length,
    customers: users.filter(u => u.role === 'customer').length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {roleFilter === 'driver' ? 'Driver Management' : roleFilter === 'customer' ? 'Customer Management' : 'User Directory'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage, verify and monitor all accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/users/new"
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-200 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add New User</span>
          </Link>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Accounts', value: stats.total, color: 'blue', icon: UsersIcon },
          { label: 'Active Now', value: stats.active, color: 'green', icon: UserCheck },
          { label: 'Verified Drivers', value: stats.drivers, color: 'indigo', icon: Shield },
          { label: 'Total Customers', value: stats.customers, color: 'emerald', icon: Smartphone }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4">
              <div className={`bg-${stat.color}-50 p-3 rounded-2xl text-${stat.color}-600`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
          {['all', 'customer', 'driver', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
        <select
          className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/10"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Any Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredUsers.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-8 py-5">Identity</th>
                  <th className="px-8 py-5">Contact Details</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-500 font-black relative overflow-hidden ring-4 ring-transparent group-hover:ring-blue-50 transition-all">
                          {u.username?.charAt(0).toUpperCase()}
                          {u.role === 'driver' && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${u.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                            {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {u.email}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
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
                        <div className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${u.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/users/edit/${u.id}`} className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all">
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
                              <button
                                onClick={() => handleChangeRole(u.id, u.role)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                              >
                                <Shield className="w-4 h-4" /> Change Role
                              </button>
                              <div className="h-px bg-gray-50 my-2"></div>
                              <button
                                onClick={() => handleViewDetails(u.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <ExternalLink className="w-4 h-4" /> View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
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
                className="mt-6 text-blue-600 font-black text-xs uppercase tracking-widest hover:tracking-[0.2em] transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;