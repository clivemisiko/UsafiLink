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
  Smartphone,
  Loader,
  X,
  CreditCard,
  Receipt,
  RefreshCw,
  Banknote,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Building2,
  ChevronDown
} from 'lucide-react';
import { paymentsAPI } from '../api/payments';
import axiosInstance, { API_BASE_URL } from '../api/axiosConfig';
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
  const [selectedMethod, setSelectedMethod] = useState('mobile_money'); // 'mobile_money', 'bank', or 'cash'
  const [bankReference, setBankReference] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cashNotes, setCashNotes] = useState(''); // For cash payment notes

  const handleViewReceipt = async (paymentId) => {
    const toastId = toast.loading('Generating receipt...');
    try {
      const response = await axiosInstance.get(`/payments/payments/${paymentId}/receipt/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      window.open(url, '_blank');
      toast.success('Receipt generated', { id: toastId });
    } catch (error) {
      console.error('Receipt error:', error);
      toast.error('Failed to load receipt', { id: toastId });
    }
  };

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
    if (selectedMethod === 'mobile_money' && !phoneNumber.match(/^254\d{9}$/)) {
      toast.error('Please enter a valid phone number (e.g., 254712345678)');
      return;
    }

    setProcessingPayment(true);
    const toastId = toast.loading('Initiating payment...');

    try {
      const response = await paymentsAPI.initiatePayment({
        booking_id: paymentData.bookingId,
        payment_method: selectedMethod,
        phone_number: phoneNumber
      });

      if (response.checkout_url) {
        // Open IntaSend checkout link in new window
        window.open(response.checkout_url, '_blank');
        toast.success('Payment page opened. Please complete your payment.', { id: toastId });
        setShowPaymentModal(false);
        
        // Start polling for status
        if (response.payment_id) {
          pollStatus(response.payment_id);
        }
      } else {
        toast.success('Payment initiated successfully!', { id: toastId });
        setShowPaymentModal(false);
        
        if (response.payment_id) {
          pollStatus(response.payment_id);
        }
      }

      fetchPayments(); // Refresh list immediately to show pending payment
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to initiate payment', { id: toastId });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBankTransfer = async (e) => {
    e.preventDefault();
    if (!bankReference.trim()) {
      toast.error('Please enter the bank transaction reference number');
      return;
    }

    setProcessingPayment(true);
    const toastId = toast.loading('Submitting bank transfer details...');

    try {
      await paymentsAPI.initiateBankTransfer({
        booking_id: paymentData.bookingId,
        bank_reference: bankReference
      });

      toast.success('Transfer submitted! Our team will verify it.', { id: toastId });
      setShowPaymentModal(false);
      setBankReference('');
      fetchPayments();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to submit bank transfer', { id: toastId });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCashPayment = async (e) => {
    e.preventDefault();
    
    setProcessingPayment(true);
    const toastId = toast.loading('Submitting cash payment...');

    try {
      await paymentsAPI.initiateCashPayment({
        booking_id: paymentData.bookingId,
        amount: paymentData.amount,
        notes: cashNotes
      });

      toast.success('Cash payment recorded! Pay the driver upon service completion.', { id: toastId });
      setShowPaymentModal(false);
      setCashNotes('');
      fetchPayments();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to submit cash payment', { id: toastId });
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
        payment.intasend_api_ref?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const num = parseFloat(amount);
    if (isNaN(num)) return 'KES 0.00';
    return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
      case 'mobile_money': return <Smartphone className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const handleRetryPayment = async (paymentId) => {
    const phoneNumber = prompt('Enter your phone number for payment (format: 2547XXXXXXXX):');
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

  const handleExportPayments = () => {
    try {
      // Create CSV content
      const headers = ['Payment ID', 'Booking ID', 'Amount', 'Method', 'Status', 'Date', 'Receipt/Reference'];
      const csvRows = [headers.join(',')];

      filteredPayments.forEach(payment => {
        const row = [
          payment.id,
          payment.booking_details?.id || 'N/A',
          payment.amount || 0,
          payment.payment_method?.toUpperCase() || 'N/A',
          payment.status,
          formatDate(payment.created_at),
          payment.intasend_api_ref || payment.bank_reference || 'N/A'
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_statements_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Payment statements exported successfully!');
    } catch (error) {
      toast.error('Failed to export payment statements');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          <p className="text-sm text-slate-500 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  const paidTotal = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-600 font-bold">Payments</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Payment History
              </h1>
            </div>
            {filteredPayments.length > 0 && (
              <button
                onClick={handleExportPayments}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-700 transition"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2.5 bg-emerald-50 rounded-xl">
                <Receipt className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-slate-900">{payments.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2.5 bg-green-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Successful</p>
                <p className="text-xl font-bold text-slate-900">
                  {payments.filter(p => p.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2.5 bg-amber-50 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold text-slate-900">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2.5 bg-violet-50 rounded-xl">
                <Wallet className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paid Total</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(paidTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="block w-full sm:w-auto px-3 py-2.5 border border-gray-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-700 transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="block w-full sm:w-auto px-3 py-2.5 border border-gray-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-700 transition"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentMethodFilter('all');
              }}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl text-slate-600 bg-white hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No payments</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'No payments match your filters'
                  : 'No payment history yet'}
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: Payment info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${
                      payment.status === 'paid' ? 'bg-green-50' :
                      payment.status === 'pending' ? 'bg-amber-50' :
                      payment.status === 'failed' ? 'bg-red-50' :
                      'bg-slate-50'
                    }`}>
                      {payment.payment_method === 'mobile_money' ? (
                        <Smartphone className={`w-5 h-5 ${
                          payment.status === 'paid' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-amber-600' :
                          'text-slate-500'
                        }`} />
                      ) : payment.payment_method === 'cash' ? (
                        <Banknote className={`w-5 h-5 ${
                          payment.status === 'paid' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-amber-600' :
                          'text-slate-500'
                        }`} />
                      ) : (
                        <CreditCard className={`w-5 h-5 ${
                          payment.status === 'paid' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-amber-600' :
                          'text-slate-500'
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {payment.booking_details?.location || `Payment #${payment.id}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {payment.intasend_api_ref ? `Ref: ${payment.intasend_api_ref}` :
                          payment.bank_reference ? `Ref: ${payment.bank_reference}` : `Booking #${payment.booking_details?.id || 'N/A'}`}
                      </p>
                    </div>
                  </div>

                  {/* Center: Amount & Method */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {payment.payment_method?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status, Date, Actions */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {formatDate(payment.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      {payment.status === 'paid' && (
                        <button
                          onClick={() => handleViewReceipt(payment.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      )}
                      {payment.status === 'failed' && (
                        <button
                          onClick={() => handleRetryPayment(payment.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Methods Info */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 p-2.5 bg-green-50 rounded-xl">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mobile Money (IntaSend)</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Pay instantly via M-PESA through IntaSend's secure checkout page.
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex gap-3 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span>Fast and secure</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span>Instant confirmation</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span>Receipt provided</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 p-2.5 bg-violet-50 rounded-xl">
                <Banknote className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cash on Delivery</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Pay cash directly to the driver when service is completed.
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex gap-3 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                <span>Pay after service</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                <span>Get physical receipt</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                <span>Driver provides change</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Make Payment</h3>
                <p className="text-slate-500 mt-1 text-sm">
                  Complete payment for Booking #{paymentData.bookingId}
                </p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-3">
                  KES {paymentData.amount?.toLocaleString()}
                </p>
              </div>

              {/* Method Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6 gap-1">
                <button
                  onClick={() => setSelectedMethod('mobile_money')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${selectedMethod === 'mobile_money' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mobile Money
                </button>
                <button
                  onClick={() => setSelectedMethod('bank')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${selectedMethod === 'bank' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Bank Transfer
                </button>
                <button
                  onClick={() => setSelectedMethod('cash')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${selectedMethod === 'cash' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cash
                </button>
              </div>

              {selectedMethod === 'mobile_money' ? (
                <form onSubmit={handleInitiatePayment} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                      M-PESA Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        🇰🇪
                      </span>
                      <input
                        type="text"
                        id="phone"
                        required
                        placeholder="254712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processingPayment}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition ${processingPayment ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {processingPayment ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Pay with IntaSend'
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    You'll be redirected to IntaSend's secure checkout page.
                  </p>
                </form>
              ) : selectedMethod === 'bank' ? (
                <form onSubmit={handleBankTransfer} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-sm border border-gray-100">
                    <p className="font-bold text-slate-700">Bank Details:</p>
                    <p className="text-slate-600">KCB Bank | Paybill: 522522</p>
                    <p className="text-slate-600">Acc: 132470456 (CLIVE MISIKO MUTENDE)</p>
                  </div>
                  <div>
                    <label htmlFor="bankRef" className="block text-sm font-medium text-slate-700 mb-1">
                      Transaction Reference Code
                    </label>
                    <input
                      type="text"
                      id="bankRef"
                      required
                      placeholder="e.g. EBX-98234-JK"
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processingPayment}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition ${processingPayment ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {processingPayment ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Submit Reference'
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    Your payment will be verified by our team within 24 hours.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleCashPayment} className="space-y-4">
                  <div className="bg-violet-50 p-4 rounded-xl text-sm border border-violet-100">
                    <p className="font-bold text-violet-700">Cash Payment Details:</p>
                    <p className="text-violet-600 mt-2">Pay KES {paymentData.amount?.toLocaleString()} to the driver when they arrive.</p>
                    <p className="text-violet-600 text-xs mt-2">The driver will provide you with a receipt.</p>
                  </div>
                  <div>
                    <label htmlFor="cashNotes" className="block text-sm font-medium text-slate-700 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      id="cashNotes"
                      placeholder="e.g. I don't have exact change, need invoice, etc."
                      value={cashNotes}
                      onChange={(e) => setCashNotes(e.target.value)}
                      rows="3"
                      className="block w-full px-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processingPayment}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition ${processingPayment ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}
                  >
                    {processingPayment ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Cash Payment'
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    A receipt will be provided by the driver at service completion.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;