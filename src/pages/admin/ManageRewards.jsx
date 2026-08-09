import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import viralService from '../../services/viralService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';

const ManageRewards = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { format } = useCurrency();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [applyingStandard, setApplyingStandard] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [drawInfo, setDrawInfo] = useState(null);
    const [existingRewards, setExistingRewards] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState({ rewardType: '', amount: '' });
    const [rowBusy, setRowBusy] = useState(null);

    const [rewards, setRewards] = useState([
        { rank: 1, rewardType: 'cash', amount: '', numberOfWinners: 1 },
    ]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchDrawInfo(), fetchExistingRewards()]);
            setLoading(false);
        })();
    }, [id]);

    const fetchDrawInfo = async () => {
        try {
            setError(null);

            const response = await viralService.getSingleDraw(id);
            if (response.success && response.data) {
                setDrawInfo(response.data);
            } else {
                setError('Failed to load draw details');
            }
        } catch (err) {
            console.error('Error fetching draw:', err);
            setError(err.message || 'Failed to load draw');
        }
    };

    const fetchExistingRewards = async () => {
        try {
            const response = await adminService.getDrawWinners(id);
            if (response.success && Array.isArray(response.data) && response.data.length > 0) {
                setExistingRewards(response.data.sort((a, b) => a.rank - b.rank));
            } else {
                setExistingRewards([]);
            }
        } catch (err) {
            console.error('Error fetching existing rewards:', err);
            setExistingRewards([]);
        }
    };

    const applyStandardStructure = async () => {
        try {
            setApplyingStandard(true);
            const response = await viralService.getPrizeConfig();
            const config = response?.data;
            if (!response.success || !config) {
                toast.error('Failed to load standard prize structure');
                return;
            }

            setRewards([
                { rank: 1, rewardType: 'cash', amount: String(config.firstPrize), numberOfWinners: 1 },
                { rank: 2, rewardType: 'cash', amount: String(config.secondPrize), numberOfWinners: 1 },
                { rank: 3, rewardType: 'cash', amount: String(config.thirdPrize), numberOfWinners: 1 },
                {
                    rank: 4,
                    rewardType: 'cash',
                    amount: String(config.additionalWinnerPrize),
                    numberOfWinners: config.additionalWinnersCount,
                },
            ]);
            toast.success('Standard prize structure applied — adjust as needed before submitting');
        } catch (err) {
            console.error('Error applying standard structure:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to load standard prize structure');
        } finally {
            setApplyingStandard(false);
        }
    };

    const isRewardEditable = (r) => !r.winnerUserId && r.approvalStatus === 'pending' && r.status === 'pending';

    const startEditReward = (r) => {
        setEditingId(r._id);
        setEditDraft({ rewardType: r.rewardType, amount: String(r.amount) });
    };

    const cancelEditReward = () => {
        setEditingId(null);
        setEditDraft({ rewardType: '', amount: '' });
    };

    const saveEditReward = async (rewardId) => {
        try {
            setRowBusy(rewardId);
            const response = await adminService.updateReward(rewardId, {
                rewardType: editDraft.rewardType,
                amount: parseFloat(editDraft.amount) || 0,
            });
            if (response.success) {
                toast.success('Reward updated');
                cancelEditReward();
                await fetchExistingRewards();
            } else {
                toast.error(response.error || response.message || 'Failed to update reward');
            }
        } catch (err) {
            console.error('Error updating reward:', err);
            toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update reward');
        } finally {
            setRowBusy(null);
        }
    };

    const deleteExistingReward = async (rewardId) => {
        if (!confirm('Remove this reward tier? This cannot be undone.')) return;

        try {
            setRowBusy(rewardId);
            const response = await adminService.deleteReward(rewardId);
            if (response.success) {
                toast.success('Reward removed');
                await fetchExistingRewards();
            } else {
                toast.error(response.error || response.message || 'Failed to remove reward');
            }
        } catch (err) {
            console.error('Error deleting reward:', err);
            toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to remove reward');
        } finally {
            setRowBusy(null);
        }
    };

    const addReward = () => {
        // Calculate the next starting rank based on all existing entries
        const nextRank = rewards.reduce((sum, r) => sum + (parseInt(r.numberOfWinners) || 1), 0) + 1;
        setRewards([...rewards, { rank: nextRank, rewardType: 'cash', amount: '', numberOfWinners: 1 }]);
    };

    const removeReward = (index) => {
        if (rewards.length > 1) {
            setRewards(rewards.filter((_, i) => i !== index));
        }
    };

    const updateReward = (index, field, value) => {
        const updated = [...rewards];
        updated[index][field] = value;
        setRewards(updated);
    };

    /**
     * Expand grouped reward rows into a flat array of individual rank entries.
     * e.g. { rank: 2, amount: 10, numberOfWinners: 5 }
     *   => [{ rank:2, amount:10 }, { rank:3, amount:10 }, ... { rank:6, amount:10 }]
     */
    const flattenRewards = (rows) => {
        const flat = [];
        let currentRank = 1;
        rows.forEach(r => {
            const count = parseInt(r.numberOfWinners) || 1;
            const amount = r.rewardType === 'cash' ? parseFloat(r.amount) || 0 : 0;
            for (let i = 0; i < count; i++) {
                flat.push({ rank: currentRank++, rewardType: r.rewardType, amount });
            }
        });
        return flat;
    };

    const totalAssigned = rewards.reduce(
        (sum, r) => sum + (parseFloat(r.amount) || 0) * (parseInt(r.numberOfWinners) || 1),
        0
    );
    const prizePool = Number(drawInfo?.prizePool || 0);
    const overBudget = totalAssigned > prizePool;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const validRewards = rewards.filter(r => r.rewardType);

            if (validRewards.length === 0) {
                setError('Please add at least one reward');
                setSubmitting(false);
                return;
            }

            if (overBudget) {
                setError(`Total rewards (${format(totalAssigned)}) exceed the draw's prize pool (${format(prizePool)})`);
                setSubmitting(false);
                return;
            }

            // Flatten grouped rewards → individual rank entries for the API
            const rewardsData = flattenRewards(validRewards);

            const response = await adminService.assignRewards(id, rewardsData);

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/admin/draws');
                }, 2000);
            } else {
                setError(response.message || 'Failed to assign rewards');
            }
        } catch (err) {
            console.error('Error assigning rewards:', err);
            const backendMessage = err.response?.data?.error || err.response?.data?.message;
            const isDuplicateRank = err.response?.status === 500 && /duplicate/i.test(backendMessage || '');
            setError(
                isDuplicateRank
                    ? 'Some of these ranks already have rewards assigned for this draw. Refresh the page to see the current structure.'
                    : backendMessage || err.message || 'Failed to assign rewards'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
                        <p className="mt-4 text-gray-600">Loading draw details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
                {/* Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/draws')}
                        className="text-blue-800 hover:text-blue-900 font-semibold mb-4 flex items-center gap-2"
                    >
                        ← Back to Admin Panel
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Rewards</h1>
                    <p className="text-gray-600">Assign prizes and rewards to draw winners</p>
                </div>

                {/* Draw Info Card */}
                {drawInfo && (
                    <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-2">{drawInfo.title}</h2>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-200">Prize Pool:</span>
                                <span className="ml-2 font-semibold">{format(drawInfo.prizePool)}</span>
                            </div>
                            <div>
                                <span className="text-blue-200">Status:</span>
                                <span className="ml-2 font-semibold capitalize">{drawInfo.status}</span>
                            </div>
                            {existingRewards && existingRewards.length === 0 && (
                                <div>
                                    <span className="text-blue-200">Assigned So Far:</span>
                                    <span className={`ml-2 font-semibold ${overBudget ? 'text-red-300' : ''}`}>
                                        {format(totalAssigned)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">✓ Rewards Assigned Successfully!</p>
                        <p className="text-sm">Redirecting to admin panel...</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Current Prize Structure (read-only, shown when rewards already exist) */}
                {existingRewards && existingRewards.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Current Prize Structure</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-gray-600">
                                        <th className="px-4 py-2 font-semibold">Rank</th>
                                        <th className="px-4 py-2 font-semibold">Type</th>
                                        <th className="px-4 py-2 font-semibold">Amount</th>
                                        <th className="px-4 py-2 font-semibold">Winner</th>
                                        <th className="px-4 py-2 font-semibold">Status</th>
                                        <th className="px-4 py-2 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingRewards.map((r) => {
                                        const editable = isRewardEditable(r);
                                        const isEditing = editingId === r._id;
                                        const busy = rowBusy === r._id;
                                        return (
                                            <tr key={r._id || r.rank} className="border-t border-gray-100">
                                                <td className="px-4 py-2 text-gray-900">#{r.rank}</td>
                                                <td className="px-4 py-2 text-gray-900">
                                                    {isEditing ? (
                                                        <select
                                                            value={editDraft.rewardType}
                                                            onChange={(e) => setEditDraft({ ...editDraft, rewardType: e.target.value })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                                                        >
                                                            <option value="cash">Cash</option>
                                                            <option value="merchandise">Merchandise</option>
                                                        </select>
                                                    ) : (
                                                        <span className="capitalize">{r.rewardType}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-gray-900">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editDraft.amount}
                                                            onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                                                            min="0"
                                                            disabled={editDraft.rewardType === 'merchandise'}
                                                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                                                        />
                                                    ) : (
                                                        r.rewardType === 'cash' ? format(r.amount) : '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-gray-900">
                                                    {r.winnerUserId?.name || r.winnerUserId?.email || r.winnerUserId || '—'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                                                        {r.approvalStatus || r.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {!editable ? (
                                                        <span className="text-xs text-gray-400 whitespace-nowrap">🔒 Locked</span>
                                                    ) : isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveEditReward(r._id)}
                                                                disabled={busy}
                                                                className="text-green-700 hover:text-green-800 font-semibold text-xs disabled:opacity-50"
                                                            >
                                                                {busy ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEditReward}
                                                                disabled={busy}
                                                                className="text-gray-500 hover:text-gray-700 font-semibold text-xs disabled:opacity-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditReward(r)}
                                                                disabled={busy}
                                                                className="text-blue-800 hover:text-blue-900 font-semibold text-xs disabled:opacity-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteExistingReward(r._id)}
                                                                disabled={busy}
                                                                className="text-red-600 hover:text-red-700 font-semibold text-xs disabled:opacity-50"
                                                            >
                                                                {busy ? 'Removing...' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            {existingRewards.some(isRewardEditable)
                                ? 'Pending rewards can be edited or removed below. Once a winner is assigned or a reward is approved, it becomes locked.'
                                : 'This draw\'s rewards are all locked (a winner has been assigned, or they have been approved/paid). Contact support to modify them.'}
                        </p>
                    </div>
                )}

                {/* Rewards Form — only offered when no rewards have been assigned yet */}
                {existingRewards && existingRewards.length === 0 && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-bold text-gray-900">Reward Assignments</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={applyStandardStructure}
                                    disabled={applyingStandard}
                                    className="bg-white hover:bg-gray-50 text-blue-800 border border-blue-800 font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                                >
                                    {applyingStandard ? 'Loading...' : '⚡ Use Standard Structure'}
                                </button>
                                <button
                                    type="button"
                                    onClick={addReward}
                                    className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                                >
                                    <span className="text-lg">+</span>
                                    Add Reward
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {rewards.map((reward, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    {/* Grouped Winner Badge */}
                                    {parseInt(reward.numberOfWinners) > 1 && (
                                        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                            🏅 Group: {reward.numberOfWinners} winners × {format(reward.amount || 0)} each = {format(parseInt(reward.numberOfWinners) * (parseFloat(reward.amount) || 0))} total
                                        </div>
                                    )}
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 grid md:grid-cols-4 gap-4">
                                            {/* Reward Type */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    Reward Type
                                                </label>
                                                <select
                                                    value={reward.rewardType}
                                                    onChange={(e) => updateReward(index, 'rewardType', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                                                    required
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="merchandise">Merchandise</option>
                                                </select>
                                            </div>

                                            {/* Amount */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    Amount {reward.rewardType === 'cash' && '(USD)'}
                                                </label>
                                                <div className="relative">
                                                    {reward.rewardType === 'cash' && (
                                                        <span className="absolute left-4 top-2 text-gray-500">$</span>
                                                    )}
                                                    <input
                                                        type="number"
                                                        value={reward.amount}
                                                        onChange={(e) => updateReward(index, 'amount', e.target.value)}
                                                        min="0"
                                                        step={reward.rewardType === 'cash' ? '100' : '1'}
                                                        className={`w-full ${reward.rewardType === 'cash' ? 'pl-8' : 'pl-4'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent`}
                                                        disabled={reward.rewardType === 'merchandise'}
                                                        placeholder={reward.rewardType === 'merchandise' ? 'N/A' : '0'}
                                                    />
                                                </div>
                                            </div>

                                            {/* Number of Winners */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    # of Winners
                                                </label>
                                                <input
                                                    type="number"
                                                    value={reward.numberOfWinners}
                                                    onChange={(e) => updateReward(index, 'numberOfWinners', Math.max(1, parseInt(e.target.value) || 1))}
                                                    min="1"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                                                />
                                                <p className="text-xs text-gray-400 mt-1">e.g. 10 winners all get $10</p>
                                            </div>

                                            {/* Total for this tier */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">Tier Total</label>
                                                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700">
                                                    {format((parseFloat(reward.amount) || 0) * (parseInt(reward.numberOfWinners) || 1))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        {rewards.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeReward(index)}
                                                className="mt-8 text-red-600 hover:text-red-700 font-semibold"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-900">
                            <strong>💡 Tip:</strong> For merchandise rewards, set the amount to 0. The reward type will indicate it's a physical prize.
                        </p>
                    </div>

                    {/* Over-budget Warning */}
                    {overBudget && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800">
                                <strong>⚠ Over Budget:</strong> Total rewards ({format(totalAssigned)}) exceed this draw's prize pool ({format(prizePool)}). Reduce amounts before submitting.
                            </p>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/draws')}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting || overBudget}
                        >
                            {submitting ? 'Assigning Rewards...' : 'Assign Rewards'}
                        </button>
                    </div>
                </form>
                )}
            </div>

        </div>
    );
};

export default ManageRewards;
