import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import viralService from '../../services/viralService';
import { useToast } from '../../contexts/ToastContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const AdminDraws = () => {
    const toast = useToast();
    const { format } = useCurrency();
    const [draws, setDraws] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, active, upcoming, completed
    const [error, setError] = useState(null);
    const [expandedHashtags, setExpandedHashtags] = useState({});
    const [overflowingHashtags, setOverflowingHashtags] = useState({});
    const hashtagRefs = React.useRef({});

    const toggleHashtags = (drawId) => {
        setExpandedHashtags(prev => ({ ...prev, [drawId]: !prev[drawId] }));
    };

    useEffect(() => {
        const nextOverflow = {};
        Object.entries(hashtagRefs.current).forEach(([drawId, el]) => {
            if (el) nextOverflow[drawId] = el.scrollWidth > el.clientWidth;
        });
        setOverflowingHashtags(nextOverflow);
    }, [draws]);

    useEffect(() => {
        fetchDraws();
    }, []);

    const fetchDraws = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getAllDraws();

            if (response.success) {
                setDraws(response.data || []);
            } else {
                setError('Failed to fetch draws');
            }
        } catch (err) {
            console.error('Error fetching draws:', err);
            setError(err.message || 'Failed to load draws');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDraw = async (drawId) => {
        if (!confirm('Are you sure you want to close this draw? No further submissions will be allowed.')) return;

        try {
            await adminService.closeDraw(drawId);
            await fetchDraws(); // Reload draws
        } catch (error) {
            console.error('Failed to close draw:', error);
            toast.error('Failed to close draw');
        }
    };

    const handleArchiveDraw = async (drawId) => {
        if (!confirm('Archive this draw?')) return;

        try {
            await viralService.archiveDraw(drawId);
            await fetchDraws();
        } catch (error) {
            console.error('Failed to archive draw:', error);
            toast.error('Failed to archive draw');
        }
    };

    const handleUnarchiveDraw = async (drawId) => {
        if (!confirm('Restore this draw from archive?')) return;

        try {
            await viralService.unarchiveDraw(drawId);
            await fetchDraws();
        } catch (error) {
            console.error('Failed to unarchive draw:', error);
            toast.error('Failed to unarchive draw');
        }
    };

    // Filter draws based on active tab
    const filteredDraws = draws.filter(draw => {
        if (activeTab === 'all') return true;
        return draw.status === activeTab;
    });

    // Get status badge styling
    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-green-100 text-green-800 border-green-200',
            upcoming: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            closed: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return badges[status] || badges.completed;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel - Draw Management</h1>
                            <p className="text-gray-600">Create, edit, and manage lucky draws for the Jinnar Viral Challenge</p>
                        </div>
                        <Link to="/admin/draws/create" className="w-full md:w-auto">
                            <button className="w-full md:w-auto bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2">
                                <span className="text-xl">+</span>
                                Create New Draw
                            </button>
                        </Link>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-hide">
                        {['all', 'active', 'upcoming', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 font-semibold text-sm capitalize transition-colors ${activeTab === tab
                                    ? 'border-b-2 border-blue-800 text-blue-800'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab}
                                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                    {tab === 'all' ? draws.length : draws.filter(d => d.status === tab).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
                        <p className="mt-4 text-gray-600">Loading draws...</p>
                    </div>
                ) : filteredDraws.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Draws Found</h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'all'
                                ? 'Get started by creating your first lucky draw'
                                : `No ${activeTab} draws at the moment`
                            }
                        </p>
                        {activeTab === 'all' && (
                            <Link to="/admin/draws/create">
                                <button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                                    Create Your First Draw
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Draws Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDraws.map((draw) => (
                            <div key={draw._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg">{draw.title}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(draw.status)}`}>
                                            {draw.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-blue-100">{draw.theme}</p>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    {/* Hashtags */}
                                    <div>
                                        <div
                                            ref={(el) => { hashtagRefs.current[draw._id] = el; }}
                                            className={`flex gap-1 w-full ${expandedHashtags[draw._id] ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}
                                        >
                                            {draw.hashtags && draw.hashtags.map((tag, idx) => (
                                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        {overflowingHashtags[draw._id] && (
                                            <button
                                                onClick={() => toggleHashtags(draw._id)}
                                                className="text-xs text-blue-800 font-semibold hover:underline mt-1"
                                            >
                                                {expandedHashtags[draw._id] ? 'Show less' : 'Read more'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Draw Info */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Prize Pool:</span>
                                            <span className="font-bold text-gray-900">{format(draw.prizePool)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Start:</span>
                                            <span className="text-gray-900">{formatDate(draw.startDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">End:</span>
                                            <span className="text-gray-900">{formatDate(draw.endDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created:</span>
                                            <span className="text-gray-900">{formatDate(draw.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-gray-100 space-y-2">
                                        <Link to={`/admin/submissions?drawId=${draw._id}`} className="block">
                                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm">
                                                👀 View Submissions
                                            </button>
                                        </Link>
                                        <Link to={`/admin/draws/edit/${draw._id}`} className="block">
                                            <button className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 px-4 rounded transition-colors text-sm">
                                                ✏️ Edit Draw
                                            </button>
                                        </Link>
                                        <Link to={`/admin/draws/${draw._id}/rewards`} className="block">
                                            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded transition-colors text-sm">
                                                🏆 Manage Rewards
                                            </button>
                                        </Link>
                                        {/* Lifecycle Actions */}
                                        {draw.status === 'active' && (
                                            <button
                                                onClick={() => handleCloseDraw(draw._id)}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                                            >
                                                ⏹️ Close Draw
                                            </button>
                                        )}
                                        {(draw.status === 'completed' || draw.status === 'closed') && !draw.archived && (
                                            <button
                                                onClick={() => handleArchiveDraw(draw._id)}
                                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                                            >
                                                📦 Archive
                                            </button>
                                        )}
                                        {draw.archived && (
                                            <button
                                                onClick={() => handleUnarchiveDraw(draw._id)}
                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                                            >
                                                📤 Unarchive
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminDraws;
