import React, { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, Shield } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '2px solid #a7f3d0',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#111827',
  background: '#f0fdf4',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 6 };

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const resetToken = useMemo(() => token || '', [token]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      toast.error('Invalid reset token.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please enter and confirm your new password');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({
        token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password reset successfully. Please login.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        <div style={{ background: '#fff', borderRadius: 28, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', border: '1px solid #d1fae5' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 6px 20px rgba(5,150,105,0.35)' }}>
              <Shield style={{ color: '#fff', width: 28, height: 28 }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#064e3b', margin: 0 }}>Reset Password</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 1.6 }}>
              Choose a new password. The reset link expires in about 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                onFocus={(e) => (e.target.style.borderColor = '#059669')}
                onBlur={(e) => (e.target.style.borderColor = '#a7f3d0')}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                onFocus={(e) => (e.target.style.borderColor = '#059669')}
                onBlur={(e) => (e.target.style.borderColor = '#a7f3d0')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(5,150,105,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
            >
              {loading ? <><Loader style={{ width: 18, height: 18 }} />Resetting…</> : 'Reset Password →'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20, marginTop: 16, textAlign: 'center' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#6b7280', textDecoration: 'none' }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Login
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ResetPassword;

