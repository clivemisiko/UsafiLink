import axiosInstance from './axiosConfig';

export const bookingsAPI = {
  // Create booking
  createBooking: async (bookingData) => {
    const response = await axiosInstance.post('/bookings/bookings/', bookingData);
    return response.data;
  },

  // Get all bookings for user
  getUserBookings: async (params = {}) => {
    const response = await axiosInstance.get('/bookings/bookings/', { params });
    return response.data;
  },

  // Get single booking
  getBooking: async (id) => {
    const response = await axiosInstance.get(`/bookings/bookings/${id}/`);
    return response.data;
  },

  // Update booking
  updateBooking: async (id, data) => {
    const response = await axiosInstance.patch(`/bookings/bookings/${id}/`, data);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (id) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/cancel/`);
    return response.data;
  },

  // Start job (Driver only)
  startJob: async (id) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/start/`);
    return response.data;
  },

  // Arrive at location (Driver only)
  arriveAtLocation: async (id) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/arrive/`);
    return response.data;
  },

  // Complete booking (Driver only)
  completeBooking: async (id) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/complete/`);
    return response.data;
  },

  // Get available bookings (Driver only)
  getAvailableBookings: async () => {
    const response = await axiosInstance.get('/bookings/bookings/available/');
    return response.data;
  },

  // Accept booking (Driver only)
  acceptBooking: async (id) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/accept/`);
    return response.data;
  },

  // Get available time slots
  getAvailableSlots: async (date) => {
    const response = await axiosInstance.get('/bookings/available-slots/', {
      params: { date }
    });
    return response.data;
  },

  // Get pricing estimate
  getPriceEstimate: async (bookingData) => {
    const response = await axiosInstance.post('/bookings/estimate-price/', bookingData);
    return response.data;
  },

  // Get dashboard statistics
  getStats: async () => {
    const response = await axiosInstance.get('/bookings/bookings/stats/');
    return response.data;
  }
};