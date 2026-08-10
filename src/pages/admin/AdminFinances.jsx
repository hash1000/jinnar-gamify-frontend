import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
    BanknotesIcon,
    ArrowUpCircleIcon,
    ArrowDownCircleIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

const AdminFinances = () => {
    const { format } = useCurrency();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totals, setTotals] = useState({
        inflow: 0,
        outflow: 0,
        balance: 0
    });

    useEffect(() => {
        loadFinancialData();
    }, [page]);

    const loadFinancialData = async () => {
        try {
            setLoading(true);
            const response = await adminService.getFinancialLogs(page, 10) || {};

            // Extract logs from 'data' field
            const rawLogsData = response.data || (Array.isArray(response) ? response : []);

            if (rawLogsData.length > 0) {
                // Map API response fields to component's expected log structure
                const mappedLogs = rawLogsData.map(log => ({
                    id: log._id,
                    type: log.type === 'deposit' ? 'inflow' : 'outflow', // Map 'deposit' to 'inflow', 'withdrawal' to 'outflow'
                    amount: log.amount,
                    description: log.description,
                    userName: log.userId?.name || 'Unknown',
                    userEmail: log.userId?.email || log.userId?.mobileNumber || '',
                    date: new Date(log.createdAt).toLocaleString(), // Map 'createdAt' to 'date'
                    reference: log.pawapayDepositId || log.pawapayPayoutId || 'N/A' // Map specific IDs to 'reference'
                }));
                setLogs(mappedLogs);

                // Calculate basic totals from the current view if API doesn't provide summary stats
                const inflow = rawLogsData
                    .filter(l => l.type === 'deposit')
                    .reduce((sum, l) => sum + (l.amount || 0), 0);
                const outflow = rawLogsData
                    .filter(l => l.type === 'withdrawal')
                    .reduce((sum, l) => sum + (l.amount || 0), 0);

                setTotals({
                    inflow: response.totalInflow || inflow,
                    outflow: response.totalOutflow || outflow,
                    balance: (response.totalInflow || inflow) - (response.totalOutflow || outflow)
                });
            } else {
                // Mock data as fallback for empty state
                const mockLogs = [];
                setLogs(mockLogs);
                setTotals({ inflow: 0, outflow: 0, balance: 0 });
            }
        } catch (error) {
            console.error('Failed to load financial logs:', error);
            toast.error('Unable to fetch financial data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Financial Insights</h1>
                        <p className="text-gray-600">Monitor cash flow, payouts, and platform revenue</p>
                    </div>
                    <button
                        onClick={loadFinancialData}
                        className="w-fit p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowPathIcon className={`w-6 h-6 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                                <ArrowUpCircleIcon className="w-6 h-6" />
                            </div>
                            <span className="text-gray-500 font-medium">Total Inflow</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{format(totals.inflow)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                                <ArrowDownCircleIcon className="w-6 h-6" />
                            </div>
                            <span className="text-gray-500 font-medium">Total Outflow</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{format(totals.outflow)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <BanknotesIcon className="w-6 h-6" />
                            </div>
                            <span className="text-white/80 font-medium">Available Balance</span>
                        </div>
                        <h3 className="text-3xl font-bold">{format(totals.balance)}</h3>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase">Live Logs</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Transaction</th>
                                    <th className="px-8 py-4">Type</th>
                                    <th className="px-8 py-4 text-right">Amount</th>
                                    <th className="px-8 py-4">Reference</th>
                                    <th className="px-8 py-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && logs.length === 0 ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-6 bg-gray-50/50"></td>
                                        </tr>
                                    ))
                                ) : logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{log.description}</div>
                                                    <div className="text-xs text-gray-400">User: {log.userName} ({log.userEmail})</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {log.type === 'inflow' ? (
                                                <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                                                    <ArrowUpCircleIcon className="w-4 h-4" />
                                                    Credit
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                                                    <ArrowDownCircleIcon className="w-4 h-4" />
                                                    Debit
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-8 py-5 text-right font-bold ${log.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.type === 'inflow' ? '+' : '-'}{format(log.amount)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">{log.reference}</span>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-500 italic">
                                            {log.date}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 md:px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                        <span className="text-sm text-gray-500 order-2 sm:order-1">Showing page {page}</span>
                        <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex-1 sm:flex-none px-6 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium text-gray-700 bg-white"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="flex-1 sm:flex-none px-6 py-2 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all font-medium text-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFinances;
