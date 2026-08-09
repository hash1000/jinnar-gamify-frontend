import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
    TrophyIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon,
    VideoCameraIcon,
    ChevronRightIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { useCurrency } from '../../contexts/CurrencyContext';

const AdminDashboard = () => {
    const { format } = useCurrency();
    const [stats, setStats] = useState({
        draws: 0,
        pendingSubmissions: 0,
        verifiedUsers: 0,
        totalRevenue: 0,
        pendingUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch stats from real endpoint
            const statsRes = await adminService.getStats().catch(() => ({ data: null }));
            const statsData = statsRes.data || {};

            // Fallback to manual aggregation if stats endpoint is empty/mock
            const [drawsRes, submissionsRes] = await Promise.all([
                adminService.getAllDraws(),
                adminService.getAllSubmissions()
            ]);

            const draws = drawsRes.data || [];
            const submissions = submissionsRes.data || [];

            setStats({
                draws: statsData.totalDraws || draws.length,
                pendingSubmissions: statsData.pendingSubmissions || submissions.filter(s => s.status === 'pending').length,
                verifiedUsers: statsData.verifiedUsers || 0, // Mock if missing
                totalRevenue: statsData.totalRevenue || 0, // Mock if missing
                pendingUsers: statsData.pendingUsers || 0
            });
        } catch (error) {
            console.error('Failed to load dashboard statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const adminSections = [
        {
            title: 'Global Finances',
            description: 'Track inflow, outflow and portal revenue logs',
            icon: <PresentationChartLineIcon className="w-8 h-8 text-indigo-600" />,
            link: '/admin/finances',
            color: 'bg-indigo-50',
            borderColor: 'border-indigo-200'
        },
        {
            title: 'User Management',
            description: 'Approve new participants or suspend accounts',
            icon: <UserGroupIcon className="w-8 h-8 text-blue-600" />,
            link: '/admin/users',
            color: 'bg-blue-50',
            borderColor: 'border-blue-200',
            badge: stats.pendingUsers > 0 ? `${stats.pendingUsers} Pending` : null
        },
        {
            title: 'Lucky Draws',
            description: 'Create and monitor active viral challenges',
            icon: <CalendarIcon className="w-8 h-8 text-purple-600" />,
            link: '/admin/draws',
            color: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            title: 'Review Queue',
            description: 'Approve or reject user video submissions',
            icon: <CheckCircleIcon className="w-8 h-8 text-green-600" />,
            link: '/admin/submissions',
            color: 'bg-green-50',
            borderColor: 'border-green-200',
            badge: stats.pendingSubmissions > 0 ? `${stats.pendingSubmissions} Videos` : null
        },
        {
            title: 'Draw Winners',
            description: 'Manage rewards for completed challenges',
            icon: <TrophyIcon className="w-8 h-8 text-yellow-600" />,
            link: '/admin/participants',
            color: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Command Center</h1>
                    <p className="text-gray-500 text-lg">Platform governance and oversight overview</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] opacity-50"></div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Financial Inflow</p>
                        <h3 className="text-3xl font-black text-gray-900">{loading ? '...' : format(stats.totalRevenue)}</h3>
                        <div className="mt-4 flex items-center text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                            ↑ 12.5% this month
                        </div>
                    </div>
                    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-bl-[4rem] opacity-50"></div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Verified Users</p>
                        <h3 className="text-3xl font-black text-gray-900">{loading ? '...' : stats.verifiedUsers}</h3>
                        <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-full">
                            Active Participants
                        </div>
                    </div>
                    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[4rem] opacity-50"></div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Pending Videos</p>
                        <h3 className={`text-3xl font-black ${stats.pendingSubmissions > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                            {loading ? '...' : stats.pendingSubmissions}
                        </h3>
                        {stats.pendingSubmissions > 0 && <div className="mt-4 animate-pulse w-2 h-2 bg-red-500 rounded-full inline-block"></div>}
                    </div>
                    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[4rem] opacity-50"></div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Active Draws</p>
                        <h3 className="text-3xl font-black text-gray-900">{loading ? '...' : stats.draws}</h3>
                        <div className="mt-4 text-xs text-gray-500">
                            Monitoring global reach
                        </div>
                    </div>
                </div>

                {/* Main Navigation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {adminSections.map((section, idx) => (
                        <Link
                            key={idx}
                            to={section.link}
                            className={`group p-8 rounded-[2.5rem] border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-white relative overflow-hidden flex flex-col justify-between h-72`}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${section.color}`}></div>

                            <div>
                                <div className={`mb-6 p-4 rounded-3xl shadow-sm inline-block ${section.color}`}>
                                    {section.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm font-medium">{section.description}</p>
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                {section.badge ? (
                                    <span className="bg-red-500 text-white px-4 py-1.5 rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-lg shadow-red-500/20">
                                        {section.badge}
                                    </span>
                                ) : (
                                    <div />
                                )}
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
                                    <ChevronRightIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-16 text-center text-gray-400 text-sm">
                    © 2026 Platform Authority • Restricted Internal System
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
