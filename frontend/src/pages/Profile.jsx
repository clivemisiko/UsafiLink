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
  ChevronRight
} from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TwoFactorModal from '../components/TwoFactorModal';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        address: userData.address || ''
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
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      address: user.address || ''
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    ...(user?.role === 'driver' ? [{ id: 'vehicle', label: 'Vehicle Info', icon: Truck }] : []),
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your {user?.role} profile and account security
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              {activeTab === 'personal' && (
                !editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === 'personal' && (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 active:ring-blue-500 outline-none"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">{user.first_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 active:ring-blue-500 outline-none"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">{user.last_name || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <p className="text-gray-900 bg-gray-50 pl-10 pr-4 py-3 rounded-lg border border-gray-100">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    {editing ? (
                      <input
                        type="tel"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 active:ring-blue-500 outline-none"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 pl-10 pr-4 py-3 rounded-lg border border-gray-100">{user.phone_number}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  {editing ? (
                    <textarea
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 active:ring-blue-500 outline-none"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 pl-10 pr-4 py-3 rounded-lg border border-gray-100">{user.address || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && user?.role === 'driver' && (
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Truck Model</p>
                  <p className="text-lg font-bold">Isuzu FRR 650 - Exhauster</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Registration Number</p>
                  <p className="text-lg font-bold">KDL 456X</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Tank Capacity</p>
                  <p className="text-lg font-bold">10,000 Liters</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Last Inspection</p>
                  <p className="text-lg font-bold">Oct 12, 2025</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-8 space-y-8">
              <h3 className="text-xl font-bold text-gray-900">Security & Privacy</h3>
              <div className="space-y-4">
                <button onClick={handleChangePassword} className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-4" />
                    <div className="text-left">
                      <p className="font-semibold">Change Password</p>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button onClick={handleTwoFactorAuth} className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-purple-600 mr-4" />
                    <div className="text-left">
                      <p className="font-semibold">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <div className="pt-4 mt-8 border-t border-gray-100">
                  <button
                    onClick={handleDeleteAccount}
                    className="text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition"
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