import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ role }) => {
  return (
    <aside className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-30 flex flex-col">
      <div className="p-6 border-b">
        <span className="text-xl font-bold text-blue-600">UsafiLink</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className="block py-2 px-4 rounded hover:bg-blue-100">Dashboard</Link>
        <Link to="/bookings" className="block py-2 px-4 rounded hover:bg-blue-100">Bookings</Link>
        <Link to="/payments" className="block py-2 px-4 rounded hover:bg-blue-100">Payments</Link>
        {role === 'admin' && (
          <Link to="/admin" className="block py-2 px-4 rounded hover:bg-red-100">Admin Dashboard</Link>
        )}
        {role === 'driver' && (
          <Link to="/driver" className="block py-2 px-4 rounded hover:bg-blue-100">Driver Dashboard</Link>
        )}
        <Link to="/profile" className="block py-2 px-4 rounded hover:bg-blue-100">Profile</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
