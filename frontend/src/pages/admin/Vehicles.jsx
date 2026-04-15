import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, User, UserPlus, X, Save, AlertCircle } from 'lucide-react';
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

    const [formData, setFormData] = useState({
        plate_number: '',
        vehicle_type: 'exhauster',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 0,
        driver_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [vehiclesData, usersData] = await Promise.all([
                vehiclesAPI.getAll(),
                adminAPI.getUsers({ role: 'driver' })
            ]);
            setVehicles(vehiclesData);
            setDrivers(usersData.results || usersData); // Handle paginated or list response
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
                driver_id: vehicle.driver || ''
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
                driver_id: ''
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
                // Also handle driver assignment explicitly if it changed? 
                // The serializer handles updating the driver field if included in payload.
                // Wait, my serializer uses `driver_id` as write_only, so passing it should work.
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

    const filteredVehicles = vehicles.filter(v =>
        v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.driver_details?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
                    <p className="text-gray-500">Manage vehicles and driver assignments</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
                >
                    <Plus className="w-5 h-5" />
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
                    {filteredVehicles.map(vehicle => (
                        <div key={vehicle.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Truck className="w-6 h-6 text-emerald-600 group-hover:text-white" />
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

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-bold text-gray-900 capitalize">{vehicle.vehicle_type}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                    <span className="text-gray-500">Capacity</span>
                                    <span className="font-bold text-gray-900">{vehicle.capacity} L</span>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-xl border ${vehicle.driver_details ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                    {vehicle.driver_details ? (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 font-bold border border-green-100">
                                                {vehicle.driver_details.username.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Assigned Driver</p>
                                                <p className="text-sm font-bold text-gray-900">{vehicle.driver_details.username}</p>
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
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-lg transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                <p className="text-xs text-gray-500 mt-1">Drivers already assigned to another vehicle may cause a validation error.</p>
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
        </div>
    );
};

export default Vehicles;
