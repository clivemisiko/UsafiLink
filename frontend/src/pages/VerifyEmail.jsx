import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail, ArrowRight } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const performVerification = async () => {
            try {
                const response = await authAPI.verifyEmail(token);
                setStatus('success');
                setMessage(response.detail || 'Your email has been successfully verified! You can now access all features of UsafiLink.');
                toast.success('Email verified successfully!');

                // Auto redirect after 5 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.detail || 'Verification link is invalid or has expired.');
                toast.error('Verification failed');
            }
        };

        if (token) {
            performVerification();
        } else {
            setStatus('error');
            setMessage('No verification token provided.');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-blue-600 tracking-tight">UsafiLink</h1>
                    <p className="mt-2 text-sm text-gray-600 font-medium uppercase tracking-widest">Verification Status</p>
                </div>

                <div className="bg-white py-10 px-8 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-gray-100 sm:rounded-[2rem]">
                    <div className="flex flex-col items-center">
                        {status === 'verifying' && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                                    <div className="relative bg-white p-4 rounded-full border-2 border-blue-500">
                                        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                                    </div>
                                </div>
                                <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying your email</h2>
                                <p className="mt-2 text-center text-gray-600">
                                    Please wait while we confirm your email address. This will only take a moment.
                                </p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="bg-green-100 p-4 rounded-full">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="mt-6 text-2xl font-bold text-gray-900">Email Verified!</h2>
                                <p className="mt-4 text-center text-gray-600 leading-relaxed">
                                    {message}
                                </p>
                                <div className="mt-8 w-full space-y-4">
                                    <Link
                                        to="/login"
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02]"
                                    >
                                        Go to Login <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                    <p className="text-center text-xs text-gray-400">
                                        Redirecting you to login automatically in a few seconds...
                                    </p>
                                </div>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="bg-red-100 p-4 rounded-full">
                                    <XCircle className="w-12 h-12 text-red-600" />
                                </div>
                                <h2 className="mt-6 text-2xl font-bold text-gray-900">Verification Failed</h2>
                                <p className="mt-4 text-center text-gray-600 leading-relaxed">
                                    {message}
                                </p>
                                <div className="mt-8 w-full space-y-4">
                                    <Link
                                        to="/resend-verification"
                                        className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                    >
                                        Resend Verification Email
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="w-full flex justify-center text-sm font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Back to Registration
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
