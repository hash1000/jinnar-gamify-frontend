import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import viralService from '../services/viralService';

const Leaderboards = () => {
    // State
    const [availableDraws, setAvailableDraws] = useState([]);
    const [selectedDraw, setSelectedDraw] = useState(null);
    const [viewType, setViewType] = useState('current'); // current, all-time
    const [filterType, setFilterType] = useState('global'); // global, country, city
    const [searchUsername, setSearchUsername] = useState('');

    // Data State
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingRank, setLoadingRank] = useState(false);

    // Initial Load: Fetch Draws
    useEffect(() => {
        const fetchDraws = async () => {
            try {
                // Fetch active and closed draws in parallel
                const [activeRes, closedRes] = await Promise.all([
                    viralService.getActiveDraws(),
                    viralService.getClosedDraws()
                ]);

                let allDraws = [];
                if (activeRes.success) allDraws = [...allDraws, ...activeRes.data];
                // Handle closed draws - API might return { success: true, data: [] } or just array if using helper directly, 
                // but checking success pattern as per other calls.
                // Actually my helper returns response.data directly.
                // Let's assume response structure is consistent { success, data }.
                if (closedRes && (closedRes.success || Array.isArray(closedRes))) {
                    const closedData = closedRes.success ? closedRes.data : closedRes;
                    if (Array.isArray(closedData)) {
                        allDraws = [...allDraws, ...closedData];
                    }
                }

                if (allDraws.length > 0) {
                    setAvailableDraws(allDraws);
                    // Default to the first active draw, or first available if no active
                    const firstActive = allDraws.find(d => d.status === 'active');
                    setSelectedDraw(firstActive ? firstActive._id : allDraws[0]._id);
                }
            } catch (error) {
                console.error('Error fetching draws:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDraws();
    }, []);

    // Fetch Leaderboard & Rank when dependencies change
    useEffect(() => {
        if (!selectedDraw) return;

        const fetchData = async () => {
            setLoading(true);
            setLoadingRank(true);
            try {
                // 1. Fetch Leaderboard
                // The API currently supports drawId and scope. viewType (current/all-time) is not fully supported yet but we'll include it in logic effectively.
                const leaderboardRes = await viralService.getLeaderboard(selectedDraw, filterType);
                if (leaderboardRes.success) {
                    setLeaderboard(leaderboardRes.data);
                }

                // 2. Fetch User Rank
                const rankRes = await viralService.getMyRank(selectedDraw);
                if (rankRes.success) {
                    setUserRank(rankRes.data);
                }

            } catch (error) {
                console.error('Error fetching leaderboard data:', error);
            } finally {
                setLoading(false);
                setLoadingRank(false);
            }
        };

        fetchData();
    }, [selectedDraw, filterType, viewType]);

    // Helper to get draw name
    const getSelectedDrawName = () => {
        const draw = availableDraws.find(d => d._id === selectedDraw);
        return draw ? draw.title : 'Loading...';
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-8 sm:py-12 px-4 sm:px-6 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10 hidden sm:block">
                    <div className="absolute top-10 right-20 text-6xl">🏆</div>
                    <div className="absolute top-20 left-10 text-5xl">👑</div>
                    <div className="absolute bottom-10 right-1/4 text-4xl">⭐</div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Jinnar Viral Leaderboard</h1>
                            <p className="text-base sm:text-lg mb-5 sm:mb-6 opacity-90">
                                See who's leading each Draw — globally, by country, and by city.
                            </p>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                <Link to="/challenge" className="w-full sm:w-auto">
                                    <button className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 px-6 rounded-md transition-colors">
                                        View Active Challenges
                                    </button>
                                </Link>
                                <Link to="/upload" className="w-full sm:w-auto">
                                    <button className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-6 rounded-md transition-colors flex items-center justify-center gap-2">
                                        Upload Video for Approval
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </Link>
                            </div>
                        </div>
                        {/* Top 3 Preview */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-5">
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 flex-shrink-0">
                                    <span>🏆</span> Top Creators
                                </h4>
                                <span className="text-xs text-blue-200 truncate text-right" title={viewType === 'current' ? getSelectedDrawName() : 'All-Time'}>
                                    {viewType === 'current' ? getSelectedDrawName() : 'All-Time'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-4 gap-2 sm:gap-3 text-xs text-blue-200 pb-2 border-b border-white/20">
                                    <div>Rank</div>
                                    <div className="col-span-2">Creator</div>
                                    <div className="text-right">Points</div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-4 text-blue-200 text-sm">Loading leaders...</div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="text-center py-4 text-blue-200 text-sm">
                                        No rankings available yet.
                                    </div>
                                ) : (
                                    leaderboard.slice(0, 3).map((entry, index) => (
                                        <div key={entry.userId || index} className="grid grid-cols-4 gap-2 sm:gap-3 items-center text-sm">
                                            <div className="font-bold flex items-center gap-1">
                                                #{entry.rank || index + 1}
                                                {index === 0 && <span>👑</span>}
                                            </div>
                                            <div className="col-span-2 flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {entry.name ? entry.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="truncate">{entry.name || 'Anonymous'}</span>
                                            </div>
                                            <div className="text-right font-bold">{entry.totalPoints?.toLocaleString() || 0}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* Filters Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <div className="flex gap-3 items-center flex-wrap">
                        {/* Draw Selector */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-red-500 text-xl flex-shrink-0">🔥</span>
                            <select
                                value={selectedDraw || ''}
                                onChange={(e) => setSelectedDraw(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm font-medium min-w-0 max-w-[180px] sm:max-w-none"
                                disabled={availableDraws.length === 0}
                            >
                                {availableDraws.length === 0 && <option>Loading draws...</option>}
                                {availableDraws.map((draw) => (
                                    <option key={draw._id} value={draw._id}>
                                        {draw.title} ({draw.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Buttons */}
                        {['global', 'country', 'city'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${filterType === type ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}

                        {/* View Type - Note: API currently defaults to current draw, but UI kept for future support */}
                        <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

                        <button
                            onClick={() => setViewType('current')}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewType === 'current' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Current Draw
                        </button>
                        <button
                            onClick={() => setViewType('all-time')}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewType === 'all-time' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All-Time
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full lg:w-64">
                        <input
                            type="text"
                            placeholder="Search by username"
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            className="border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm w-full"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 sm:gap-6">

                    {/* Left Column - Leaderboard Table */}
                    <div className="md:col-span-2">

                        {/* Top 3 Creators */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span>🏆</span> Top Creators
                                </h2>
                                <div className="flex gap-2 min-w-0">
                                    <span className="text-sm text-gray-600 truncate">{viewType === 'current' ? getSelectedDrawName() : 'All-Time'}</span>
                                </div>
                            </div>

                            {/* Leaderboard Table */}
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="w-full min-w-[420px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">Rank</th>
                                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">Creator</th>
                                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">Points</th>
                                            {/* Additional columns can be added when API supports them */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                                    Loading leaderboard...
                                                </td>
                                            </tr>
                                        ) : leaderboard.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                                    No rankings available yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            leaderboard.map((entry, index) => (
                                                <tr key={entry.userId || index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <span className={`font-bold ${index < 3 ? 'text-blue-600 text-lg' : 'text-gray-700'}`}>
                                                            #{entry.rank || index + 1}
                                                        </span>
                                                        {index === 0 && <span className="ml-2">👑</span>}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                                                                {entry.name ? entry.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span className="font-medium text-gray-900 truncate">{entry.name || 'Anonymous'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                                                        {entry.totalPoints?.toLocaleString() || 0}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Note: Top Videos section hidden until API is available */}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">

                        {/* Your Position */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Your Position</h3>

                            {loadingRank ? (
                                <div className="text-center py-4 text-gray-500">Loading rank...</div>
                            ) : userRank ? (
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-4">
                                    <div className="text-sm text-gray-600 mb-1">{getSelectedDrawName()}</div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="text-4xl">🏆</div>
                                        <div className="text-4xl font-bold text-gray-900">#{userRank.globalRank || '-'}</div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Points:</span>
                                            <span className="font-semibold">{userRank.totalPoints?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                    Please log in to see your rank.
                                </div>
                            )}

                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Change Draw</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {availableDraws.map((draw) => (
                                        <button
                                            key={draw._id}
                                            onClick={() => setSelectedDraw(draw._id)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedDraw === draw._id
                                                ? 'bg-blue-800 text-white font-semibold'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {draw.title}
                                            {selectedDraw === draw._id && <span className="float-right">›</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Guidelines Info */}
                        <div className="bg-blue-50 rounded-lg shadow-sm p-4 sm:p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Fair Play Policy</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                Rankings are updated in real-time. We use AI and human review to ensure all points are earned legitimately.
                            </p>
                            <Link to="/rules">
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    View Rules
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Leaderboards;
