import React, { useState, useEffect, useCallback } from 'react';
import viralService from '../services/viralService';
import announcementsData from '../data/announcements';

const CATEGORIES = ['All', 'winner', 'draw', 'promotion', 'system'];

const CATEGORY_META = {
    winner:    { label: 'Winner',    bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', emoji: '🏆', accent: '#059669' },
    draw:      { label: 'Draw',      bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', emoji: '🎯', accent: '#d97706' },
    promotion: { label: 'Promotion', bg: 'bg-pink-100',   text: 'text-pink-800',   border: 'border-pink-200',   emoji: '🎉', accent: '#db2777' },
    system:    { label: 'System',    bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-200',   emoji: '⚙️', accent: '#6b7280' },
};

const PAGE_LIMIT = 9;

const Announcements = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedId, setExpandedId] = useState(null);

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit: PAGE_LIMIT };
            if (selectedCategory !== 'All') params.category = selectedCategory;

            const response = await viralService.getAnnouncements(params);

            if (response.success && response.data?.length > 0) {
                setAnnouncements(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages || 1);
                }
            } else {
                // Fallback to static data for development/demo stability
                console.log('Using static announcement data as fallback');
                const filtered = selectedCategory === 'All'
                    ? announcementsData
                    : announcementsData.filter(a => a.category === selectedCategory);
                setAnnouncements(filtered);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setAnnouncements(announcementsData);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, page]);

    useEffect(() => {
        setPage(1); // reset page when category changes
    }, [selectedCategory]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const formatPublishDate = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const SkeletonCard = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-5xl mb-4 block">📢</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Announcements</h1>
                    <p className="text-blue-200 text-lg">
                        Stay up to date with the latest news, draw results, and updates from Jinnar Viral.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
                    {CATEGORIES.map(cat => {
                        const meta = CATEGORY_META[cat];
                        const isActive = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-semibold text-sm transition-all border ${
                                    isActive
                                        ? 'bg-blue-800 text-white border-blue-800 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                                }`}
                            >
                                {meta ? `${meta.emoji} ${meta.label}` : 'All'}
                            </button>
                        );
                    })}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-5xl block mb-4">📭</span>
                        <p className="text-gray-500 text-lg">No announcements in this category yet.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {announcements.map((item) => {
                            const cat = item.category?.toLowerCase();
                            const meta = CATEGORY_META[cat] || {
                                label: item.category || 'General',
                                bg: 'bg-indigo-100', text: 'text-indigo-800',
                                border: 'border-indigo-200', emoji: '📢', accent: '#6366f1',
                            };
                            const isExpanded = expandedId === (item._id || item.id);
                            // Message text (API uses `message`, static data may use `content` or `excerpt`)
                            const msgText = item.message || item.content || item.excerpt || '';
                            // Date: prefer publishAt from API, then date from static
                            const displayDate = item.publishAt || item.createdAt || item.date;

                            return (
                                <div
                                    key={item._id || item.id}
                                    className={`bg-white rounded-2xl shadow-sm overflow-hidden border flex flex-col transition-shadow hover:shadow-md ${meta.border}`}
                                >
                                    {/* Accent top bar */}
                                    <div className="h-1 w-full" style={{ background: meta.accent }} />

                                    <div className="p-6 flex-1 flex flex-col">
                                        {/* Category badge + date */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>
                                                {meta.emoji} {meta.label}
                                            </span>
                                            {displayDate && (
                                                <span className="text-gray-400 text-xs" title={formatPublishDate(displayDate)}>
                                                    {getTimeAgo(displayDate) || formatPublishDate(displayDate)}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">
                                            {item.title}
                                        </h3>

                                        <p className={`text-gray-600 text-sm leading-relaxed flex-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
                                            {msgText}
                                        </p>

                                        {msgText.length > 160 && (
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : (item._id || item.id))}
                                                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 text-left transition-colors"
                                            >
                                                {isExpanded ? '↑ Show less' : 'Read more →'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {displayDate && (
                                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                                            <span className="text-xs text-gray-400">
                                                📅 {formatPublishDate(displayDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-center gap-3 mt-10">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-gray-500 px-2">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Announcements;
