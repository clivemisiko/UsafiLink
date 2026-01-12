import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      console.log('🔍 Login Response:', response);

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
      toast.success('Login successful!');

      // Redirect based on role
      if (userRole === 'admin') {
        console.log('👑 Redirecting to /admin');
        navigate('/admin');
      } else if (userRole === 'driver') {
        console.log('🚗 Redirecting to /driver');
        navigate('/driver');
      } else {
        console.log('👤 Redirecting to /dashboard');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-blue-100">
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
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;