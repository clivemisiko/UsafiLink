import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminDrivers from './pages/admin/Drivers';
import AdminBookings from './pages/admin/Bookings';
import AdminDisputes from './pages/admin/Disputes';
import AdminLogs from './pages/admin/Logs';
import AdminPayments from './pages/admin/Payments';
import AdminAddUser from './pages/admin/AddUser';
import AdminRatings from './pages/admin/Ratings';
import Vehicles from './pages/admin/Vehicles';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import DriverJobs from './pages/DriverJobs';
import DriverSchedule from './pages/DriverSchedule';
import DriverEarnings from './pages/DriverEarnings';
import DriverRatings from './pages/DriverRatings';
import Bookings from './pages/Bookings';
import NewBooking from './pages/NewBooking';
import BookingDetail from './pages/BookingDetail';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import useIdleTimer from './hooks/useIdleTimer';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role') || 'customer';
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check license expiry for drivers
  if (userRole === 'driver') {
    const licenseExpiry = localStorage.getItem('license_expiry_date');
    if (licenseExpiry) {
      const expiryDate = new Date(licenseExpiry);
      if (expiryDate < new Date()) {
        localStorage.clear();
        return <Navigate to="/login" state={{ licenseExpired: true }} replace />;
      }
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'driver') return <Navigate to="/driver" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};



const Home = () => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role') || 'customer';

  if (!token) {
    return <Landing />;
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
    <div className="min-h-screen bg-parchment text-ink">
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
          <Route path="users/edit/:id" element={<AdminAddUser />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="ratings" element={<AdminRatings />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        {/* Driver */}
        <Route element={<PrivateRoute allowedRoles={["driver"]}><UserLayout /></PrivateRoute>}>
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/jobs" element={<DriverJobs />} />
          <Route path="/driver/bookings/:id" element={<BookingDetail />} />
          <Route path="/driver/schedule" element={<DriverSchedule />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
          <Route path="/driver/ratings" element={<DriverRatings />} />
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
