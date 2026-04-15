import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Shield, Key, ArrowLeft, Loader, Droplets } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

/* shared inline-style tokens */
const T = {
  heroBg:  'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)',
  green:   'linear-gradient(135deg,#059669,#0d9488)',
  amber:   'linear-gradient(135deg,#f59e0b,#f97316)',
  cardBg:  '#fff',
  border:  '#d1fae5',
  labelColor: '#065f46',
  inputBorder: '#a7f3d0',
  inputFocus:  '#059669',
};

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '2px solid #a7f3d0', outline: 'none', fontSize: 14,
  fontFamily: 'inherit', color: '#111827', background: '#f0fdf4',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 6 };

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const navigate = useNavigate();

  const handleSuccessfulLogin = (response) => {
    let userRole = 'user';
    if (response.user?.role) userRole = response.user.role;
    else if (response.role) userRole = response.role;
    else if (response.user_role) userRole = response.user_role;
    localStorage.setItem('user_role', userRole);
    toast.success('Login successful!', { duration: 2000 });
    if (userRole === 'admin') navigate('/admin');
    else if (userRole === 'driver') navigate('/driver');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      if (response.two_factor_required) {
        setShow2FA(true);
        toast.success('Please enter your 2FA code');
        setLoading(false);
        return;
      }
      handleSuccessfulLogin(response);
    } catch (error) {
      const errorData = error.response?.data;

      // Helper: pull a human-readable message out of whatever DRF returns
      const extractMessage = (data) => {
        if (!data) return null;
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) return data.detail[0];
        if (Array.isArray(data.non_field_errors)) return data.non_field_errors[0];
        // DRF sometimes returns { username: [...], password: [...] }
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          return Array.isArray(val) ? val[0] : String(val);
        }
        return null;
      };

      if (errorData?.email_verified === false || errorData?.email_verified?.[0] === 'False') {
        toast.error(
          <div>
            <p>{errorData.detail || 'Please verify your email before logging in.'}</p>
            <Link to="/resend-verification" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>
              Resend verification email
            </Link>
          </div>, { duration: 6000 }
        );
      } else {
        const msg = extractMessage(errorData) || 'Invalid username or password. Please try again.';
        toast.error(msg, { duration: 4000 });
      }
    } finally {
      if (!show2FA) setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login2FA({ username: formData.username, password: formData.password, token: twoFactorToken });
      handleSuccessfulLogin(response);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid 2FA token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a 0%, #0d1b2a 25%, #1a1a2e 50%, #16213e 75%, #0f3460 100%)' }}>
      {/* Animated background elements */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', filter: 'blur(80px)', animation: 'float 6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '20%', right: -150, width: 350, height: 350, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite 1s' }} />
      <div style={{ position: 'absolute', bottom: -80, left: '50%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.1)', filter: 'blur(80px)', animation: 'float 7s ease-in-out infinite 2s' }} />
      
      {/* Animated grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 450, zIndex: 10 }}>
        {/* Logo with animation */}
        <div style={{ textAlign: 'center', marginBottom: 40, animation: 'slideDown 0.6s ease-out' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)', animation: 'pulse 2.5s ease-in-out infinite' }}>
              <Droplets style={{ color: '#fff', width: 24, height: 24 }} />
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              Usafi<span style={{ background: 'linear-gradient(90deg, #34d399, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Link</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(167, 243, 208, 0.8)', margin: 0 }}>Septic & Exhauster Service</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', borderRadius: 32, padding: '48px 40px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.15)', animation: 'slideUp 0.6s ease-out', position: 'relative', overflow: 'hidden' }}>
          {/* Card decoration */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent)', borderRadius: '50%', transform: 'translate(50%, -50%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15), transparent)', borderRadius: '50%', transform: 'translate(-50%, 50%)' }} />

          {!show2FA ? (
            <>
              {/* Icon + title */}
              <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.45)', animation: 'bounce 2s ease-in-out infinite' }}>
                  <LogIn style={{ color: '#fff', width: 32, height: 32 }} />
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome Back</h2>
                <p style={{ fontSize: 13, color: 'rgba(167, 243, 208, 0.8)', marginTop: 8 }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Create one free</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#c7f0d8', marginBottom: 8 }}>Username</label>
                  <input style={{ ...inputStyle, background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)', color: '#fff', backdropFilter: 'blur(10px)' }} type="text" placeholder="Your username" value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })} required
                    onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#c7f0d8', marginBottom: 8 }}>Password</label>
                  <input style={{ ...inputStyle, background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)', color: '#fff', backdropFilter: 'blur(10px)' }} type="password" placeholder="Your password" value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })} required
                    onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                  <Link to="/forgot-password" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'none', fontSize: 13, transition: 'color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.target.style.color = '#6ee7b7'} onMouseLeave={e => e.target.style.color = '#34d399'}>
                    Forgot password?
                  </Link>
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: 12, padding: '14px', borderRadius: 16, border: '2px solid transparent', background: loading ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 24px rgba(5, 150, 105, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.3s', backgroundClip: 'padding-box', backgroundImage: loading ? 'none' : 'linear-gradient(135deg, #059669, #0d9488)' }}>
                  {loading ? <><Loader style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Signing in…</> : ''}
                  {!loading && <>Sign In <ArrowLeft style={{ width: 18, height: 18, transform: 'rotate(180deg)' }} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)', animation: 'bounce 2s ease-in-out infinite' }}>
                  <Shield style={{ color: '#fff', width: 32, height: 32 }} />
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Two-Factor Auth</h2>
                <p style={{ fontSize: 13, color: 'rgba(167, 243, 208, 0.8)', marginTop: 8 }}>Enter the 6-digit code from your authenticator app</p>
              </div>
              <form onSubmit={handle2FASubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                <input type="text" maxLength="6" required value={twoFactorToken}
                  onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ ...inputStyle, background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)', textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: 16, paddingLeft: 0, color: '#fff', backdropFilter: 'blur(10px)' }} />
                <button type="submit" disabled={loading || twoFactorToken.length !== 6} style={{ padding: '14px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <><Loader style={{ width: 18, height: 18 }} />Verifying…</> : 'Verify & Login →'}
                </button>
                <button type="button" onClick={() => setShow2FA(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(167, 243, 208, 0.8)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ArrowLeft style={{ width: 14, height: 14 }} /> Back to login
                </button>
              </form>
            </>
          )}
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
          @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0%, 100% { box-shadow: 0 8px 24px rgba(5, 150, 105, 0.4); } 50% { box-shadow: 0 8px 40px rgba(5, 150, 105, 0.7); } }
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        `}</style>
      </div>
    </div>
  );
};

export default Login;
