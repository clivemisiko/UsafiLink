import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Edit,
  Save,
  X,
  ChevronRight,
  IdCard,
  Truck,
  Lock
} from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TwoFactorModal from '../components/TwoFactorModal';

const Profile = ({ user: initialUser = null, isEmbedded = false }) => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: initialUser?.first_name || '',
    last_name: initialUser?.last_name || '',
    email: initialUser?.email || '',
    phone_number: initialUser?.phone_number || '',
    address: initialUser?.address || '',
    driver_license_number: initialUser?.driver_license_number || '',
    driver_license_expiry_date: initialUser?.driver_license_expiry_date || ''
  });

  useEffect(() => {
    if (!initialUser) {
      fetchUserProfile();
    }
  }, [initialUser]);

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        address: userData.address || '',
        driver_license_number: userData.driver_license_number || '',
        driver_license_expiry_date: userData.driver_license_expiry_date || ''
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await authAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchUserProfile(); // Refresh data
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      driver_license_number: user?.driver_license_number || '',
      driver_license_expiry_date: user?.driver_license_expiry_date || ''
    });
    setEditing(false);
  };

  const [activeTab, setActiveTab] = useState('personal');
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (window.confirm('CRITICAL: Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await authAPI.deleteAccount();
        toast.success('Account deleted successfully');
        localStorage.clear();
        navigate('/login');
      } catch (error) {
        toast.error('Failed to delete account. Please contact support.');
      }
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleTwoFactorAuth = () => {
    setShowTwoFactorModal(true);
  };

  if (loading) {
    return (
      <div className={`${isEmbedded ? 'h-64' : 'min-h-screen'} flex items-center justify-center bg-slate-50`}>
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    ...(user?.role === 'driver' ? [{ id: 'license', label: 'License Info', icon: IdCard }] : []),
    ...(user?.role === 'driver' ? [{ id: 'vehicle', label: 'Vehicle Info', icon: Truck }] : []),
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className={`${isEmbedded ? '' : 'min-h-screen bg-parchment text-ink'} w-full`}>
      {!isEmbedded && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900">Account Settings</h1>
                  <p className="text-xs text-slate-500">Manage your profile and security</p>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {activeTab === 'personal' && (
                  !editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6 flex gap-6 border-b border-slate-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-semibold text-sm transition-all ${activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>
      )}

      {isEmbedded && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4 border-b border-slate-200 w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'personal' && (
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${editing ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}
            >
              {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit className="w-4 h-4" /> Edit</>}
            </button>
          )}
        </div>
      )}

      <main className="w-full py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {activeTab === 'personal' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-medium">{user.first_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-medium">{user.last_name || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                    <p className="text-slate-900 bg-slate-50 pl-11 pr-4 py-3 rounded-xl border border-slate-100 font-medium">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                    {editing ? (
                      <input
                        type="tel"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 pl-11 pr-4 py-3 rounded-xl border border-slate-100 font-medium">{user.phone_number}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                  {editing ? (
                    <textarea
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 pl-11 pr-4 py-3 rounded-xl border border-slate-100 font-medium">{user.address || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'license' && user?.role === 'driver' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <IdCard className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">License Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">License Number</label>
                  {editing ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium uppercase"
                      value={formData.driver_license_number}
                      onChange={(e) => setFormData({ ...formData, driver_license_number: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-medium uppercase">{user.driver_license_number || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">License Expiry Date</label>
                  {editing ? (
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                      value={formData.driver_license_expiry_date}
                      onChange={(e) => setFormData({ ...formData, driver_license_expiry_date: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-900 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-medium">
                      {user.driver_license_expiry_date ? new Date(user.driver_license_expiry_date).toLocaleDateString() : 'Not set'}
                    </p>
                  )}
                </div>
              </div>
              {user.driver_license_expiry_date && new Date(user.driver_license_expiry_date) < new Date() && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-red-700 font-semibold text-sm">Your license has expired. Please renew it to continue using the platform.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicle' && user?.role === 'driver' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Vehicle Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Truck Model</p>
                  <p className="text-lg font-black text-slate-900">Isuzu FRR 650</p>
                  <p className="text-sm text-slate-500">Exhauster Truck</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registration</p>
                  <p className="text-lg font-black text-slate-900 font-mono">KDL 456X</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tank Capacity</p>
                  <p className="text-lg font-black text-slate-900">10,000 L</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Inspection</p>
                  <p className="text-lg font-black text-slate-900">Oct 12, 2025</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Security & Privacy</h2>
              </div>
              <div className="space-y-3">
                <button onClick={handleChangePassword} className="flex items-center justify-between w-full p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Change Password</p>
                      <p className="text-xs text-slate-500">Update your account password</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>
                <button onClick={handleTwoFactorAuth} className="flex items-center justify-between w-full p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
                </button>
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        isEnabled={user?.is_two_factor_enabled}
        onStatusChange={(status) => setUser({ ...user, is_two_factor_enabled: status })}
      />
    </div>
  );
};

export default Profile;