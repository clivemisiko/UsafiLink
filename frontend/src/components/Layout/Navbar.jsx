import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, User, LogOut, Home } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

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
            <Link to="/" className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">UsafiLink</span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-blue-500"
              >
                Dashboard
              </Link>

              {userRole === 'driver' ? (
                <>
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
                </>
              ) : (
                <>
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
                  to="/"
                  className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center"
                  title="Dashboard"
                >
                  <Home className="h-6 w-6" />
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
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
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