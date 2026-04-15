import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, Shield, Activity, MapPin, Truck, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const UserDetailsModal = ({ userId, onClose }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await adminAPI.getUser(userId);
                setUser(data);
            } catch (error) {
                toast.error('Failed to load user details');
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId, onClose]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-[2rem] shadow-2xl">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-black text-gray-900 mt-4 uppercase tracking-widest text-center">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Header/Banner */}
                <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-8 pb-8 -mt-16 text-center">
                    <div className="inline-block relative">
                        <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl">
                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-4xl font-black text-slate-400 border-4 border-white overflow-hidden">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className={`absolute bottom-2 right-2 w-6 h-6 border-4 border-white rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-sm font-bold text-gray-400 tracking-tight">@{user.username}</span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                    user.role === 'driver' ? 'bg-emerald-50 text-emerald-600' :
                                        'bg-green-50 text-green-600'
                                }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="px-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100/50">
                            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                                <p className="text-sm font-bold text-gray-900">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100/50">
                            <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                                <p className="text-sm font-bold text-gray-900">{user.phone_number || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100/50">
                            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined On</p>
                                <p className="text-sm font-bold text-gray-900">{formatDate(user.date_joined)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100/50">
                            <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</p>
                                <p className="text-sm font-bold text-gray-900">{formatDate(user.last_login)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-[1.5rem] shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 p-3 rounded-2xl">
                                    <Truck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Engagements</p>
                                    <p className="text-xl font-black">{user.bookings_count || 0} Bookings</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {user.is_active ? 'Active' : 'Suspended'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:text-gray-900 transition-all border border-gray-100"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
