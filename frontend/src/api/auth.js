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
  }
};
