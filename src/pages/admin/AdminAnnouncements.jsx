import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const CATEGORIES = ['winner', 'draw', 'promotion', 'system'];

const CATEGORY_META = {
    winner:    { label: 'Winner',    bg: '#d1fae5', text: '#065f46', emoji: '🏆' },
    draw:      { label: 'Draw',      bg: '#fef3c7', text: '#92400e', emoji: '🎯' },
    promotion: { label: 'Promotion', bg: '#fce7f3', text: '#9d174d', emoji: '🎉' },
    system:    { label: 'System',    bg: '#f3f4f6', text: '#374151', emoji: '⚙️' },
};

const emptyForm = {
    title: '',
    message: '',
    category: 'system',
    publishAt: '',
    drawId: '',
    isActive: true,
};

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterActive, setFilterActive] = useState('');

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const filters = {};
            if (filterCategory) filters.category = filterCategory;
            if (filterActive !== '') filters.isActive = filterActive === 'true';
            const res = await adminService.getAnnouncements(filters);
            
            // Filter out any soft-deleted items the backend might still be returning
            const validAnnouncements = (res.data || []).filter(a => !a.isDeleted && !a.deletedAt);
            setAnnouncements(validAnnouncements);
        } catch (err) {
            console.warn('Announcements API not available.', err);
            setAnnouncements([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, [filterCategory, filterActive]);

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (a) => {
        setEditTarget(a);
        setForm({
            title: a.title || '',
            message: a.message || '',
            category: a.category || 'system',
            publishAt: a.publishAt ? a.publishAt.slice(0, 16) : '',
            drawId: a.drawId || '',
            isActive: a.isActive !== false,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            toast.error('Title and message are required.');
            return;
        }
        try {
            setIsSaving(true);
            const payload = {
                title: form.title.trim(),
                message: form.message.trim(),
                category: form.category,
                isActive: form.isActive,
            };
            if (form.publishAt) payload.publishAt = new Date(form.publishAt).toISOString();
            if (form.drawId.trim()) payload.drawId = form.drawId.trim();

            if (editTarget) {
                await adminService.updateAnnouncement(editTarget._id, payload);
                toast.success('Announcement updated!');
            } else {
                await adminService.createAnnouncement(payload);
                toast.success('Announcement published!');
            }
            setShowModal(false);
            fetchAnnouncements();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to save announcement.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteAnnouncement(id);
            toast.success('Announcement deleted.');
            setDeleteConfirm(null);
            // Immediately remove from UI for a snappy feel
            setAnnouncements(prev => prev.filter(a => a._id !== id));
        } catch {
            toast.error('Failed to delete announcement.');
        }
    };

    const handleToggleActive = async (a) => {
        try {
            await adminService.updateAnnouncement(a._id, { isActive: !a.isActive });
            toast.success(a.isActive ? 'Announcement deactivated.' : 'Announcement activated!');
            fetchAnnouncements();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0',
        colorScheme: 'dark',
    };

    return (
        <div className="min-h-screen" style={{ background: '#0f172a' }}>
            <div className="px-6 py-8 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>📢 Announcements</h1>
                        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                            Manage public announcements visible to all users.
                        </p>
                    </div>
                    <button
                        id="create-announcement-btn"
                        onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                    >
                        + New Announcement
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="px-4 py-2 rounded-xl text-sm outline-none font-medium"
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>{CATEGORY_META[c]?.label || c}</option>
                        ))}
                    </select>
                    <select
                        value={filterActive}
                        onChange={e => setFilterActive(e.target.value)}
                        className="px-4 py-2 rounded-xl text-sm outline-none font-medium"
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    <button
                        onClick={() => { setFilterCategory(''); setFilterActive(''); }}
                        className="px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Table */}
                <div className="rounded-2xl overflow-hidden shadow-xl"
                    style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-4 rounded-full animate-spin"
                                style={{ borderColor: '#334155', borderTopColor: '#6366f1' }} />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <span className="text-5xl">📭</span>
                            <p className="text-sm" style={{ color: '#94a3b8' }}>No announcements found. Create your first one!</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Title', 'Category', 'Publish At', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                                            style={{ color: '#94a3b8' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((a, i) => {
                                    const meta = CATEGORY_META[a.category] || { label: a.category, bg: '#e0e7ff', text: '#3730a3', emoji: '📢' };
                                    return (
                                        <tr key={a._id || i}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            className="transition-colors hover:bg-white hover:bg-opacity-5">
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="font-semibold text-sm truncate" style={{ color: '#e2e8f0' }}>{a.title}</p>
                                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#94a3b8' }}>{a.message}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold"
                                                    style={{ background: meta.bg, color: meta.text }}>
                                                    {meta.emoji} {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm" style={{ color: '#94a3b8' }}>
                                                {a.publishAt
                                                    ? new Date(a.publishAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                                                    : <span style={{ color: '#475569' }}>Immediate</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(a)}
                                                    className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                                                    style={a.isActive !== false
                                                        ? { background: '#d1fae5', color: '#065f46' }
                                                        : { background: '#fee2e2', color: '#991b1b' }
                                                    }
                                                >
                                                    {a.isActive !== false ? '● Active' : '○ Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(a)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(a._id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                                        🗑 Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="px-6 py-4 flex items-center justify-between sticky top-0"
                            style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>
                                {editTarget ? 'Edit Announcement' : 'New Announcement'}
                            </h2>
                            <button onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>✕</button>
                        </div>

                        <div className="px-6 py-5 flex flex-col gap-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Title *</label>
                                <input
                                    id="announcement-title-input"
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. 🏆 Winner Announced for Draw #1"
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={inputStyle}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c} style={{ background: '#1e293b', color: '#e2e8f0' }}>
                                            {CATEGORY_META[c]?.emoji} {CATEGORY_META[c]?.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Message *</label>
                                <textarea
                                    id="announcement-content-input"
                                    rows={5}
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    placeholder="Write your announcement message here…"
                                    className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Publish At */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                                    Schedule Publish At <span style={{ color: '#475569' }}>(optional — leave blank to publish immediately)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.publishAt}
                                    onChange={e => setForm(f => ({ ...f, publishAt: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Draw ID (optional) */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                                    Linked Draw ID <span style={{ color: '#475569' }}>(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.drawId}
                                    onChange={e => setForm(f => ({ ...f, drawId: e.target.value }))}
                                    placeholder="e.g. 664f1b2e8c1a2b3d4e5f6789"
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Is Active */}
                            <label className="flex items-center gap-3 cursor-pointer py-1">
                                <div
                                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className="relative w-12 h-6 rounded-full transition-all"
                                    style={{ background: form.isActive ? '#6366f1' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                >
                                    <span
                                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                                        style={{
                                            background: '#fff',
                                            left: form.isActive ? '26px' : '2px',
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                                    {form.isActive ? 'Active — visible to users' : 'Inactive — hidden from users'}
                                </span>
                            </label>
                        </div>

                        <div className="px-6 py-4 flex justify-end gap-3 sticky bottom-0"
                            style={{ background: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2 rounded-xl text-sm font-medium"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                Cancel
                            </button>
                            <button
                                id="save-announcement-btn"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                                {isSaving ? 'Saving…' : editTarget ? 'Update' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.75)' }}>
                    <div className="w-full max-w-sm rounded-2xl p-6 text-center"
                        style={{ background: '#1e293b', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <p className="text-3xl mb-3">🗑️</p>
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#f1f5f9' }}>Delete Announcement?</h3>
                        <p className="text-sm mb-6" style={{ color: '#64748b' }}>This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 rounded-xl text-sm font-medium"
                                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2 rounded-xl text-sm font-semibold"
                                style={{ background: '#ef4444', color: '#fff' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncements;
