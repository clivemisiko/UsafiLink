import axiosInstance from './axiosConfig';

export const adminAPI = {
  // Dashboard
  getDashboardStats: async (timeRange = 'today') => {
    const response = await axiosInstance.get('/admin/dashboard/', {
      params: { range: timeRange }
    });
    return response.data;
  },

  // Users
  getUsers: async (params = {}) => {
    const response = await axiosInstance.get('/admin/users/', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post('/admin/users/', userData);
    return response.data;
  },

  getUser: async (id) => {
    const response = await axiosInstance.get(`/admin/users/${id}/`);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await axiosInstance.patch(`/admin/users/${id}/`, data);
    return response.data;
  },

  activateUser: async (id) => {
    const response = await axiosInstance.post(`/admin/users/${id}/activate/`);
    return response.data;
  },

  deactivateUser: async (id) => {
    const response = await axiosInstance.post(`/admin/users/${id}/deactivate/`);
    return response.data;
  },

  changeUserRole: async (id, role) => {
    const response = await axiosInstance.post(`/admin/users/${id}/change_role/`, { role });
    return response.data;
  },

  // Bookings
  getBookings: async (params = {}) => {
    const response = await axiosInstance.get('/admin/bookings/', { params });
    return response.data;
  },

  assignDriver: async (bookingId, driverId) => {
    const response = await axiosInstance.post(`/admin/bookings/${bookingId}/assign_driver/`, { driver_id: driverId });
    return response.data;
  },

  // Disputes
  getDisputes: async (params = {}) => {
    const response = await axiosInstance.get('/admin/disputes/', { params });
    return response.data;
  },

  resolveDispute: async (disputeId, resolution) => {
    const response = await axiosInstance.post(`/admin/disputes/${disputeId}/resolve/`, { resolution });
    return response.data;
  },

  dismissDispute: async (disputeId) => {
    const response = await axiosInstance.post(`/admin/disputes/${disputeId}/dismiss/`);
    return response.data;
  },

  // System Logs
  getLogs: async (params = {}) => {
    const response = await axiosInstance.get('/admin/logs/', { params });
    return response.data;
  },
};