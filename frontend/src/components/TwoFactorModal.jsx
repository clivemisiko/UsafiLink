import React, { useState, useEffect } from 'react';
import { X, Shield, QrCode, Loader, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const TwoFactorModal = ({ isOpen, onClose, isEnabled, onStatusChange }) => {
    const [step, setStep] = useState('initial'); // initial, setup, verify, disable
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState(null);
    const [token, setToken] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep(isEnabled ? 'initial_enabled' : 'initial_disabled');
            setToken('');
        }
    }, [isOpen, isEnabled]);

    if (!isOpen) return null;

    const handleStartSetup = async () => {
        setLoading(true);
        try {
            const data = await authAPI.setup2FA();
            setSetupData(data);
            setStep('setup');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to start 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        try {
            await authAPI.verify2FA(token);
            toast.success('Two-Factor Authentication enabled!');
            onStatusChange(true);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid token');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async (e) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        try {
            await authAPI.disable2FA(token);
            toast.success('Two-Factor Authentication disabled');
            onStatusChange(false);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid token. Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-scaleIn">
                {/* Header */}
                <div className={`p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r ${isEnabled ? 'from-green-600 to-teal-600' : 'from-blue-600 to-indigo-600'}`}>
                    <div className="flex items-center text-white">
                        <Shield className="w-5 h-5 mr-3" />
                        <h2 className="text-xl font-bold">Two-Factor Auth</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {/* Initial States */}
                    {step === 'initial_disabled' && (
                        <div className="text-center space-y-6">
                            <div className="bg-blue-50 p-6 rounded-full inline-flex">
                                <Shield className="w-12 h-12 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Secure Your Account</h3>
                                <p className="mt-2 text-gray-600">
                                    Two-factor authentication adds an extra layer of security to your account.
                                    You'll need a code from your authenticator app to log in.
                                </p>
                            </div>
                            <button
                                onClick={handleStartSetup}
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Get Started'}
                            </button>
                        </div>
                    )}

                    {step === 'initial_enabled' && (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 p-6 rounded-full inline-flex">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">2FA is Active</h3>
                                <p className="mt-2 text-gray-600">
                                    Your account is protected with two-factor authentication.
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('verify_disable')}
                                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                            >
                                Disable 2FA
                            </button>
                        </div>
                    )}

                    {/* Setup Step */}
                    {step === 'setup' && setupData && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">Scan QR Code</h3>
                                <p className="text-sm text-gray-600 mt-1">Scan this with Google Authenticator or Authy</p>
                            </div>

                            <div className="flex justify-center p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <img src={setupData.qr_code} alt="QR Code" className="w-48 h-48" />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase">Secret Key (Manual Entry)</p>
                                <div className="p-3 bg-gray-100 rounded-xl font-mono text-center text-sm break-all select-all">
                                    {setupData.secret}
                                </div>
                            </div>

                            <button
                                onClick={() => setStep('verify')}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                            >
                                I've scanned the code
                            </button>
                        </div>
                    )}

                    {/* Verification Step */}
                    {(step === 'verify' || step === 'verify_disable') && (
                        <form onSubmit={step === 'verify' ? handleVerify : handleDisable} className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {step === 'verify' ? 'Verify Code' : 'Confirm Disabling'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength="6"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-2xl font-bold tracking-[0.5em] text-center"
                                    placeholder="000000"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(isEnabled ? 'initial_enabled' : 'initial_disabled')}
                                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || token.length !== 6}
                                    className={`flex-2 py-4 px-8 ${step === 'verify' ? 'bg-blue-600' : 'bg-red-600'} text-white rounded-2xl font-bold hover:opacity-90 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {loading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        step === 'verify' ? 'Verify & Enable' : 'Verify & Disable'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TwoFactorModal;
