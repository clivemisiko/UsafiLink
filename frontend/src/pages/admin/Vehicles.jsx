import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, User, UserPlus, X, Save, AlertCircle, AlertTriangle, Calendar, Wrench, TrendingUp, Flag } from 'lucide-react';
import { vehiclesAPI } from '../../api/vehicles';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [driverMetrics, setDriverMetrics] = useState({});
    const [showComplaintsModal, setShowComplaintsModal] = useState(false);
    const [selectedVehicleComplaints, setSelectedVehicleComplaints] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferFromVehicle, setTransferFromVehicle] = useState(null);

    const [formData, setFormData] = useState({
        plate_number: '',
        vehicle_type: 'exhauster',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 0,
        driver_id: '',
        insurance_expiry_date: '',
        registration_expiry_date: '',
        service_status: 'operational',
        last_service_date: '',
        next_service_date: '',
        service_notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [vehiclesData, usersData, metricsData] = await Promise.all([
                vehiclesAPI.getAll(),
                adminAPI.getUsers({ role: 'driver' }),
                vehiclesAPI.getDriverMetrics().catch(() => ({}))
            ]);
            setVehicles(vehiclesData);
            setDrivers(usersData.results || usersData);
            setDriverMetrics(metricsData);
        } catch (error) {
            toast.error("Failed to load data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (vehicle = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData({
                plate_number: vehicle.plate_number,
                vehicle_type: vehicle.vehicle_type,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                capacity: vehicle.capacity,
                driver_id: vehicle.driver || '',
                insurance_expiry_date: vehicle.insurance_expiry_date || '',
                registration_expiry_date: vehicle.registration_expiry_date || '',
                service_status: vehicle.service_status || 'operational',
                last_service_date: vehicle.last_service_date || '',
                next_service_date: vehicle.next_service_date || '',
                service_notes: vehicle.service_notes || ''
            });
        } else {
            setEditingVehicle(null);
            setFormData({
                plate_number: '',
                vehicle_type: 'exhauster',
                make: '',
                model: '',
                year: new Date().getFullYear(),
                capacity: 0,
                driver_id: '',
                insurance_expiry_date: '',
                registration_expiry_date: '',
                service_status: 'operational',
                last_service_date: '',
                next_service_date: '',
                service_notes: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving vehicle...');

        try {
            const payload = { ...formData };
            if (!payload.driver_id) payload.driver_id = null;

            if (editingVehicle) {
                await vehiclesAPI.update(editingVehicle.id, payload);
                toast.success("Vehicle updated", { id: toastId });
            } else {
                await vehiclesAPI.create(payload);
                toast.success("Vehicle created", { id: toastId });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.plate_number?.[0] || "Failed to save vehicle";
            toast.error(msg, { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await vehiclesAPI.delete(id);
                toast.success("Vehicle deleted");
                setVehicles(vehicles.filter(v => v.id !== id));
            } catch (error) {
                toast.error("Failed to delete vehicle");
            }
        }
    };

    const handleTransferDriver = async (newVehicleId) => {
        if (!transferFromVehicle || !newVehicleId) {
            toast.error("Please select both vehicles");
            return;
        }

        try {
            await vehiclesAPI.transferDriver(transferFromVehicle.id, { new_vehicle_id: newVehicleId });
            toast.success("Driver transferred successfully!");
            setShowTransferModal(false);
            setTransferFromVehicle(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to transfer driver");
        }
    };

    const handleViewComplaints = async (vehicle) => {
        try {
            // Assuming complaints are included in the vehicle object or need to be fetched
            setSelectedVehicleComplaints(vehicle.complaints || []);
            setShowComplaintsModal(true);
        } catch (error) {
            toast.error("Failed to load complaints");
        }
    };

    const isInsuranceExpiringSoon = (date) => {
        if (!date) return false;
        const today = new Date();
        const expiry = new Date(date);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    };

    const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const filteredVehicles = vehicles.filter(v =>
        v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.driver_details?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Fleet Management</h1>
                        <p className="text-xs text-slate-500">Manage vehicles and assignments</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                    <Plus className="w-4 h-4" />
                    Add Vehicle
                </button>
            </div>

            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-400">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    placeholder="Search vehicles by plate, make, or driver..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map(vehicle => {
                        const metrics = driverMetrics[vehicle.driver] || {};
                        const driverLicenseExpiring = vehicle.driver_details?.is_license_expiring_soon;
                        const insuranceExpiring = vehicle.insurance_expiring_soon;
                        const registrationExpiring = vehicle.registration_expiring_soon;

                        return (
                            <div key={vehicle.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all group hover:shadow-lg ${
                                isExpired(vehicle.insurance_expiry_date) || isExpired(vehicle.registration_expiry_date) || vehicle.service_status !== 'operational' 
                                ? 'border-red-200' 
                                : insuranceExpiring || registrationExpiring || driverLicenseExpiring
                                ? 'border-yellow-200'
                                : 'border-gray-100'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl transition-colors ${
                                        vehicle.service_status === 'operational' 
                                        ? 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white' 
                                        : 'bg-red-50 group-hover:bg-red-600 group-hover:text-white'
                                    }`}>
                                        <Truck className={`w-6 h-6 ${vehicle.service_status === 'operational' ? 'text-emerald-600' : 'text-red-600'} group-hover:text-white`} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(vehicle)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(vehicle.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 mb-1">{vehicle.plate_number}</h3>
                                <p className="text-gray-500 font-medium mb-4">{vehicle.make} {vehicle.model} ({vehicle.year})</p>

                                {/* Status Badges */}
                                {(isExpired(vehicle.insurance_expiry_date) || isExpired(vehicle.registration_expiry_date) || vehicle.service_status !== 'operational') && (
                                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                        <p className="text-xs font-bold text-red-700">
                                            {isExpired(vehicle.insurance_expiry_date) && 'Insurance Expired'} 
                                            {isExpired(vehicle.registration_expiry_date) && 'Registration Expired'} 
                                            {vehicle.service_status !== 'operational' && 'Vehicle Unavailable'}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-bold text-gray-900 capitalize">{vehicle.vehicle_type}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                        <span className="text-gray-500">Capacity</span>
                                        <span className="font-bold text-gray-900">{vehicle.capacity} L</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`font-bold text-xs px-2 py-1 rounded-full ${vehicle.service_status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {vehicle.service_status}
                                        </span>
                                    </div>
                                </div>

                                {/* Driver Section */}
                                <div className={`flex items-center gap-3 p-3 rounded-xl border mb-3 ${vehicle.driver_details ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                    {vehicle.driver_details ? (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 font-bold border border-green-100">
                                                {vehicle.driver_details.username.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Driver</p>
                                                <p className="text-sm font-bold text-gray-900">{vehicle.driver_details.get_full_name || vehicle.driver_details.username}</p>
                                                {driverLicenseExpiring && (
                                                    <p className="text-xs text-orange-600 font-bold">⚠️ License Expiring Soon</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-yellow-600 font-bold border border-yellow-100">
                                                <UserPlus className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider">No Driver</p>
                                                <p className="text-sm font-bold text-gray-900">Unassigned</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Expiry Information */}
                                <div className="space-y-2 mb-3 text-xs">
                                    {vehicle.insurance_expiry_date && (
                                        <div className={`flex justify-between p-2 rounded ${insuranceExpiring ? 'bg-yellow-50 text-yellow-700' : isExpired(vehicle.insurance_expiry_date) ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                                            <span className="font-bold">Insurance:</span>
                                            <span className="font-bold">{new Date(vehicle.insurance_expiry_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {vehicle.registration_expiry_date && (
                                        <div className={`flex justify-between p-2 rounded ${registrationExpiring ? 'bg-yellow-50 text-yellow-700' : isExpired(vehicle.registration_expiry_date) ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                                            <span className="font-bold">Registration:</span>
                                            <span className="font-bold">{new Date(vehicle.registration_expiry_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Driver Metrics */}
                                {metrics && (
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                            <p className="text-gray-600 font-bold">Fuel Used</p>
                                            <p className="font-bold text-blue-700">{parseFloat(metrics.total_fuel_consumed_liters || 0).toFixed(1)}L</p>
                                        </div>
                                        <div className="bg-green-50 p-2 rounded border border-green-200">
                                            <p className="text-gray-600 font-bold">Revenue</p>
                                            <p className="font-bold text-green-700">KES {parseFloat(metrics.total_revenue || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => handleViewComplaints(vehicle)}
                                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition flex items-center justify-center gap-2"
                                >
                                    <Flag className="w-4 h-4" />
                                    View Complaints
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-lg transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                            <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Basic Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Plate Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase tracking-widest font-mono font-bold placeholder-gray-300"
                                        placeholder="KAA 123A"
                                        value={formData.plate_number}
                                        onChange={e => setFormData({ ...formData, plate_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Type</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.vehicle_type}
                                        onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                                    >
                                        <option value="exhauster">Exhauster Truck</option>
                                        <option value="sewage">Sewage Truck</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Make</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Toyota"
                                        value={formData.make}
                                        onChange={e => setFormData({ ...formData, make: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Model</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Canter"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Capacity (Liters)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="10000"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mt-6">Insurance & Registration</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Insurance Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.insurance_expiry_date}
                                        onChange={e => setFormData({ ...formData, insurance_expiry_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Insurance Registration Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.registration_expiry_date}
                                        onChange={e => setFormData({ ...formData, registration_expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mt-6">Service & Maintenance</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Service Status</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.service_status}
                                        onChange={e => setFormData({ ...formData, service_status: e.target.value })}
                                    >
                                        <option value="operational">Operational</option>
                                        <option value="repair">Under Repair</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="service">In Service</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Last Service Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.last_service_date}
                                        onChange={e => setFormData({ ...formData, last_service_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Next Service Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.next_service_date}
                                        onChange={e => setFormData({ ...formData, next_service_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Service Notes</label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g., New engine oil, tire rotation needed, etc."
                                    rows="3"
                                    value={formData.service_notes}
                                    onChange={e => setFormData({ ...formData, service_notes: e.target.value })}
                                />
                            </div>

                            <h4 className="font-bold text-gray-700 uppercase text-sm tracking-widest mt-6">Driver Assignment</h4>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Assign Driver</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
                                        value={formData.driver_id}
                                        onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
                                    >
                                        <option value="">-- No Driver Assigned --</option>
                                        {drivers.map(driver => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.username} ({driver.email}) {driver.is_online ? '🟢' : '⚪'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">A driver can only be assigned to one vehicle at a time.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                                >
                                    <Save className="w-4 h-4 inline mr-2" />
                                    Save Vehicle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Driver Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                            <h3 className="font-bold text-lg text-blue-900">Transfer Driver Between Vehicles</h3>
                            <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-blue-100 rounded-lg transition">
                                <X className="w-5 h-5 text-blue-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">From Vehicle (Current Assignment)</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={transferFromVehicle?.id || ''}
                                    onChange={e => {
                                        const vehicle = vehicles.find(v => v.id === parseInt(e.target.value));
                                        setTransferFromVehicle(vehicle);
                                    }}
                                >
                                    <option value="">-- Select Vehicle --</option>
                                    {vehicles.filter(v => v.driver).map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.plate_number} ({vehicle.driver_details?.username})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">To Vehicle (New Assignment)</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    defaultValue=""
                                    onChange={e => handleTransferDriver(parseInt(e.target.value))}
                                >
                                    <option value="">-- Select Vehicle --</option>
                                    {vehicles.filter(v => v.id !== transferFromVehicle?.id).map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.plate_number} {vehicle.driver_details ? `(Currently: ${vehicle.driver_details.username})` : '(Unassigned)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700 font-bold">
                                    {transferFromVehicle ? `Driver will be transferred from ${transferFromVehicle.plate_number} to the selected vehicle` : 'Please select both vehicles'}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complaints Modal */}
            {showComplaintsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
                            <h3 className="font-bold text-lg text-red-900">Vehicle Complaints</h3>
                            <button onClick={() => setShowComplaintsModal(false)} className="p-2 hover:bg-red-100 rounded-lg transition">
                                <X className="w-5 h-5 text-red-600" />
                            </button>
                        </div>

                        <div className="p-6">
                            {selectedVehicleComplaints.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">No complaints reported for this vehicle.</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {selectedVehicleComplaints.map(complaint => (
                                        <div key={complaint.id} className="border border-gray-200 rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900">{complaint.title}</h4>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : complaint.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                    {complaint.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                                            <p className="text-xs text-gray-500">Reported by: {complaint.driver_details?.username}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vehicles;
