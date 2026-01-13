import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const ResendVerification = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resendVerification(email);
            setSent(true);
            toast.success('Verification email sent!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to resend verification email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-blue-600 tracking-tight">UsafiLink</h1>
                    <p className="mt-2 text-sm text-gray-600 font-medium uppercase tracking-widest">Email Verification</p>
                </div>

                <div className="bg-white py-10 px-8 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-gray-100 sm:rounded-[2rem]">
                    {!sent ? (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resend Verification</h2>
                            <p className="text-gray-600 mb-8">
                                Enter the email address you registered with, and we'll send you a new verification link.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all shadow-inner"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-400 disabled:shadow-none"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin mr-2" />
                                                SENDING...
                                            </>
                                        ) : (
                                            'SEND VERIFICATION LINK'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className="bg-green-100 p-4 rounded-full inline-flex mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                            <p className="text-gray-600 mb-8">
                                We've sent a new verification link to <span className="font-semibold text-blue-600">{email}</span>.
                                Please check your inbox and spam folder.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-xl text-left border border-blue-100 mb-8">
                                <p className="text-sm text-blue-700 leading-relaxed italic">
                                    "If you still don't see it after 5 minutes, try searching for UsafiLink in your mail search bar."
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <Link
                            to="/login"
                            className="flex items-center justify-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            BACK TO LOGIN
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Need help? <Link to="/support" className="text-blue-600 font-bold hover:underline">Contact Support</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResendVerification;
