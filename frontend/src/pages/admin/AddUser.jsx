import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Shield, Save, X, UserPlus } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const AddUser = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        role: 'customer',
        is_active: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminAPI.createUser(formData);
            toast.success('User created successfully');
            navigate('/admin/users');
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data ? Object.values(error.response.data)[0][0] : 'Failed to create user';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin/users"
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create New User</h1>
                        <p className="text-gray-500 font-medium">Add a new account to the system</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-50 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                    {/* Identity Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Identity Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
                                <div className="relative group">
                                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        placeholder="johndoe"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300 transition-all"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Role</label>
                                <div className="relative group">
                                    <Shield className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <select
                                        name="role"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="customer">Customer (User)</option>
                                        <option value="driver">Driver (Partner)</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="John"
                                    className="w-full px-6 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300 transition-all"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Doe"
                                    className="w-full px-6 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300 transition-all"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact & Security */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Contact & Security</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="john@example.com"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300 transition-all"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        placeholder="0712345678"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300 transition-all"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300 transition-all"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 h-full pt-6">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        className="sr-only peer"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-black text-gray-900 uppercase tracking-tighter">Active Account</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Form Actions */}
                    <div className="pt-10 flex flex-col md:flex-row gap-4 items-center justify-end border-t border-gray-50">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/users')}
                            className="w-full md:w-auto px-8 py-4 bg-white text-gray-400 font-black uppercase tracking-widest text-xs hover:text-gray-900 transition-all"
                        >
                            Discard Changes
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            <span>Create User Record</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUser;
