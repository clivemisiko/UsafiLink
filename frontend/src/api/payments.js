import axiosInstance from './axiosConfig';

export const paymentsAPI = {
  // Initiate M-PESA payment
  initiateMpesaPayment: async (paymentData) => {
    const response = await axiosInstance.post(
      '/payments/payments/initiate_mpesa_payment/',
      paymentData
    );
    return response.data;
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    const response = await axiosInstance.get(`/payments/payments/${paymentId}/status/`);
    return response.data;
  },

  // Get user payments
  getUserPayments: async (params = {}) => {
    const response = await axiosInstance.get('/payments/payments/my_payments/', { params });
    return response.data;
  },

  // Retry payment
  retryPayment: async (paymentId, phoneNumber) => {
    const response = await axiosInstance.post(
      `/payments/payments/${paymentId}/retry_payment/`,
      { phone_number: phoneNumber }
    );
    return response.data;
  },

  // Cancel payment
  cancelPayment: async (paymentId) => {
    const response = await axiosInstance.post(
      `/payments/payments/${paymentId}/cancel_payment/`
    );
    return response.data;
  },

  // Poll payment status (for real-time updates)
  pollPaymentStatus: async (paymentId, interval = 3000, maxAttempts = 20) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          const response = await paymentsAPI.getPaymentStatus(paymentId);
          
          if (response.payment?.status === 'paid' || attempts >= maxAttempts) {
            resolve(response);
          } else {
            attempts++;
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
};