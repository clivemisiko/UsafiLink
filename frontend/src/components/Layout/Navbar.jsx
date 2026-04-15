import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Home, Droplets } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  const getDashboardLink = () => {
    if (!userRole) return '/';
    return userRole === 'driver' ? '/driver' : '/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/landing" className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-2">
                <Droplets className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-800">Usafi<span className="text-emerald-500">Link</span></span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {userRole === 'driver' ? (
                <>
                  <Link
                    to="/driver"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-emerald-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/driver/jobs"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Available Jobs
                  </Link>
                  <Link
                    to="/driver/earnings"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Earnings
                  </Link>
                  <Link
                    to="/driver/ratings"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Ratings
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-emerald-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/bookings"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Bookings
                  </Link>
                  <Link
                    to="/payments"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Payments
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Profile
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {isLoggedIn ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  to={getDashboardLink()}
                  className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center"
                  title="My Dashboard"
                >
                  <Home className="h-6 w-6" />
                </Link>

                <Link
                  to={getDashboardLink()}
                  className="hidden sm:inline text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all text-sm font-medium"
                >
                  My Dashboard
                </Link>

                <span className="text-gray-700 text-sm hidden md:inline font-medium">
                  Welcome, User
                </span>

                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-1 hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;