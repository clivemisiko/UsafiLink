import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  Edit,
  MoreVertical,
  RefreshCw,
  Shield,
  Star,
  TrendingUp,
  DollarSign,
  Car,
  MapPin,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Map,
  Truck
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { vehiclesAPI } from '../../api/vehicles';
import { trackingAPI } from '../../api/tracking';
import DriverLocationsMap from '../../components/DriverLocationsMap';
import toast from 'react-hot-toast';


const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [driverLocations, setDriverLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [driverMetrics, setDriverMetrics] = useState({});
  const [showLicenseWarningModal, setShowLicenseWarningModal] = useState(false);
  const [expiredLicenseDrivers, setExpiredLicenseDrivers] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (viewMode === 'map') {
      fetchDriverLocations();
    }
  }, [viewMode]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers({ role: 'driver' });
      const driversData = data.results || data;
      setDrivers(driversData);
      // Check for expired licenses
      const expiredDrivers = driversData.filter(driver => {
        if (driver.driver_license_expiry_date) {
          return new Date(driver.driver_license_expiry_date) < new Date();
        }
        return false;
      });
      
      if (expiredDrivers.length > 0) {
        setExpiredLicenseDrivers(expiredDrivers);
        setShowLicenseWarningModal(true);
      }
      
      // Drivers(driversData);
      
      // Fetch driver metrics once and map them by driver id
      const metricsResponse = await vehiclesAPI.getDriverMetrics();
      const metricsArray = Array.isArray(metricsResponse)
        ? metricsResponse
        : metricsResponse.results || [];
      const metricsMap = metricsArray.reduce((acc, metric) => {
        if (metric && metric.driver_id) {
          acc[metric.driver_id] = metric;
        }
        return acc;
      }, {});
      setDriverMetrics(metricsMap);
    } catch (error) {
      toast.error('Failed to fetch drivers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverLocations = async () => {
    setMapLoading(true);
    try {
      const locations = await trackingAPI.getAllDriverLocations();
      setDriverLocations(Array.isArray(locations) ? locations : locations.locations || []);
    } catch (error) {
      console.error('Failed to fetch driver locations:', error);
      toast.error('Failed to load driver locations on map');
      setDriverLocations([]);
    } finally {
      setMapLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone_number?.includes(searchTerm) ||
    driver.first_name?.toLowerCase().includes(searchTerm) ||
    driver.last_name?.toLowerCase().includes(searchTerm)
  );

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.is_active && d.is_driver_approved).length,
    online: drivers.filter(d => d.is_online).length,
    totalRevenue: Object.values(driverMetrics).reduce((sum, m) => sum + (parseFloat(m.total_revenue) || 0), 0)
  };

  const handleApproveDriver = async (driverId) => {
    try {
      await adminAPI.approveDriver(driverId);
      toast.success('Driver approved');
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve driver');
    }
  };

  const getDriverApprovalStatus = (driver) => {
    if (!driver.is_active) return { label: 'Disabled', className: 'bg-red-100 text-red-700', icon: XCircle };
    if (!driver.is_driver_approved) return { label: 'Pending Approval', className: 'bg-amber-100 text-amber-700', icon: AlertCircle };
    return { label: 'Approved', className: 'bg-blue-50 text-blue-700', icon: CheckCircle };
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Driver Management</h1>
            <p className="text-xs text-slate-500">View and manage all fleet drivers</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchDrivers();
            if (viewMode === 'map') fetchDriverLocations();
          }}
          className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading || mapLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
              <p className="text-xl font-black text-slate-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online</p>
              <p className="text-xl font-black text-slate-900">{stats.online}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-black text-slate-900">KES {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search drivers by name, email, or phone..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-medium placeholder:text-slate-400"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            viewMode === 'list'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            viewMode === 'map'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Map className="w-4 h-4" />
          Live Map
        </button>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-screen md:h-[600px]">
            <DriverLocationsMap locations={driverLocations} />
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map(driver => {
                const metrics = driverMetrics[driver.id] || {};
                const rating = driver.average_rating || 0;
                const approvalStatus = getDriverApprovalStatus(driver);
                const ApprovalIcon = approvalStatus.icon;
                
                return (
                  <div key={driver.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl">
                        {driver.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${driver.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {driver.first_name && driver.last_name 
                          ? `${driver.first_name} ${driver.last_name}` 
                          : driver.username}
                      </h3>
                      <p className="text-sm text-gray-500">@{driver.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${driver.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      <Clock className="w-3 h-3" />
                      {driver.is_online ? 'Online' : 'Offline'}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${approvalStatus.className}`}>
                      <ApprovalIcon className="w-3 h-3" />
                      {approvalStatus.label}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {getRatingStars(rating)}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({driver.total_ratings || 0} ratings)</span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{driver.phone_number || 'No phone'}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase">Revenue</p>
                    <p className="text-sm font-bold text-blue-700">KES {(parseFloat(metrics.total_revenue) || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase">Jobs</p>
                    <p className="text-sm font-bold text-green-700">{metrics.total_jobs || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase">Fuel Used</p>
                    <p className="text-sm font-bold text-yellow-700">{(parseFloat(metrics.total_fuel_consumed_liters) || 0).toFixed(1)}L</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase">Distance</p>
                    <p className="text-sm font-bold text-purple-700">{(parseFloat(metrics.total_distance_km) || 0).toFixed(1)}km</p>
                  </div>
                </div>

                {/* Vehicle Assignment */}
                {driver.current_vehicle && (
                  <div className="bg-gray-50 p-3 rounded-xl mb-4">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Current Vehicle</p>
                        <p className="text-sm font-bold text-gray-900">{driver.current_vehicle.plate_number}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* License Warning */}
                {driver.is_license_expiring_soon && (
                  <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <p className="text-xs font-bold text-orange-700">License Expiring Soon</p>
                  </div>
                )}

                {driver.is_active && !driver.is_driver_approved && (
                  <button
                    onClick={() => handleApproveDriver(driver.id)}
                    className="w-full py-3 mb-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Driver
                  </button>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => handleViewDetails(driver)}
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <MoreVertical className="w-4 h-4" />
                  View Full Details
                </button>
              </div>
            );
          })}
            </div>
          )}
        </>
      )}

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-2xl">
                  {selectedDriver.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">
                    {selectedDriver.first_name && selectedDriver.last_name 
                      ? `${selectedDriver.first_name} ${selectedDriver.last_name}` 
                      : selectedDriver.username}
                  </h3>
                  <p className="text-sm text-gray-500">@{selectedDriver.username}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="p-2 hover:bg-emerald-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-emerald-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status & Rating */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${selectedDriver.is_active ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {selectedDriver.is_active ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    <span className={`font-bold ${selectedDriver.is_active ? 'text-green-700' : 'text-red-700'}`}>
                      {selectedDriver.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${selectedDriver.is_online ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Online Status</p>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${selectedDriver.is_online ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-bold ${selectedDriver.is_online ? 'text-green-700' : 'text-gray-500'}`}>
                      {selectedDriver.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-yellow-50">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-1">Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-yellow-700">{(selectedDriver.average_rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Full Name</p>
                    <p className="font-bold text-gray-900">
                      {selectedDriver.first_name && selectedDriver.last_name 
                        ? `${selectedDriver.first_name} ${selectedDriver.last_name}` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Username</p>
                    <p className="font-bold text-gray-900">{selectedDriver.username}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Email</p>
                    <p className="font-bold text-gray-900">{selectedDriver.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Phone</p>
                    <p className="font-bold text-gray-900">{selectedDriver.phone_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div>
                <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mb-3">Driver Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">License Number</p>
                    <p className="font-bold text-blue-900">{selectedDriver.driver_license_number || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">License Expiry</p>
                    <p className="font-bold text-blue-900">
                      {selectedDriver.driver_license_expiry_date 
                        ? new Date(selectedDriver.driver_license_expiry_date).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Joined Fleet</p>
                    <p className="font-bold text-green-900">
                      {selectedDriver.date_joined 
                        ? new Date(selectedDriver.date_joined).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">License Status</p>
                    <div className="flex items-center gap-2">
                      {selectedDriver.is_license_expiring_soon ? (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <span className={`font-bold ${selectedDriver.is_license_expiring_soon ? 'text-orange-700' : 'text-green-700'}`}>
                        {selectedDriver.is_license_expiring_soon ? 'Expiring Soon' : 'Valid'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Revenue</p>
                    <p className="font-bold text-purple-900">KES {(parseFloat(driverMetrics[selectedDriver.id]?.total_revenue) || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Jobs</p>
                    <p className="font-bold text-blue-900">{driverMetrics[selectedDriver.id]?.total_jobs || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl text-center">
                    <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Ratings</p>
                    <p className="font-bold text-yellow-900">{selectedDriver.total_ratings || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <Star className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Avg Rating</p>
                    <p className="font-bold text-green-900">{(selectedDriver.average_rating || 0).toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Assignment */}
              {selectedDriver.current_vehicle && (
                <div>
                  <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mb-3">Current Vehicle</h4>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-emerald-100 p-3 rounded-xl">
                        <Car className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedDriver.current_vehicle.plate_number}</p>
                        <p className="text-sm text-gray-500">{selectedDriver.current_vehicle.make} {selectedDriver.current_vehicle.model} ({selectedDriver.current_vehicle.year})</p>
                        <p className="text-sm text-gray-500">Capacity: {selectedDriver.current_vehicle.capacity} L</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-bold uppercase text-xs">Insurance Expiry</p>
                        <p className="font-bold text-gray-900">
                          {selectedDriver.current_vehicle.insurance_expiry_date 
                            ? new Date(selectedDriver.current_vehicle.insurance_expiry_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold uppercase text-xs">NTSA Inspection Expiry</p>
                        <p className="font-bold text-gray-900">
                          {selectedDriver.current_vehicle.registration_expiry_date 
                            ? new Date(selectedDriver.current_vehicle.registration_expiry_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold uppercase text-xs">Service Status</p>
                        <p className={`font-bold ${selectedDriver.current_vehicle.service_status === 'operational' ? 'text-green-700' : 'text-red-700'}`}>
                          {selectedDriver.current_vehicle.service_status}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold uppercase text-xs">Last Service</p>
                        <p className="font-bold text-gray-900">
                          {selectedDriver.current_vehicle.last_service_date 
                            ? new Date(selectedDriver.current_vehicle.last_service_date).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div>
                <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mb-3">Account Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Account Created</p>
                    <p className="font-bold text-gray-900">
                      {selectedDriver.date_joined 
                        ? new Date(selectedDriver.date_joined).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Role</p>
                    <p className="font-bold text-gray-900 capitalize">{selectedDriver.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Warning Modal */}
      {showLicenseWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="font-bold text-lg text-red-900">Expired Licenses Warning</h3>
              </div>
              <button 
                onClick={() => setShowLicenseWarningModal(false)} 
                className="p-2 hover:bg-red-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-red-600" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                The following drivers have expired licenses and cannot access the platform:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                {expiredLicenseDrivers.map(driver => (
                  <div key={driver.id} className="bg-red-50 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {driver.first_name && driver.last_name 
                          ? `${driver.first_name} ${driver.last_name}` 
                          : driver.username}
                      </p>
                      <p className="text-sm text-red-700">
                        Expired: {driver.driver_license_expiry_date ? new Date(driver.driver_license_expiry_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDetailsModal(true);
                        setShowLicenseWarningModal(false);
                      }}
                      className="text-red-600 hover:text-red-800 font-bold text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowLicenseWarningModal(false)}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
