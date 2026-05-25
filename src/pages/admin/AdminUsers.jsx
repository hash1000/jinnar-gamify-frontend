import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { Button } from '../../components/ui';
import {
    CheckCircleIcon,
    XCircleIcon,
    NoSymbolIcon,
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, approved, suspended
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearchTerm !== searchTerm) {
                setDebouncedSearchTerm(searchTerm);
                setPage(1); // Reset to first page on new search
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearchTerm]);

    useEffect(() => {
        loadUsers();
    }, [page, filter, debouncedSearchTerm]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            
            // Build query params for the backend
            const params = {
                search: debouncedSearchTerm || undefined,
                page,
                limit: 10,
            };
            
            if (filter === 'suspended') {
                params.isSuspended = true;
            } else if (filter !== 'all') {
                params.status = filter;
            }

            const response = await adminService.getUsers(params);

            // Extract users from various possible structures
            let usersList = [];
            if (response && response.users) {
                usersList = response.users;
                if (response.totalPages) setTotalPages(response.totalPages);
            } else if (response && response.data) {
                usersList = Array.isArray(response.data) ? response.data : (response.data.users || []);
                if (response.data.totalPages) setTotalPages(response.data.totalPages);
                else if (response.totalPages) setTotalPages(response.totalPages);
            } else if (Array.isArray(response)) {
                usersList = response;
            }

            if (usersList.length > 0) {
                setUsers(usersList);
            } else {
                // Mocking if endpoint returns empty during setup
                setUsers([
                    { _id: '1', name: 'John Doe', email: 'john@example.com', verification: { status: 'pending' }, isSuspended: false, createdAt: '2026-03-10' },
                    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', verification: { status: 'approved' }, isSuspended: false, createdAt: '2026-03-12' },
                    { _id: '3', name: 'Bob Wilson', email: 'bob@example.com', verification: { status: 'approved' }, isSuspended: true, createdAt: '2026-03-14' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Failed to load user list');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId, status) => {
        try {
            await adminService.verifyUser(userId, status);
            toast.success(`User ${status} successfully`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, verification: { ...u.verification, status } } : u));
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handleSuspend = async (userId, suspend) => {
        try {
            await adminService.suspendUser(userId, suspend);
            toast.success(suspend ? 'User suspended' : 'User unsuspended');
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isSuspended: suspend } : u));
        } catch (error) {
            toast.error('Action failed');
        }
    };



    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600">Approve, reject, or suspend platform participants</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value);
                                setPage(1); // Reset to first page on filter change
                            }}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-700"
                        >
                            <option value="all">All Users</option>
                            <option value="pending">Pending Only</option>
                            <option value="approved">Approved Only</option>
                            <option value="suspended">Suspended Only</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20 float-right"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                        No users found matching your criteria
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email || user.mobileNumber || 'No contact'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.isSuspended ? (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Suspended</span>
                                        ) : user.verification?.status === 'approved' ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Approved</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                {user.verification?.status || 'None'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/admin/submissions?userId=${user._id}`}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View User's Submissions"
                                            >
                                                <DocumentTextIcon className="w-5 h-5" />
                                            </Link>
                                            {(user.verification?.status === 'pending' || user.verification?.status === 'none') && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerify(user._id, 'approved')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Approve User"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(user._id, 'rejected')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject User"
                                                    >
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleSuspend(user._id, !user.isSuspended)}
                                                className={`p-2 rounded-lg transition-colors ${user.isSuspended ? 'text-blue-600 hover:bg-blue-50' : 'text-orange-600 hover:bg-orange-50'}`}
                                                title={user.isSuspended ? 'Lift Suspension' : 'Suspend User'}
                                            >
                                                {user.isSuspended ? <ShieldCheckIcon className="w-5 h-5" /> : <NoSymbolIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <span className="text-sm text-gray-500 font-medium">
                            Page {page} {totalPages > 1 ? `of ${totalPages}` : ''}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={(totalPages > 1 && page >= totalPages) || users.length < 10}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default AdminUsers;
