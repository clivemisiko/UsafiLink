// Debug script - paste this in browser console (F12)
console.log('=== USAFILINK DEBUG INFO ===');
console.log('Current URL:', window.location.href);
console.log('Current Path:', window.location.pathname);
console.log('Stored Role:', localStorage.getItem('user_role'));
console.log('Has Token:', !!localStorage.getItem('access_token'));
console.log('=========================');

// To test role-based navigation, uncomment one of these:
// localStorage.setItem('user_role', 'admin'); window.location.href = '/';
// localStorage.setItem('user_role', 'driver'); window.location.href = '/';
// localStorage.setItem('user_role', 'customer'); window.location.href = '/';
