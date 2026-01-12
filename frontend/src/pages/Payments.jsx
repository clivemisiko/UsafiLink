import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
  CreditCard,
  Smartphone,
  Loader,
  X
} from 'lucide-react';
import { paymentsAPI } from '../api/payments';
import toast from 'react-hot-toast';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Payment Modal State
  const location = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ bookingId: null, amount: 0 });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPayments();

    // Check if redirected with payment data
    if (location.state?.bookingId && location.state?.amount) {
      setPaymentData({
        bookingId: location.state.bookingId,
        amount: location.state.amount
      });
      setShowPaymentModal(true);
      // Clean up state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    if (!phoneNumber.match(/^254\d{9}$/)) {
      toast.error('Please enter a valid phone number (e.g., 254712345678)');
      return;
    }

    setProcessingPayment(true);
    const toastId = toast.loading('Initiating M-PESA payment...');

    try {
      const response = await paymentsAPI.initiateMpesaPayment({
        booking_id: paymentData.bookingId,
        amount: paymentData.amount,
        phone_number: phoneNumber
      });

      toast.success('STK Push sent! Check your phone.', { id: toastId });
      setShowPaymentModal(false);

      // Start polling for status
      if (response.payment_id) {
        pollStatus(response.payment_id);
      }

      fetchPayments(); // Refresh list immediately to show pending payment
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to initiate payment', { id: toastId });
    } finally {
      setProcessingPayment(false);
    }
  };

  const pollStatus = async (paymentId) => {
    const toastId = toast.loading('Waiting for payment confirmation...');
    try {
      // Poll every 3 seconds for up to 1 minute
      const result = await paymentsAPI.pollPaymentStatus(paymentId, 3000, 20);

      if (result.payment?.status === 'paid') {
        toast.success('Payment received successfully!', { id: toastId });
        fetchPayments();
      } else {
        toast.error('Payment confirmation timed out. Please check status later.', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      // Silent fail on polling error, user can check status manually
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, paymentMethodFilter]);

  const fetchPayments = async () => {
    try {
      const data = await paymentsAPI.getUserPayments();
      setPayments(data);
      setFilteredPayments(data);
    } catch (error) {
      toast.error('Failed to fetch payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.booking?.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.mpesa_receipt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === paymentMethodFilter);
    }

    setFilteredPayments(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString() || '0'}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'mpesa': return <Smartphone className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const handleRetryPayment = async (paymentId) => {
    const phoneNumber = prompt('Enter your phone number for M-PESA payment (format: 2547XXXXXXXX):');
    if (phoneNumber) {
      try {
        await paymentsAPI.retryPayment(paymentId, phoneNumber);
        toast.success('Payment retry initiated. Please check your phone.');
        fetchPayments(); // Refresh the list
      } catch (error) {
        toast.error('Failed to retry payment');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
              <p className="mt-1 text-sm text-gray-600">
                View all your payments and receipts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-semibold text-gray-900">{payments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {payments.filter(p => p.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  KES {payments
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + (p.amount || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="mpesa">M-PESA</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentMethodFilter('all');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'No payments match your filters'
                  : 'No payment history yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Payment #{payment.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.mpesa_receipt ? `Receipt: ${payment.mpesa_receipt}` : 'No receipt'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.booking?.location_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Booking #{payment.booking?.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="ml-2 text-sm text-gray-900">
                            {payment.payment_method?.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payment.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1">
                              {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // View receipt
                              if (payment.mpesa_receipt) {
                                window.open(`/api/payments/${payment.id}/receipt/`, '_blank');
                              } else {
                                toast.error('No receipt available');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Receipt
                          </button>
                          {payment.status === 'failed' && (
                            <button
                              onClick={() => handleRetryPayment(payment.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Button */}
        {filteredPayments.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="mr-2 h-4 w-4" />
              Export Statements
            </button>
          </div>
        )}

        {/* Payment Methods Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Smartphone className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">M-PESA</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Pay instantly via M-PESA STK Push. You'll receive a prompt on your phone.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Fast and secure</p>
              <p>• Instant confirmation</p>
              <p>• Receipt provided</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">Card Payment</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Pay using Visa, MasterCard, or other debit/credit cards.
            </p>
            <div className="text-sm text-gray-500">
              <p>• All major cards accepted</p>
              <p>• Secure SSL encryption</p>
              <p>• 3D Secure enabled</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">Cash on Delivery</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Pay cash directly to the driver when service is completed.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Pay after service</p>
              <p>• Get physical receipt</p>
              <p>• Driver provides change</p>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">M-PESA Payment</h3>
                <p className="text-gray-600 mt-2">
                  Complete payment for Booking #{paymentData.bookingId}
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  KES {paymentData.amount?.toLocaleString()}
                </p>
              </div>

              <form onSubmit={handleInitiatePayment} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    M-PESA Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      🇰🇪
                    </span>
                    <input
                      type="text"
                      id="phone"
                      required
                      placeholder="254712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: 2547XXXXXXXX</p>
                </div>

                <button
                  type="submit"
                  disabled={processingPayment}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${processingPayment ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {processingPayment ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                You will receive an M-PESA prompts on your phone.
                Only after entering your PIN will the payment be processed.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;