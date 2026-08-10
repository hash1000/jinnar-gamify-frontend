import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/userSlice';
import viralService from '../services/viralService';
import { formatDate } from '../utils/format';

const UserDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);

    // State for API data
    const [stats, setStats] = useState({
        totalPoints: 0,
        globalRank: '-',
        countryRank: '-',
        videosSubmitted: 0,
        videosApproved: 0,
        activeDraws: 0
    });
    const [submissions, setSubmissions] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [activeDraw, setActiveDraw] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/home');
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Active Draw (needed for rank)
                const drawsResponse = await viralService.getActiveDraws();
                const currentDraw = drawsResponse.success && drawsResponse.data.length > 0 ? drawsResponse.data[0] : null;
                setActiveDraw(currentDraw);

                // 2. Parallel Fetch: Points, Submissions, Rewards
                const [pointsRes, submissionsRes, rewardsRes] = await Promise.all([
                    viralService.getMyPoints(),
                    viralService.getMySubmissions(),
                    viralService.getMyRewards()
                ]);

                // 3. Fetch Rank (dependent on Active Draw)
                let rankData = { globalRank: '-', countryRank: '-' };
                if (currentDraw) {
                    try {
                        const rankRes = await viralService.getMyRank(currentDraw._id);
                        if (rankRes.success) {
                            rankData = {
                                globalRank: rankRes.data.globalRank || '-',
                                countryRank: rankRes.data.countryRank || '-'
                            };
                        }
                    } catch (err) {
                        console.warn('Could not fetch rank', err);
                    }
                }

                // Update State
                if (pointsRes.success) {
                    setStats(prev => ({ ...prev, totalPoints: pointsRes.data.totalPoints || 0 }));
                }

                if (submissionsRes.success) {
                    setSubmissions(submissionsRes.data);
                    // Calculate submission stats
                    const approved = submissionsRes.data.filter(s => s.status === 'approved').length;
                    setStats(prev => ({
                        ...prev,
                        videosSubmitted: submissionsRes.data.length,
                        videosApproved: approved,
                        activeDraws: currentDraw ? 1 : 0,
                        ...rankData
                    }));
                }

                if (rewardsRes.success) {
                    setRewards(rewardsRes.data);
                }

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Derive Recent Activity from Submissions (sorted by date)
    const recentActivity = submissions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5) // Last 5 activities
        .map(sub => ({
            type: sub.status,
            title: sub.status === 'approved' ? 'Video Approved' :
                sub.status === 'rejected' ? 'Video Rejected' : 'Video Under Review',
            description: `"${sub.title}" - ${formatDate(sub.createdAt)}`,
            icon: sub.status === 'approved' ? 'check' :
                sub.status === 'rejected' ? 'x' : 'clock' // Using simple mapping
        }));

    // Helper functions for UI
    const getCountryFlag = (country) => {
        const flags = {
            'Kenya': '🇰🇪', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬',
            'Rwanda': '🇷🇼', 'Ethiopia': '🇪🇹', 'Nigeria': '🇳🇬',
            'Ghana': '🇬🇭', 'South Africa': '🇿🇦'
        };
        return flags[country] || '🌍';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
                <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">

                    {/* Left Sidebar - Profile Card */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:sticky lg:top-24">
                            <div className="text-center mb-6">
                                <div className="relative inline-block mb-4">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-blue-100">
                                        <span className="text-3xl sm:text-4xl">{getCountryFlag(user?.country)}</span>
                                    </div>
                                    {user?.verified && (
                                        <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name || 'User'}</h2>
                                {user?.email && <p className="text-gray-600 text-sm truncate">{user.email}</p>}
                                {(user?.city || user?.country) && (
                                    <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
                                        <span className="text-lg">{getCountryFlag(user?.country)}</span>
                                        <span className="truncate">{[user?.city, user?.country].filter(Boolean).join(', ')}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 mb-1">Total Points</p>
                                    <p className="text-2xl font-bold text-blue-700">{stats.totalPoints.toLocaleString()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-yellow-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 mb-1">Global Rank</p>
                                        <p className="text-lg font-bold text-yellow-700">#{stats.globalRank}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-600 mb-1">Country Rank</p>
                                        <p className="text-lg font-bold text-green-700">#{stats.countryRank}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Link to="/settings">
                                    <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2">
                                        Settings
                                    </button>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9">

                        {/* Stats Overview Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.videosSubmitted}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600">Videos Submitted</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.videosApproved}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeDraws}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600">Active Draws</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{rewards.length}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600">Rewards Earned</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-md mb-6">
                            <div className="border-b">
                                <div className="flex gap-1 p-2 flex-wrap">
                                    {['overview', 'submissions', 'rewards'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors ${activeTab === tab
                                                ? 'bg-blue-800 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 sm:p-6">

                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <Link to="/upload">
                                                    <button className="w-full p-4 bg-gradient-to-r from-blue-800 to-teal-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-3">
                                                        <div className="text-left">
                                                            <p className="font-bold">Upload New Video</p>
                                                            <p className="text-sm text-blue-100">Submit for approval</p>
                                                        </div>
                                                    </button>
                                                </Link>
                                                <Link to="/submit-link">
                                                    <button className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-3">
                                                        <div className="text-left">
                                                            <p className="font-bold">Submit Post Link</p>
                                                            <p className="text-sm text-purple-100">Track your engagement</p>
                                                        </div>
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>

                                        {activeDraw && (
                                            <div>
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Current Draw Status</h3>
                                                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3 min-w-0">
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-lg font-bold text-gray-900 truncate">{activeDraw.title}</h4>
                                                            <p className="text-sm text-gray-600">Ends: {formatDate(activeDraw.endDate)}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold flex-shrink-0">Active</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                                                            <p className="text-xl sm:text-2xl font-bold text-blue-700">#{stats.globalRank}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600 mb-1">Points Earned</p>
                                                            <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.totalPoints.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <Link to="/leaderboards">
                                                        <button className="w-full py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold transition-colors">
                                                            View Full Leaderboard
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                                            {recentActivity.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recentActivity.map((activity, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                            {/* Simple Icons based on type */}
                                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${activity.type === 'approved' ? 'bg-green-100 text-green-600' :
                                                                activity.type === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                                                }`}>
                                                                {activity.type === 'approved' ? '✓' : activity.type === 'rejected' ? '✗' : '⏱'}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-gray-900">{activity.title}</p>
                                                                <p className="text-sm text-gray-600">{activity.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500">No recent activity found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Submissions Tab */}
                                {activeTab === 'submissions' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">My Video Submissions</h3>
                                            <Link to="/upload">
                                                <button className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-sm sm:text-base font-semibold transition-colors">
                                                    Upload New Video
                                                </button>
                                            </Link>
                                        </div>

                                        {submissions.length > 0 ? (
                                            <div className="space-y-4">
                                                {submissions.map(video => (
                                                    <div key={video._id} className="bg-gray-50 rounded-xl p-3 sm:p-4 border-l-4 border-blue-500">
                                                        <div className="flex gap-4 flex-wrap">
                                                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg w-24 h-20 sm:w-32 sm:h-24 flex items-center justify-center flex-shrink-0">
                                                                {/* Use video thumbnail if available, else placeholder */}
                                                                <span className="text-gray-400 text-xs text-center p-1">
                                                                    {video.videoUrl ? 'Video' : 'No Media'}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">{video.title}</h4>
                                                                        <p className="text-xs text-gray-500 truncate">ID: {video._id}</p>
                                                                    </div>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${video.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                        video.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {video.status === 'approved' ? '✓ Approved' :
                                                                            video.status === 'pending' ? '⏳ Pending' :
                                                                                '✗ Rejected'}
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                                    <div>
                                                                        <p className="text-xs text-gray-600">Submitted</p>
                                                                        <p className="text-sm font-semibold text-gray-900">{formatDate(video.createdAt)}</p>
                                                                    </div>
                                                                    <div>
                                                                        {/* Points might be aggregated or specific to video depending on backend, using placeholder logic for now if not in video object */}
                                                                        <p className="text-xs text-gray-600">Points</p>
                                                                        <p className="text-sm font-semibold text-blue-700">{(video.points || 0).toLocaleString()}</p>
                                                                    </div>
                                                                </div>

                                                                {video.feedback && (
                                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                                                        <p className="text-sm text-red-800"><strong>Feedback:</strong> {video.feedback}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                You haven't uploaded any videos yet.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rewards Tab */}
                                {activeTab === 'rewards' && (
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">My Rewards & Achievements</h3>

                                        {rewards.length > 0 ? (
                                            <div className="space-y-4">
                                                {rewards.map((reward, idx) => (
                                                    <div key={idx} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 border-2 border-yellow-200">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white text-lg sm:text-xl">🏆</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">{reward.drawId?.title || 'Competition'} Winner</h4>
                                                                <p className="text-gray-700 text-sm sm:text-base">Rank: #{reward.rank} • {reward.rewardType}: {reward.amount}</p>
                                                                <p className="text-sm text-gray-600">Status: {reward.status}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                </svg>
                                                <p className="text-gray-600">No rewards yet. Keep creating great content!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default UserDashboard;
