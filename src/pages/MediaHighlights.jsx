import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import viralService from '../services/viralService';
import {
    PlayIcon,
    VideoIcon,
} from '../components/ui/Icons';
import { formatNumber, resolveMediaUrl } from '../utils/format';

const MediaHighlights = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopVideos = async () => {
            try {
                const drawsRes = await viralService.getActiveDraws();
                const activeDraw = drawsRes.success && drawsRes.data.length > 0 ? drawsRes.data[0] : null;
                if (!activeDraw) {
                    setVideos([]);
                    return;
                }
                const leaderboardRes = await viralService.getGlobalLeaderboard(activeDraw._id, 12);
                if (leaderboardRes.success) {
                    setVideos(leaderboardRes.data);
                }
            } catch (error) {
                console.error('Error fetching top videos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopVideos();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-900 via-blue-800 to-teal-700 text-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">🎬</span>
                        <h1 className="text-4xl font-bold">Media & Highlights</h1>
                    </div>
                    <p className="text-xl text-blue-100">
                        Get inspired by the best-performing Jinnar content.
                    </p>
                </div>
            </div>

            {/* Top Featured Videos */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Featured Videos</h2>
                    <p className="text-gray-600">Best-performing approved videos from the current Draw</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading featured videos...</div>
                ) : videos.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((entry, index) => (
                            <div key={entry.userId || index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer">
                                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 h-56 flex items-center justify-center">
                                    <p className="text-gray-400 text-sm">Video Thumbnail</p>

                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <PlayIcon className="w-6 h-6 text-blue-700 ml-0.5" />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-3 right-3 bg-blue-800 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {formatNumber(entry.totalPoints || 0)} pts
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                                            {entry.profilePicture ? (
                                                <img
                                                    src={resolveMediaUrl(entry.profilePicture)}
                                                    alt={entry.name || 'Creator'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                (entry.name || 'A')[0]
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{entry.name || 'Anonymous'}</h3>
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <VideoIcon className="w-3.5 h-3.5" />
                                                {entry.country || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
                        No featured videos yet — be the first to submit a video and top the leaderboard!
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-800 to-teal-600 py-16 px-6">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Want Your Video Featured Here?</h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Create amazing content, earn points, and get featured on our highlight reels and promotional materials.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link to="/upload">
                            <button className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold text-lg transition-colors">
                                Upload Your Video
                            </button>
                        </Link>
                        <Link to="/rules">
                            <button className="px-8 py-3 bg-white hover:bg-gray-100 text-blue-800 rounded-lg font-bold text-lg transition-colors">
                                View Rules & Guidelines
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MediaHighlights;
