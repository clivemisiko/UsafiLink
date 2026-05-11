import axiosInstance from './axiosConfig';

export const bookingsAPI = {
  // Create booking
  createBooking: async (bookingData) => {
    const response = await axiosInstance.post('/bookings/bookings/', bookingData);
    return response.data;
  },

  // Get all bookings for user
  getUserBookings: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/bookings/bookings/', { params });
      console.log('📚 getUserBookings raw response:', response.data);
      const data = response.data;
      // Handle different response formats
      let bookings = [];
      if (Array.isArray(data)) {
        bookings = data;
      } else if (data.results && Array.isArray(data.results)) {
        bookings = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        bookings = data.data;
      }
      console.log('📚 getUserBookings processed bookings:', bookings);
      return bookings;
    } catch (error) {
      console.error('❌ getUserBookings error:', error.response?.data || error.message);
      throw error;
    }
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

  // Reject booking (Driver only)
  rejectBooking: async (id) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/reject/`);
    return response.data;
  },

  // Driver Slot endpoints
  getAvailableSlots: async (date, driverId) => {
    const params = { date };
    if (driverId) params.driver_id = driverId;
    const response = await axiosInstance.get('/bookings/driver-slots/available/', {
      params
    });
    return response.data;
  },

  getDriverSlots: async (date) => {
    const params = date ? { date } : {};
    const response = await axiosInstance.get('/bookings/driver-slots/my_slots/', { params });
    return response.data;
  },

  createDriverSlot: async (slotData) => {
    const response = await axiosInstance.post('/bookings/driver-slots/', slotData);
    return response.data;
  },

  updateDriverSlot: async (id, slotData) => {
    const response = await axiosInstance.patch(`/bookings/driver-slots/${id}/`, slotData);
    return response.data;
  },

  deleteDriverSlot: async (id) => {
    const response = await axiosInstance.delete(`/bookings/driver-slots/${id}/`);
    return response.data;
  },

  getAllDriverSlots: async (params = {}) => {
    const response = await axiosInstance.get('/bookings/driver-slots/', { params });
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
  },

  // Rate booking
  rateBooking: async (id, ratingData) => {
    const response = await axiosInstance.post(`/bookings/bookings/${id}/rate/`, ratingData);
    return response.data;
  },

  // Create dispute
  createDispute: async (disputeData) => {
    const response = await axiosInstance.post('/bookings/disputes/', disputeData);
    return response.data;
  },

  // Get user disputes
  getUserDisputes: async () => {
    const response = await axiosInstance.get('/bookings/disputes/');
    return response.data;
  }
};