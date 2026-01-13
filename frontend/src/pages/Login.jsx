import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Shield, Key, ArrowLeft, Loader } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const navigate = useNavigate();

  const handleSuccessfulLogin = (response) => {
    // Store user role from response
    let userRole = 'user';
    if (response.user && response.user.role) {
      userRole = response.user.role;
    } else if (response.role) {
      userRole = response.role;
    } else if (response.user_role) {
      userRole = response.user_role;
    }

    console.log('🎭 Detected Role:', userRole);
    localStorage.setItem('user_role', userRole);
    toast.success('Login successful!', {
      duration: 2000,
      position: 'top-right'
    });

    // Redirect based on role
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'driver') {
      navigate('/driver');
    } else {
      navigate('/dashboard');
    }
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
      if (errorData?.email_verified === false) {
        toast.error(
          <div>
            <p>{errorData.detail}</p>
            <Link to="/resend-verification" className="text-blue-600 font-bold underline mt-1 block">
              Resend verification email
            </Link>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(errorData?.detail || 'Login failed');
      }
    } finally {
      if (!show2FA) setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login2FA({
        username: formData.username,
        password: formData.password,
        token: twoFactorToken
      });
      handleSuccessfulLogin(response);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid 2FA token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-blue-100">
        {!show2FA ? (
          <>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 shadow-lg animate-bounce-slow">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-700 drop-shadow-sm">
                Welcome Back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-500">
                Or{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200">
                  create a new account
                </Link>
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-xl shadow-inner bg-blue-50/50 p-4 space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-blue-700 mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-blue-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full px-4 py-2 rounded-lg border border-blue-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </span>
                  ) : 'Sign in'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-green-400 to-green-600 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-green-700 drop-shadow-sm">
                Two-Factor Auth
              </h2>
              <p className="mt-2 text-center text-sm text-gray-500">
                Enter the code from your authenticator app
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
              <div className="rounded-xl shadow-inner bg-green-50/50 p-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-green-100 rounded-xl text-2xl font-bold tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="000000"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading || twoFactorToken.length !== 6}
                  className="w-full flex justify-center py-3.5 px-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Verifying...
                    </span>
                  ) : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full flex justify-center items-center text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to standard login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
