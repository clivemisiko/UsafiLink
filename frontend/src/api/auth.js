import axiosInstance from './axiosConfig';

export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await axiosInstance.post('/users/login/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await axiosInstance.post('/users/register/', userData);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Optional: Call backend logout endpoint
    // await axiosInstance.post('/users/logout/');
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/users/me/'); // You need to create this endpoint
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/users/profile/', userData);
    return response.data;
  },

  toggleOnline: async () => {
    const response = await axiosInstance.post('/users/toggle-online/');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axiosInstance.delete('/users/profile/');
    return response.data;
  },

  // Email verification
  verifyEmail: async (token) => {
    const response = await axiosInstance.get(`/users/verify-email/${token}/`);
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await axiosInstance.post('/users/resend-verification/', {
      email,
      frontend_url: window.location.origin
    });
    return response.data;
  },

  changePassword: async (passwords) => {
    const response = await axiosInstance.post('/users/change-password/', passwords);
    return response.data;
  },

  // 2FA
  setup2FA: async () => {
    const response = await axiosInstance.get('/users/2fa/setup/');
    return response.data;
  },

  verify2FA: async (token) => {
    const response = await axiosInstance.post('/users/2fa/verify/', { token });
    return response.data;
  },

  disable2FA: async (token) => {
    const response = await axiosInstance.post('/users/2fa/disable/', { token });
    return response.data;
  },

  login2FA: async (data) => {
    const response = await axiosInstance.post('/users/2fa/login/', data);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  }
};
