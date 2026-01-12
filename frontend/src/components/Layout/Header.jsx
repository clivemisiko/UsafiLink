import React from 'react';
import { Link } from 'react-router-dom';

const UsafiLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2563eb" />
    <path d="M10 22C10 18 16 10 22 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="5" fill="#fff" />
  </svg>
);

const Header = ({ role }) => {
  const theme = role === 'admin'
    ? 'bg-gradient-to-r from-red-600 via-blue-600 to-blue-400 text-white'
    : 'bg-gradient-to-r from-blue-600 to-white text-blue-900';
  return (
    <header className={`flex items-center px-6 py-4 shadow ${theme}`} style={{ minHeight: 72 }}>
      <UsafiLogo />
      <span className="ml-4 text-3xl font-extrabold tracking-wide">UsafiLink</span>
      <div className="flex-1" />
      <Link to="/profile" className="text-lg font-medium hover:underline">Profile</Link>
    </header>
  );
};

export default Header;
