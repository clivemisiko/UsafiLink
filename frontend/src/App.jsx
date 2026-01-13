import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';
import AdminDisputes from './pages/admin/Disputes';
import AdminLogs from './pages/admin/Logs';
import AdminPayments from './pages/admin/Payments';
import AdminAddUser from './pages/admin/AddUser';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import DriverJobs from './pages/DriverJobs';
import DriverSchedule from './pages/DriverSchedule';
import DriverEarnings from './pages/DriverEarnings';
import Bookings from './pages/Bookings';
import NewBooking from './pages/NewBooking';
import BookingDetail from './pages/BookingDetail';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import useIdleTimer from './hooks/useIdleTimer';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Treat 'user' as valid if allowedRoles includes 'customer'
  // Or simply allow access if not explicitly forbidden
  // But let's stick to the logic: if we are redirecting to dashboard, check if we are already there.

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to their own dashboard if they try to access a page they don't have permission for
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'driver') return <Navigate to="/driver" replace />;

    // Safety check for redirect loop
    if (location.pathname.startsWith('/dashboard')) {
      return children;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const Home = () => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (userRole === 'driver') {
    return <Navigate to="/driver" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
  useIdleTimer(30 * 60 * 1000); // 30 minutes idle timeout for Admins

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout /></PrivateRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/new" element={<AdminAddUser />} />
          <Route path="drivers" element={<AdminUsers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        {/* Driver */}
        <Route element={<PrivateRoute allowedRoles={["driver"]}><UserLayout /></PrivateRoute>}>
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/jobs" element={<DriverJobs />} />
          <Route path="/driver/schedule" element={<DriverSchedule />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
        </Route>

        {/* User */}
        {/* User Routes */}
        <Route element={<PrivateRoute allowedRoles={["customer", "user"]}><UserLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/new" element={<NewBooking />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;