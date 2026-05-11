import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus, Droplets, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '2px solid #a7f3d0', outline: 'none', fontSize: 14,
  fontFamily: 'inherit', color: '#111827', background: '#f0fdf4',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 6 };

const googleButtonStyle = {
  width: '100%', borderRadius: 16, border: '1px solid rgba(229, 231, 235, 0.9)', background: '#fff', color: '#111827', fontSize: 15, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 9.5C26.94 9.5 30.3 10.96 32.72 12.98L36.84 8.86C33.26 5.7 28.4 3.8 23 3.8C14.95 3.8 8.13 8.88 4.96 15.84L10.92 19.36C12.52 13.84 17.44 9.5 23 9.5Z" fill="#4285F4"/>
    <path d="M42.2 23.6C42.2 22.12 42.08 20.72 41.84 19.38H23V27.7H34.74C34.24 30.12 32.68 32.1 30.44 33.48L35.16 37.06C38.5 34.2 40.8 29.98 42.2 23.6Z" fill="#34A853"/>
    <path d="M10.92 26.64C10.48 25.3 10.25 23.86 10.25 22.34C10.25 20.82 10.48 19.4 10.92 18.06L4.96 14.54C3.52 17.1 2.7 19.96 2.7 22.34C2.7 24.72 3.52 27.58 4.96 30.14L10.92 26.64Z" fill="#FBBC05"/>
    <path d="M23 42.2C28.36 42.2 32.9 40.68 36.22 37.86L30.38 34.1C28.7 35.22 26.74 35.86 24.7 35.86C19.24 35.86 14.76 32.16 13.14 27.08L7.06 30.74C8.76 36.9 15.24 42.2 23 42.2Z" fill="#EA4335"/>
  </svg>
);

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'customer', phone_number: '', first_name: '', last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (formData.password.length < 8)                   { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authAPI.register({
        username: formData.username, email: formData.email, password: formData.password,
        password2: formData.confirmPassword, role: formData.role,
        phone_number: formData.phone_number, first_name: formData.first_name, last_name: formData.last_name, frontend_url: window.location.origin
      });
      toast.success(
        <div>
          <p style={{ fontWeight: 700 }}>Registration successful! 🎉</p>
          <p style={{ fontSize: 13 }}>Please check your email to verify your account.</p>
          <p style={{ fontSize: 11, marginTop: 4, color: '#059669', fontStyle: 'italic' }}>Didn't get it? Check your spam folder.</p>
        </div>,
        { duration: 8000 }
      );
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData && typeof errorData === 'object') {
        const messages = Object.entries(errorData).map(([field, msgs]) => {
          const msg = Array.isArray(msgs) ? msgs[0] : msgs;
          const name = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
          return <div key={field} style={{ marginBottom: 4 }}><strong>{name}:</strong> {msg}</div>;
        });
        toast.error(<div><p style={{ fontWeight: 700, marginBottom: 4 }}>Registration failed:</p>{messages}</div>, { duration: 6000 });
      } else if (typeof errorData === 'string') {
        toast.error(errorData);
      } else if (error.request) {
        toast.error('Network error. Please try again.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google login failed. Please try again.');
      return;
    }
    if (formData.role === 'driver') {
      toast.error('Google sign up currently supports customer accounts only. Please register with email for driver accounts.');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.googleLogin({ token: credentialResponse.credential, role: formData.role });
      toast.success('Signed up with Google successfully!', { duration: 3000 });
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Google signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 25%, #16213e 50%, #0d1b2a 75%, #0f3460 100%)' }}>
      {/* Animated background elements */}
      <div style={{ position: 'absolute', top: -100, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(80px)', animation: 'float 6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: -120, left: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite 1s' }} />
      <div style={{ position: 'absolute', top: '35%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.08)', filter: 'blur(80px)', animation: 'float 7s ease-in-out infinite 2s' }} />
      
      {/* Animated grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 520, zIndex: 10 }}>
        {/* Logo with animation */}
        <div style={{ textAlign: 'center', marginBottom: 36, animation: 'slideDown 0.6s ease-out' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)', animation: 'pulse 2.5s ease-in-out infinite' }}>
              <Droplets style={{ color: '#fff', width: 24, height: 24 }} />
            </div>
            <Link to="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                Usafi<span style={{ background: 'linear-gradient(90deg, #34d399, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Link</span>
              </span>
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(167, 243, 208, 0.8)', margin: 0 }}>Join our growing community</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', borderRadius: 32, padding: '44px 40px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.15)', animation: 'slideUp 0.6s ease-out', position: 'relative', overflow: 'hidden' }}>
          {/* Card decoration */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent)', borderRadius: '50%', transform: 'translate(50%, -50%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15), transparent)', borderRadius: '50%', transform: 'translate(-50%, 50%)' }} />

          <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.45)', animation: 'bounce 2s ease-in-out infinite' }}>
              <UserPlus style={{ color: '#fff', width: 32, height: 32 }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Create Your Account</h2>
            <p style={{ fontSize: 13, color: 'rgba(167, 243, 208, 0.8)', marginTop: 8 }}>
              Already have one?{' '}
              <Link to="/login" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Sign in</Link>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <GoogleIcon />
              <span style={{ color: '#d1fae5', fontWeight: 700, fontSize: 13 }}>Continue with Google</span>
            </div>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => toast.error('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.2)' }} />
            <span style={{ color: 'rgba(167, 243, 208, 0.6)', fontSize: 12, fontWeight: 600 }}>or create account with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.2)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
            {/* Row 1: username + phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Username</label>
                <input style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }} name="username" type="text" placeholder="username" value={formData.username} onChange={handleChange} required
                  onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }} 
                  onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Phone</label>
                <input style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }} name="phone_number" type="text" placeholder="07XX XXX XXX" value={formData.phone_number} onChange={handleChange} required
                  onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }} 
                  onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Email Address</label>
              <input style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }} name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required
                onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }} 
                onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>First Name</label>
                <input style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }} name="first_name" type="text" placeholder="John" value={formData.first_name} onChange={handleChange}
                  onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }} 
                  onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Last Name</label>
                <input style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }} name="last_name" type="text" placeholder="Doe" value={formData.last_name} onChange={handleChange}
                  onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }} 
                  onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Account Type</label>
              <select name="role" value={formData.role} onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
                <option value="customer" style={{ background: '#1a1a2e', color: '#fff' }}>👤 Customer (Book Services)</option>
                <option value="driver" style={{ background: '#1a1a2e', color: '#fff' }}>🚛 Driver (Accept Jobs)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)', paddingRight: 40 }}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      width: 20,
                      height: 20
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c7f0d8', marginBottom: 6 }}>Confirm</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid rgba(255, 255, 255, 0.2)', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#fff', background: 'rgba(255, 255, 255, 0.1)', boxSizing: 'border-box', backdropFilter: 'blur(10px)', paddingRight: 40 }}
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    onFocus={e => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'rgba(52, 211, 153, 0.6)'; e.target.style.boxShadow = '0 0 16px rgba(52, 211, 153, 0.2)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      width: 20,
                      height: 20
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: 10, padding: '14px', borderRadius: 16, border: 'none', background: loading ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 24px rgba(5, 150, 105, 0.4)', transition: 'all 0.3s' }}>
              {loading ? 'Creating Account…' : 'Create Free Account →'}
            </button>

            <p style={{ fontSize: 11, color: 'rgba(167, 243, 208, 0.6)', textAlign: 'center', marginTop: 6 }}>
              By signing up you agree to our Terms of Service & Privacy Policy.
            </p>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 8px 24px rgba(5, 150, 105, 0.4); } 50% { box-shadow: 0 8px 40px rgba(5, 150, 105, 0.7); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
};

export default Register;
