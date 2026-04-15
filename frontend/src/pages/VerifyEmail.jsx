import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, ArrowRight, Droplets } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const performVerification = async () => {
            try {
                const response = await authAPI.verifyEmail(token);
                setStatus('success');
                setMessage(response.detail || 'Your email has been verified! You can now access all UsafiLink features.');
                toast.success('Email verified successfully!');
                setTimeout(() => navigate('/login'), 5000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.detail || 'Verification link is invalid or has expired.');
                toast.error('Verification failed');
            }
        };
        if (token) performVerification();
        else { setStatus('error'); setMessage('No verification token provided.'); }
    }, [token, navigate]);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

            <div style={{ position: 'relative', textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Droplets style={{ color: '#fff', width: 22, height: 22 }} />
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>Usafi<span style={{ color: '#6ee7b7' }}>Link</span></span>
                </div>
                <p style={{ color: 'rgba(167,243,208,0.8)', fontSize: 12, marginTop: 6, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Email Verification</p>
            </div>

            <div style={{ position: 'relative', background: '#fff', borderRadius: 28, padding: '40px 36px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', border: '1px solid #d1fae5', textAlign: 'center' }}>

                {status === 'verifying' && (
                    <>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: '#d1fae5', animation: 'ping 1.5s infinite', opacity: 0.5 }} />
                            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader style={{ width: 36, height: 36, color: '#059669', animation: 'spin 1s linear infinite' }} />
                            </div>
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#064e3b', marginBottom: 8 }}>Verifying Your Email</h2>
                        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Please wait while we confirm your email address. This will only take a moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCircle style={{ width: 40, height: 40, color: '#059669' }} />
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#064e3b', marginBottom: 10 }}>Email Verified! 🎉</h2>
                        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 28 }}>{message}</p>
                        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(5,150,105,0.4)', marginBottom: 12 }}>
                            Go to Login <ArrowRight style={{ width: 16, height: 16 }} />
                        </Link>
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>Redirecting automatically in a few seconds…</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <XCircle style={{ width: 40, height: 40, color: '#ef4444' }} />
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#064e3b', marginBottom: 10 }}>Verification Failed</h2>
                        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 28 }}>{message}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Link to="/resend-verification" style={{ display: 'block', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 16px rgba(5,150,105,0.4)' }}>
                                Resend Verification Email
                            </Link>
                            <Link to="/register" style={{ display: 'block', padding: '12px', borderRadius: 14, border: '2px solid #d1fae5', color: '#059669', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                                Back to Registration
                            </Link>
                        </div>
                    </>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes ping{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.3);opacity:0}}`}</style>
        </div>
    );
};

export default VerifyEmail;
