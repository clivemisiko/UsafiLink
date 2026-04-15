import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Shield, Save, X, UserPlus } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const AddUser = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditing);
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

    useEffect(() => {
        if (isEditing) {
            loadUser();
        }
    }, [id]);

    const loadUser = async () => {
        try {
            const user = await adminAPI.getUser(id);
            setFormData({
                username: user.username,
                email: user.email,
                password: '', // Don't load password
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone_number: user.phone_number || '',
                role: user.role,
                is_active: user.is_active
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to load user');
            navigate('/admin/users');
        } finally {
            setPageLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

<<<<<<< HEAD
        if (formData.password.length < 8) {
=======
        // When editing, password is optional and empty string means don't update it
        if (!isEditing && formData.password.length < 8) {
            toast.error('Password is too short! It must contain at least 8 characters.');
            return;
        }

        if (isEditing && formData.password && formData.password.length < 8) {
>>>>>>> 89df15ec222ddb2aab9a75b82ba75e9a6e95bbac
            toast.error('Password is too short! It must contain at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                // Remove empty password when editing
                const updateData = { ...formData };
                if (!updateData.password) {
                    delete updateData.password;
                }
                await adminAPI.updateUser(id, updateData);
                toast.success('User updated successfully');
            } else {
                await adminAPI.createUser(formData);
                toast.success('User created successfully');
            }
            navigate('/admin/users');
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data ? Object.values(error.response.data)[0][0] : 'Failed to save user';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin/users"
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEditing ? 'Edit User' : 'Create New User'}
                        </h1>
                        <p className="text-gray-500 font-medium">
                            {isEditing ? 'Update user account details' : 'Add a new account to the system'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-50 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                    {/* Identity Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Identity Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
                                <div className="relative group">
                                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        disabled={isEditing}
                                        placeholder="johndoe"
<<<<<<< HEAD
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all"
=======
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all disabled:opacity-60"
>>>>>>> 89df15ec222ddb2aab9a75b82ba75e9a6e95bbac
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Role</label>
                                <div className="relative group">
                                    <Shield className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <select
                                        name="role"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 transition-all"
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
                                    className="w-full px-6 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all"
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
                                    className="w-full px-6 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact & Security */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Contact & Security</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        disabled={isEditing}
                                        placeholder="john@example.com"
<<<<<<< HEAD
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all"
=======
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all disabled:opacity-60"
>>>>>>> 89df15ec222ddb2aab9a75b82ba75e9a6e95bbac
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        placeholder="0712345678"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                                    Password {isEditing && <span className="text-gray-300">(Leave empty to keep current)</span>}
                                </label>
                                <div className="relative group">
                                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
<<<<<<< HEAD
                                        required
                                        placeholder="••••••••"
=======
                                        required={!isEditing}
                                        placeholder={isEditing ? "Leave empty for no change" : "••••••••"}
>>>>>>> 89df15ec222ddb2aab9a75b82ba75e9a6e95bbac
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 transition-all"
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
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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
                            className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            <span>{isEditing ? 'Update User' : 'Create User Record'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUser;
