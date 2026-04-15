import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Download,
    AlertCircle
} from 'lucide-react';
import { paymentsAPI } from '../../api/payments';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/csvExport';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, paid, pending, failed
    const [methodFilter, setMethodFilter] = useState('all'); // all, mpesa, bank, cash
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const data = await paymentsAPI.getPayments();
            setPayments(data);
        } catch (error) {
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (paymentId) => {
        try {
            await paymentsAPI.verifyPayment({ payment_id: paymentId });
            toast.success("Payment verified");
            fetchPayments();
        } catch (error) {
            toast.error("Verification failed");
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesFilter = filter === 'all' || p.status === filter;
        const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
        const matchesSearch =
            p.booking_details?.id?.toString().includes(searchTerm) ||
            p.mpesa_receipt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.bank_reference?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesMethod && matchesSearch;
    });

    const handleExport = () => {
        if (filteredPayments.length === 0) {
            toast.error("No data to export");
            return;
        }
        exportToCSV(filteredPayments, 'usafilink_payments');
        toast.success("Exporting payments CSV...");
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Payment Transactions</h1>
                    <p className="text-sm text-gray-500 font-medium">Monitor and verify all system payments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><DollarSign /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Collected</p>
                            <p className="text-xl font-black text-gray-900">KES {payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-600"><Clock /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Verification</p>
                            <p className="text-xl font-black text-gray-900">{payments.filter(p => p.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-50 p-3 rounded-2xl text-green-600"><CheckCircle2 /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Succeful Payments</p>
                            <p className="text-xl font-black text-gray-900">{payments.filter(p => p.status === 'paid').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters Bar */}
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        {['all', 'paid', 'pending', 'failed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filter === s ? 'bg-slate-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        {[
                            { value: 'all', label: 'All Methods' },
                            { value: 'mpesa', label: 'M-PESA' },
                            { value: 'cash', label: 'Cash' }
                        ].map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMethodFilter(m.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${methodFilter === m.value ? 'bg-slate-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ref or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex justify-center"><Clock className="w-8 h-8 animate-spin text-emerald-600" /></div>
                    ) : filteredPayments.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Payment / Reference</th>
                                    <th className="px-8 py-5">Booking</th>
                                    <th className="px-8 py-5">Method</th>
                                    <th className="px-8 py-5">Amount</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-gray-800">PYMT-#{p.id}</div>
                                            <div className="text-xs font-mono text-emerald-500 mt-1">
                                                {p.payment_method === 'mpesa' ? p.mpesa_receipt : p.payment_method === 'cash' ? 'CASH' : p.bank_reference} || {p.payment_method === 'cash' && p.notes ? p.notes.substring(0, 30) + '...' : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs font-bold text-gray-500">
                                            #{p.booking_details?.id} • {p.booking_details?.location}
                                        </td>
                                        <td className="px-8 py-5 capitalize">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest border ${p.payment_method === 'mpesa' ? 'border-green-200 text-green-600 bg-green-50' : p.payment_method === 'cash' ? 'border-purple-200 text-purple-600 bg-purple-50' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}>
                                                {p.payment_method === 'mpesa' ? 'M-PESA' : p.payment_method === 'cash' ? 'CASH' : 'BANK'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-black text-gray-900">KES {Number(p.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {p.status === 'pending' && (p.payment_method === 'mpesa' || p.payment_method === 'bank') && (
                                                <button
                                                    onClick={() => handleVerify(p.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all flex items-center gap-2 ml-auto"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            {p.status === 'pending' && p.payment_method === 'cash' && (
                                                <span className="text-[10px] bg-purple-50 text-purple-600 font-black px-3 py-1 rounded-full uppercase tracking-tighter">Awaiting Driver</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 flex flex-col items-center text-center">
                            <AlertCircle className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="text-gray-500 font-bold">No transactions found</p>
                            <p className="text-xs text-gray-400 mt-1">Try changing your filters or search term.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPayments;
