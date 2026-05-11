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
    const [methodFilter, setMethodFilter] = useState('all'); // all, mobile_money, bank, cash
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
            p.intasend_api_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Payment Transactions</h1>
                        <p className="text-xs text-slate-500">Monitor and verify all system payments</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><DollarSign className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
                            <p className="text-lg font-black text-slate-900">KES {payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><Clock className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                            <p className="text-lg font-black text-slate-900">{payments.filter(p => p.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><CheckCircle2 className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Successful</p>
                            <p className="text-lg font-black text-slate-900">{payments.filter(p => p.status === 'paid').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Filters Bar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                        {['all', 'paid', 'pending', 'failed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === s ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'mobile_money', label: 'Mobile' },
                            { value: 'cash', label: 'Cash' }
                        ].map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMethodFilter(m.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${methodFilter === m.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search ref or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 flex justify-center"><Clock className="w-8 h-8 animate-spin text-emerald-600" /></div>
                    ) : filteredPayments.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Booking</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-800">#{p.id}</div>
                                            <div className="text-xs font-mono text-emerald-600 mt-0.5">
                                                {p.payment_method === 'mobile_money' ? p.intasend_api_ref : p.payment_method === 'cash' ? 'CASH' : p.bank_reference}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                            #{p.booking_details?.id} • {p.booking_details?.location}
                                        </td>
                                        <td className="px-6 py-4 capitalize">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${p.payment_method === 'mobile_money' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : p.payment_method === 'cash' ? 'border-violet-200 text-violet-700 bg-violet-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                                                {p.payment_method === 'mobile_money' ? 'Mobile' : p.payment_method === 'cash' ? 'Cash' : 'Bank'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">KES {Number(p.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${getStatusStyle(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.status === 'pending' && (p.payment_method === 'mobile_money' || p.payment_method === 'bank') && (
                                                <button
                                                    onClick={() => handleVerify(p.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            {p.status === 'pending' && p.payment_method === 'cash' && (
                                                <span className="text-[10px] bg-violet-50 text-violet-600 font-bold px-2.5 py-1 rounded-full">Awaiting</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-16 flex flex-col items-center text-center">
                            <AlertCircle className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-500 font-medium">No transactions found</p>
                            <p className="text-xs text-slate-400 mt-1">Try changing your filters or search term.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPayments;
