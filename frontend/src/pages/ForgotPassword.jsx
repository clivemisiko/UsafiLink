import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader, CheckCircle, Droplets } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%',
  padding: '12px 14px 12px 42px',
  borderRadius: 12,
  border: '2px solid #a7f3d0',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#111827',
  background: '#f0fdf4',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const ForgotPassword = () => {
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
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Logo */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets style={{ color: '#fff', width: 22, height: 22 }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>
            Usafi<span style={{ color: '#6ee7b7' }}>Link</span>
          </span>
        </div>
        <p style={{ color: 'rgba(167,243,208,0.8)', fontSize: 12, marginTop: 6, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
          Reset Password
        </p>
      </div>

      {/* Card */}
      <div style={{ position: 'relative', background: '#fff', borderRadius: 28, padding: '40px 36px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', border: '1px solid #d1fae5' }}>
        {!sent ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}>
                <Mail style={{ color: '#fff', width: 24, height: 24 }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#064e3b', marginBottom: 8 }}>Forgot Password</h2>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Enter your registered email and we will send a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 6 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#6b7280' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#a7f3d0')}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(5,150,105,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><Loader style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />Sending…</> : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#059669' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#064e3b', marginBottom: 10 }}>Check Your Email</h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>
              If your email is registered, we sent a reset link to{' '}
              <strong style={{ color: '#059669' }}>{email}</strong>. Please check your inbox.
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#065f46', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                The reset link expires in about 24 hours.
              </p>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20, marginTop: 8 }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#6b7280', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Login
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ForgotPassword;

