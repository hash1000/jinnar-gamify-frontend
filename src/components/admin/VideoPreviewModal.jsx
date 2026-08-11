import React, { useState, useRef, useEffect } from 'react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

/**
 * VideoPreviewModal
 * Shows a video player (or live link iframe) and Approve / Reject actions.
 *
 * Props:
 *   submission  - full submission object from the API
 *   baseUrl     - base URL of the backend (e.g. http://localhost:5000)
 *   onClose     - callback when the modal should close
 *   onAction    - callback(updatedSubmission) after approve/reject
 */
const VideoPreviewModal = ({ submission, baseUrl = '', onClose, onAction }) => {
    const [reviewNotes, setReviewNotes] = useState('');
    // Empty string = "not manually set" — let the backend auto-calculate
    // points from engagement instead of overriding with 0.
    const [points, setPoints] = useState(submission?.points ? String(submission.points) : '');
    const [engagement, setEngagement] = useState({
        likes: submission?.engagement?.likes ?? 0,
        comments: submission?.engagement?.comments ?? 0,
        shares: submission?.engagement?.shares ?? 0,
        saves: submission?.engagement?.saves ?? 0,
        views: submission?.engagement?.views ?? 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const overlayRef = useRef(null);

    const setEngagementField = (field, value) => {
        setEngagement(prev => ({ ...prev, [field]: value }));
    };

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleAction = async (status) => {
        if (status === 'rejected' && !reviewNotes.trim()) {
            toast.error('Please provide a reason for rejection.');
            return;
        }
        try {
            setIsSubmitting(true);
            const payload = {
                status,
                reviewNotes: reviewNotes.trim(),
                engagement: {
                    likes: Number(engagement.likes) || 0,
                    comments: Number(engagement.comments) || 0,
                    shares: Number(engagement.shares) || 0,
                    saves: Number(engagement.saves) || 0,
                    views: Number(engagement.views) || 0,
                },
            };
            // Only send `points` if the admin actually typed a value —
            // otherwise let the backend auto-calculate it from engagement.
            if (points !== '') {
                payload.points = Number(points) || 0;
            }
            const result = await adminService.reviewSubmission(submission._id, payload);
            toast.success(status === 'approved' ? '✅ Submission approved!' : '❌ Submission rejected.');
            onAction?.(result.data);
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Action failed. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const videoSrc = submission?.videoUrl 
        ? (submission.videoUrl.startsWith('http') ? submission.videoUrl : `${baseUrl}${submission.videoUrl}`) 
        : null;
    const liveLink = submission?.liveLinkUrl || submission?.liveLink;
    const statusColor = {
        pending:  { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' },
        approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved'       },
        rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected'       },
    }[submission?.status] ?? { bg: '#f3f4f6', text: '#374151', label: submission?.status };

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '95vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>
                            Review Submission
                        </h2>
                        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
                            {submission?.title || 'Untitled'} &bull; {submission?.userId?.name || 'Unknown User'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: statusColor.bg, color: statusColor.text }}>
                            {statusColor.label}
                        </span>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="px-6 py-4 flex flex-col gap-4">
                    {videoSrc && (
                        <div className="rounded-xl overflow-hidden" style={{ background: '#000', aspectRatio: '16/9' }}>
                            <video
                                src={videoSrc}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                                style={{ maxHeight: '400px' }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}
                    
                    {liveLink ? (
                        <div className="rounded-xl p-4 flex flex-col items-center gap-2 text-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="text-2xl">🔗</span>
                            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                                This submission includes a live social media link.
                            </p>
                            <a
                                href={liveLink.startsWith('http') ? liveLink : `https://${liveLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                            >
                                Open Post ↗
                            </a>
                            <p className="text-xs break-all" style={{ color: '#475569' }}>{liveLink}</p>
                        </div>
                    ) : !videoSrc && (
                        <div className="rounded-xl p-10 flex flex-col items-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="text-4xl">📭</span>
                            <p className="text-sm" style={{ color: '#64748b' }}>No video or link available for this submission.</p>
                        </div>
                    )}
                </div>

                {/* Submission Meta */}
                <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Draw', value: submission?.drawId?.title || '—' },
                        { label: 'Submitted', value: submission?.createdAt ? new Date(submission.createdAt).toLocaleDateString() : '—' },
                        { label: 'Points', value: submission?.points ?? 0 },
                        { label: 'Likes', value: submission?.engagement?.likes ?? 0 },
                        { label: 'Views', value: submission?.engagement?.views ?? 0 },
                        { label: 'Shares', value: submission?.engagement?.shares ?? 0 },
                    ].map(item => (
                        <div key={item.label} className="rounded-lg p-3"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <p className="text-xs" style={{ color: '#64748b' }}>{item.label}</p>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: '#e2e8f0' }}>{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Review Notes & Points */}
                {submission?.status === 'pending' && (
                    <div className="px-6 pb-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                                Engagement Stats
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {[
                                    { key: 'likes', label: 'Likes' },
                                    { key: 'comments', label: 'Comments' },
                                    { key: 'shares', label: 'Shares' },
                                    { key: 'saves', label: 'Saves' },
                                    { key: 'views', label: 'Views' },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label className="block text-xs mb-1" style={{ color: '#64748b' }}>
                                            {field.label}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={engagement[field.key]}
                                            onChange={e => setEngagementField(field.key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                                            style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#e2e8f0',
                                            }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs mt-2" style={{ color: '#475569' }}>
                                Points = likes×1 + comments×2 + shares×3 + saves×2 + views×0.1 — auto-calculated from these stats, or overridden by "Assign Points" below if set.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                                Assign Points <span className="text-xs" style={{ color: '#475569' }}>(optional — overrides the calculated total above)</span>
                            </label>
                            <input
                                type="number"
                                value={points}
                                onChange={e => setPoints(e.target.value)}
                                placeholder="Leave blank to auto-calculate from engagement stats"
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#e2e8f0',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                                Review Notes <span className="text-xs" style={{ color: '#475569' }}>(required for rejection)</span>
                            </label>
                        <textarea
                            value={reviewNotes}
                            onChange={e => setReviewNotes(e.target.value)}
                            rows={3}
                            placeholder="e.g. Video quality is too low, or Great content!"
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e2e8f0',
                            }}
                            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="px-6 py-4 flex gap-3 justify-end"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                    >
                        Close
                    </button>

                    {submission?.status === 'pending' && (
                        <>
                            <button
                                id="reject-submission-btn"
                                onClick={() => handleAction('rejected')}
                                disabled={isSubmitting}
                                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                                {isSubmitting ? '...' : '❌ Reject'}
                            </button>
                            <button
                                id="approve-submission-btn"
                                onClick={() => handleAction('approved')}
                                disabled={isSubmitting}
                                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
                            >
                                {isSubmitting ? '...' : '✅ Approve'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewModal;
