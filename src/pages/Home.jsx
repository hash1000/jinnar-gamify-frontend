import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import viralService from '../services/viralService';
import { useToast } from '../contexts/ToastContext';
import homeData from '../data/home'; // Keep for fallback data (rules, status indicators)
import { useCurrency } from '../contexts/CurrencyContext';
import { resolveMediaUrl } from '../utils/format';

const Home = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { isAuthenticated } = useSelector((state) => state.user);
    const { format } = useCurrency();
    // UI State
    const [activeTab, setActiveTab] = useState('weekly');
    const [uploadFile, setUploadFile] = useState(null);

    // API Data State
    const [draws, setDraws] = useState([]);
    const [activeDrawId, setActiveDrawId] = useState(null);
    const [leaderboardWeekly, setLeaderboardWeekly] = useState([]);
    const [leaderboardMonthly, setLeaderboardMonthly] = useState([]);
    const [regionalLeaderboard, setRegionalLeaderboard] = useState([]);
    const [latestWinners, setLatestWinners] = useState(null);
    const [featuredVideos, setFeaturedVideos] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [stats, setStats] = useState({
        videosSubmitted: 0,
        countriesParticipating: 0,
        totalVideosEarned: 0
    });

    // Loading States
    const [loading, setLoading] = useState({
        draws: true,
        leaderboard: true,
        winners: true,
        submissions: true
    });

    // Countdown State
    const [countdown, setCountdown] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // Fetch active draws and set up data
    useEffect(() => {
        const fetchDraws = async () => {
            try {
                const response = await viralService.getActiveDraws();
                if (response.success && response.data.length > 0) {
                    setDraws(response.data);
                    // Set the first active draw as the main draw
                    const mainDraw = response.data[0];
                    setActiveDrawId(mainDraw._id);

                    // Calculate countdown to draw end date
                    calculateCountdown(mainDraw.endDate);
                }
            } catch (error) {
                console.error('Error fetching draws:', error);
            } finally {
                setLoading(prev => ({ ...prev, draws: false }));
            }
        };

        fetchDraws();
    }, []);

    // Fetch leaderboard data when active draw is set
    useEffect(() => {
        if (!activeDrawId) return;

        const fetchLeaderboards = async () => {
            try {
                // Fetch both weekly and monthly leaderboards
                // Note: Using the same draw for both, adjust if you have separate weekly/monthly draws
                const [weeklyResponse, monthlyResponse, regionalResponse] = await Promise.all([
                    viralService.getGlobalLeaderboard(activeDrawId, 10),
                    viralService.getGlobalLeaderboard(activeDrawId, 10),
                    viralService.getCountryLeaderboard(activeDrawId, 3)
                ]);

                if (weeklyResponse.success) {
                    setLeaderboardWeekly(weeklyResponse.data);
                    // Use top 3 from leaderboard as featured videos
                    setFeaturedVideos(weeklyResponse.data.slice(0, 3));
                }
                if (monthlyResponse.success) {
                    setLeaderboardMonthly(monthlyResponse.data);
                }
                if (regionalResponse.success) {
                    setRegionalLeaderboard(regionalResponse.data);
                }
            } catch (error) {
                console.error('Error fetching leaderboards:', error);
            } finally {
                setLoading(prev => ({ ...prev, leaderboard: false }));
            }
        };

        fetchLeaderboards();
    }, [activeDrawId]);

    // Fetch latest winners
    useEffect(() => {
        const fetchWinners = async () => {
            try {
                // Get completed draws first
                const completedDrawsResponse = await viralService.getCompletedDraws();
                if (completedDrawsResponse.success && completedDrawsResponse.data.length > 0) {
                    const latestCompletedDraw = completedDrawsResponse.data[0];
                    const winnersResponse = await viralService.getDrawWinners(latestCompletedDraw._id);

                    if (winnersResponse.success) {
                        setLatestWinners({
                            drawName: latestCompletedDraw.title,
                            winners: winnersResponse.data.slice(0, 3) // Top 3 winners
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching winners:', error);
            } finally {
                setLoading(prev => ({ ...prev, winners: false }));
            }
        };

        fetchWinners();
    }, []);

    // Fetch user submissions
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchSubmissions = async () => {
            try {
                const response = await viralService.getMySubmissions();
                if (response.success) {
                    setMySubmissions(response.data);
                }
            } catch (error) {
                console.error('Error fetching submissions:', error);
            } finally {
                setLoading(prev => ({ ...prev, submissions: false }));
            }
        };

        fetchSubmissions();
    }, [isAuthenticated]);

    // Calculate countdown to a target date
    const calculateCountdown = (targetDate) => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance > 0) {
                setCountdown({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    };

    // Countdown timer
    useEffect(() => {
        if (!draws.length) return;

        const mainDraw = draws[0];
        if (mainDraw && mainDraw.endDate) {
            return calculateCountdown(mainDraw.endDate);
        }
    }, [draws]);

    // Handle file selection
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadFile(file);
            console.log('File selected:', file.name);
        }
    };

    // Handle video upload submission
    const handleVideoSubmit = async () => {
        if (!uploadFile || !activeDrawId) {
            toast.warning('Please select a video file and ensure a draw is active');
            return;
        }

        try {
            const response = await viralService.uploadVideo(uploadFile, activeDrawId, uploadFile.name);
            if (response.success) {
                toast.success('Video uploaded successfully! It will be reviewed shortly.');
                setUploadFile(null);
                // Refresh submissions
                const submissionsResponse = await viralService.getMySubmissions();
                if (submissionsResponse.success) {
                    setMySubmissions(submissionsResponse.data);
                }
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            toast.error('Failed to upload video. Please try again.');
        }
    };

    // Get current leaderboard based on active tab
    const currentLeaderboard = activeTab === 'weekly' ? leaderboardWeekly : leaderboardMonthly;

    // Map API data to display format
    const mapLeaderboardEntry = (entry) => ({
        rank: entry.rank,
        name: entry.name || entry.userId?.name || 'Anonymous',
        country: entry.country || entry.userId?.country || 'Unknown',
        flag: getCountryFlag(entry.country || entry.userId?.country),
        points: entry.totalPoints || entry.points || 0,
        avatar: entry.profilePicture || entry.userId?.profilePicture || null
    });

    // Helper to get country flag emoji
    const getCountryFlag = (country) => {
        const flags = {
            'Kenya': '🇰🇪',
            'Tanzania': '🇹🇿',
            'Uganda': '🇺🇬',
            'Rwanda': '🇷🇼',
            'Ethiopia': '🇪🇹',
            'Nigeria': '🇳🇬',
            'Ghana': '🇬🇭',
            'South Africa': '🇿🇦'
        };
        return flags[country] || '🌍';
    };

    // Map winners data
    const mapWinner = (winner) => ({
        rank: winner.rank,
        name: winner.winnerUserId?.name || 'Anonymous',
        country: winner.winnerUserId?.country || 'Unknown',
        flag: getCountryFlag(winner.winnerUserId?.country),
        points: winner.amount || 0,
        totalPoints: winner.amount || 0
    });

    // Get submission status indicators
    const getStatusIndicators = () => {
        if (!mySubmissions.length) return homeData.statusIndicators;

        return mySubmissions.slice(0, 3).map(submission => {
            const statusMap = {
                'pending': { status: 'Pending Review', color: 'yellow', icon: '⚠' },
                'approved': { status: 'Approved - Ready to Post', color: 'green', icon: '✓' },
                'rejected': { status: 'Rejected - View Feedback', color: 'red', icon: '✗' }
            };
            return statusMap[submission.status] || statusMap['pending'];
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-8 px-6 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-5 left-10 text-5xl">🎬</div>
                    <div className="absolute top-10 right-20 text-4xl">⭐</div>
                    <div className="absolute bottom-5 left-1/4 text-4xl">🎯</div>
                    <div className="absolute bottom-10 right-10 text-5xl">🏆</div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">
                                Make Jinnar Go Viral — Create. Share. Win.
                            </h1>
                            <p className="text-sm mb-6 opacity-90">
                                Join the Pan-African challenge that rewards creativity, community, and digital excellence.
                                Submit great content, earn points, climb the leaderboard, and win big prizes!
                            </p>

                            <div className="flex gap-3 mb-6">
                                <Link to="/challenge">
                                    <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors shadow-lg">
                                        Join Challenge
                                    </button>
                                </Link>
                                <Link to="/challenge">
                                    <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-lg transition-colors border border-white/30 backdrop-blur-sm">
                                        How to Participate
                                    </button>
                                </Link>
                            </div>

                            {/* Stats Box */}
                            <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold">
                                        {loading.submissions ? '...' : mySubmissions.length.toLocaleString()}
                                    </div>
                                    <div className="text-xs opacity-80">Videos Submitted</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.countriesParticipating || 18}</div>
                                    <div className="text-xs opacity-80">Countries Participating</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {loading.leaderboard ? '...' : (leaderboardWeekly.length * 1000).toLocaleString()}
                                    </div>
                                    <div className="text-xs opacity-80">Total Videos Earned</div>
                                </div>
                            </div>
                        </div>

                        {/* Countdown Box */}
                        <div className="bg-yellow-400 text-gray-900 rounded-xl p-5">
                            <div className="text-xs font-semibold mb-3">
                                Next Mega Draw: {draws.length > 0 ? new Date(draws[0].endDate).toLocaleDateString() : 'Loading...'}
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-center mb-3">
                                <div>
                                    <div className="text-3xl font-bold">{countdown.days}</div>
                                    <div className="text-xs">Days</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{countdown.hours}</div>
                                    <div className="text-xs">Hours</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{countdown.minutes}</div>
                                    <div className="text-xs">Minutes</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{countdown.seconds}</div>
                                    <div className="text-xs">Seconds</div>
                                </div>
                            </div>
                            <div className="text-xs text-center font-medium">Countdown Clock (Live)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Left Column - Main Content */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Announcements & Draw Results */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Announcements & Draw Results</h2>

                            <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Active Draws:</h3>

                                {loading.draws ? (
                                    <div className="text-center py-4 text-gray-500">Loading draws...</div>
                                ) : draws.length > 0 ? (
                                    draws.slice(0, 3).map((draw) => (
                                        <div key={draw._id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                                            <div className="text-2xl flex-shrink-0">🎁</div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{draw.title}</h4>
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Theme: {draw.theme} | Prize Pool: {format(draw.prizePool || 10000)}
                                                </p>
                                                <Link to="/announcements">
                                                    <button className="bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold py-1.5 px-4 rounded transition-colors">
                                                        Learn More
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">No active draws at the moment</div>
                                )}
                            </div>
                        </div>

                        {/* Latest Draw Winners */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Draw Winners:</h2>

                            <div className="bg-white rounded-lg shadow-sm p-5">
                                {loading.winners ? (
                                    <div className="text-center py-4 text-gray-500">Loading winners...</div>
                                ) : latestWinners && latestWinners.winners ? (
                                    <>
                                        <div className="bg-blue-900 text-white rounded-md px-4 py-2 mb-4 flex justify-between items-center">
                                            <span className="font-semibold text-sm">{latestWinners.drawName}</span>
                                            <Link to="/past-winners">
                                                <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-semibold py-1 px-3 rounded transition-colors">
                                                    See All Past Winners
                                                </button>
                                            </Link>
                                        </div>

                                        <div className="space-y-2">
                                            {latestWinners.winners.map((winner) => {
                                                const mappedWinner = mapWinner(winner);
                                                return (
                                                    <div key={winner.rank} className="flex items-center justify-between py-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                                #{mappedWinner.rank}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                                                                    {mappedWinner.name} <span className="text-xs">{mappedWinner.flag}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-sm text-gray-900">{format(mappedWinner.points)}</div>
                                                            <div className="text-xs text-gray-500">Prize Amount</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">No winners announced yet</div>
                                )}

                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <Link to="/announcements" className="text-xs text-blue-600 hover:text-blue-700">
                                        See All Announcements →
                                    </Link>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <Link to="/winners" className="text-xs text-blue-600 hover:text-blue-700">
                                        Prize & Rewards Page →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
                                <div className="flex gap-2 text-xs">
                                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Global Leaderboard</button>
                                    <button
                                        onClick={() => setActiveTab('weekly')}
                                        className={`px - 3 py - 1 rounded ${activeTab === 'weekly' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} `}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('monthly')}
                                        className={`px - 3 py - 1 rounded ${activeTab === 'monthly' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} `}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="bg-blue-900 text-white px-4 py-2">
                                    <span className="font-semibold text-sm">{activeTab === 'weekly' ? 'Weekly' : 'Monthly'} — East Africa</span>
                                    <span className="text-xs ml-4">See Results · Months · Weeks · Monthly →</span>
                                    <span className="float-right text-xs">64%</span>
                                </div>

                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Rank</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Country</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading.leaderboard ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-gray-500">Loading leaderboard...</td>
                                            </tr>
                                        ) : currentLeaderboard.length > 0 ? (
                                            currentLeaderboard.map((entry) => {
                                                const mappedEntry = mapLeaderboardEntry(entry);
                                                return (
                                                    <tr key={entry.rank} className="border-b border-gray-100">
                                                        <td className="px-4 py-3">
                                                            <span className="text-blue-600 font-bold">#{mappedEntry.rank}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                                                    {mappedEntry.avatar && (
                                                                        <img
                                                                            src={resolveMediaUrl(mappedEntry.avatar)}
                                                                            alt={mappedEntry.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <span className="font-medium">{mappedEntry.name}</span>
                                                                <span className="text-xs">{mappedEntry.flag}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{mappedEntry.country}</td>
                                                        <td className="px-4 py-3 text-right font-bold">{mappedEntry.points.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-gray-500">No leaderboard data available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <div className="px-4 py-3 bg-gray-50 text-center">
                                    <Link to="/leaderboards" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                        View Full Leaderboards →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Regional Leaderboard */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">🏆 Leaderboard</h2>
                                <div className="flex gap-2 text-xs">
                                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">By Country</button>
                                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Weekly / Monthly</button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-semibold text-sm">Weekly — <span className="text-blue-800">East</span> Africa</span>
                                    <Link to="/leaderboards" className="text-xs text-blue-600 hover:text-blue-700">
                                        View Full Leaderboards →
                                    </Link>
                                </div>

                                {loading.leaderboard ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">Loading regional leaderboard...</div>
                                ) : regionalLeaderboard.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {regionalLeaderboard.map((entry) => {
                                            const creator = mapLeaderboardEntry(entry);
                                            return (
                                                <div key={creator.rank} className="text-center">
                                                    <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-40 flex items-center justify-center mb-2 overflow-hidden">
                                                        <div className="absolute top-2 left-2 bg-blue-900 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs z-10">
                                                            #{creator.rank}
                                                        </div>
                                                        {creator.avatar ? (
                                                            <img
                                                                src={resolveMediaUrl(creator.avatar)}
                                                                alt={creator.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <p className="text-gray-400 text-xs">Creator Photo</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <div className="w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                            #{creator.rank}
                                                        </div>
                                                        <span className="font-semibold text-xs">{creator.name}</span>
                                                        <span className="text-xs">{creator.flag}</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-900">{creator.points.toLocaleString()} points</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 text-sm">No regional leaderboard data available</div>
                                )}

                                <div className="mt-4 text-center">
                                    <Link to="/rules">
                                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                            View Full Rules & Forms →
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">

                        {/* Upload Video */}
                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-4">Upload Your Video for Approval</h3>

                            <Link to="/upload">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-blue-500 transition-colors cursor-pointer bg-blue-50">
                                    <div className="text-3xl mb-2">📤</div>
                                    <p className="text-gray-600 text-xs">Click here to upload your video</p>
                                </div>
                            </Link>

                            <p className="text-xs text-gray-500 mt-2">
                                Note: All videos must be approved before posting publicly.
                            </p>
                        </div>

                        {/* Status Indicators */}
                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Status Indicators</h3>
                                <span className="text-xs text-gray-500">Status →</span>
                            </div>

                            <div className="space-y-3">
                                {loading.submissions ? (
                                    <div className="text-center py-2 text-gray-500 text-xs">Loading status...</div>
                                ) : getStatusIndicators().map((indicator, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <span className={`text - sm ${indicator.color === 'yellow' ? 'text-yellow-600' :
                                            indicator.color === 'green' ? 'text-green-600' :
                                                'text-red-600'
                                            } `}>
                                            {indicator.icon}
                                        </span>
                                        <div>
                                            <div className="font-medium text-xs text-gray-900">{indicator.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 mt-3">
                                Note: All videos must be approved before posting publicly (takes three).
                            </p>
                        </div>

                        {/* Featured Videos */}
                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-2">Featured Videos</h3>
                            <p className="text-xs text-gray-600 mb-4">
                                Top Performing Videos — See the Best
                            </p>

                            <div className="space-y-3">
                                {loading.leaderboard ? (
                                    <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                                ) : featuredVideos.length > 0 ? (
                                    featuredVideos.map((entry, index) => (
                                        <div key={entry._id || index}>
                                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-28 flex items-center justify-center mb-2">
                                                <p className="text-gray-400 text-xs">Video Thumbnail</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                        #{entry.rank || index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-gray-900">{entry.user?.username || entry.username || 'Anonymous'}</div>
                                                        <div className="text-xs text-gray-600">{entry.user?.country || entry.country || 'Global'}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-bold text-gray-900">{entry.points?.toLocaleString() || entry.totalPoints?.toLocaleString() || 0} pts</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">No featured videos yet</div>
                                )}
                            </div>

                            <Link to="/media">
                                <button className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded transition-colors text-xs">
                                    View Highlight Reels & Media →
                                </button>
                            </Link>
                        </div>

                        {/* Rules & Brand Standards */}
                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1">
                                <span>📋</span> {homeData.rulesAndStandards.title}
                            </h3>
                            <p className="text-xs font-semibold text-blue-800 mb-3">
                                {homeData.rulesAndStandards.subtitle}
                            </p>

                            <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-900 mb-1">Content Usage Permission:</p>
                                <p className="text-xs text-gray-600">{homeData.rulesAndStandards.contentUsagePermission}</p>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-900 mb-2">What you must do:</p>
                                <ul className="space-y-1">
                                    {homeData.rulesAndStandards.guidelines.map((guideline, index) => (
                                        <li key={index} className="text-xs text-gray-700 flex items-start gap-1">
                                            <span>•</span>
                                            <span>{guideline}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-4">
                                {homeData.rulesAndStandards.links.map((link, index) => (
                                    <Link key={index} to="/rules" className="block">
                                        <button className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-between px-3">
                                            {link.text}
                                            <span>→</span>
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div >
        </div >
    );
};

export default Home;
