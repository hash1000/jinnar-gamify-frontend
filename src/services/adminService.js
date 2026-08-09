import apiClient from '../config/apiClient';

/**
 * Admin Service
 * Handles all API calls related to admin operations
 */
const adminService = {
    // ==================== DRAW MANAGEMENT ====================

    /**
     * Create a new lucky draw
     */
    createDraw: async (drawData) => {
        const response = await apiClient.post('/viral/admin/draws', drawData);
        return response.data;
    },

    /**
     * Update an existing draw
     */
    updateDraw: async (drawId, drawData) => {
        const response = await apiClient.put(`/viral/admin/draws/${drawId}`, drawData);
        return response.data;
    },

    /**
     * Get all draws (admin view)
     */
    getAllDraws: async () => {
        const response = await apiClient.get('/viral/admin/draws');
        return response.data;
    },

    /**
     * Delete a draw
     */
    deleteDraw: async (drawId) => {
        const response = await apiClient.delete(`/viral/admin/draws/${drawId}`);
        return response.data;
    },

    /**
     * Upload a banner image for a draw
     * @param {string} drawId
     * @param {File} imageFile
     */
    uploadDrawBanner: async (drawId, imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await apiClient.post(`/viral/admin/draws/${drawId}/banner`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Close a draw and assign winners automatically
     * @param {string} drawId
     */
    closeDraw: async (drawId) => {
        const response = await apiClient.post(`/viral/admin/draws/${drawId}/close`);
        return response.data;
    },

    // ==================== REWARDS ====================

    /**
     * Assign rewards to a draw.
     * Accepts a flat array of { rank, rewardType, amount }.
     * For grouped winners, the caller should expand them before calling this.
     * @param {string} drawId
     * @param {Array<{rank: number, rewardType: string, amount: number}>} rewards
     */
    assignRewards: async (drawId, rewards) => {
        const response = await apiClient.post(`/viral/admin/draws/${drawId}/rewards`, rewards);
        return response.data;
    },

    /**
     * Get all winners for a draw (admin view — includes approvalStatus)
     * @param {string} drawId
     */
    getDrawWinners: async (drawId) => {
        const response = await apiClient.get(`/viral/admin/draws/${drawId}/winners`);
        return response.data;
    },

    /**
     * Approve a winner — credits their wallet
     * @param {string} rewardId
     * @param {string} [note]
     */
    approveReward: async (rewardId, note = '') => {
        const response = await apiClient.post(`/viral/admin/rewards/${rewardId}/approve`, { note });
        return response.data;
    },

    /**
     * Reject a winner — assigns a replacement automatically
     * @param {string} rewardId
     * @param {string} reason
     */
    rejectReward: async (rewardId, reason) => {
        const response = await apiClient.post(`/viral/admin/rewards/${rewardId}/reject`, { reason });
        return response.data;
    },

    /**
     * Update a pending reward's type/amount (blocked once a winner is assigned or it's approved/paid)
     * @param {string} rewardId
     * @param {{rewardType?: string, amount?: number}} updates
     */
    updateReward: async (rewardId, updates) => {
        const response = await apiClient.patch(`/viral/admin/rewards/${rewardId}`, updates);
        return response.data;
    },

    /**
     * Delete a pending reward tier (blocked once a winner is assigned or it's approved/paid)
     * @param {string} rewardId
     */
    deleteReward: async (rewardId) => {
        const response = await apiClient.delete(`/viral/admin/rewards/${rewardId}`);
        return response.data;
    },

    // ==================== SUBMISSION MANAGEMENT ====================

    /**
     * Get all submissions (admin view)
     */
    getAllSubmissions: async () => {
        const response = await apiClient.get('/viral/admin/submissions');
        return response.data;
    },

    /**
     * Review a submission — update status, reviewNotes, or engagement metrics
     * @param {string} submissionId
     * @param {Object} data - Can include: { status, reviewNotes, engagement }
     */
    reviewSubmission: async (submissionId, data) => {
        const response = await apiClient.put(`/viral/admin/submissions/${submissionId}`, data);
        return response.data;
    },

    /**
     * Shorthand: approve a submission
     */
    approveSubmission: async (submissionId, reviewNotes = '') => {
        return adminService.reviewSubmission(submissionId, { status: 'approved', reviewNotes });
    },

    /**
     * Shorthand: reject a submission
     */
    rejectSubmission: async (submissionId, reviewNotes = '') => {
        return adminService.reviewSubmission(submissionId, { status: 'rejected', reviewNotes });
    },

    /**
     * Update engagement metrics for a submission
     * @param {string} submissionId
     * @param {{ likes, comments, shares, saves, views }} engagement
     */
    updateEngagement: async (submissionId, engagement) => {
        return adminService.reviewSubmission(submissionId, { engagement });
    },

    // ==================== ANNOUNCEMENTS ====================

    /**
     * Get all announcements (admin) with optional filters
     * @param {{ category?: string, isActive?: boolean }} filters
     */
    getAnnouncements: async (filters = {}) => {
        const response = await apiClient.get('/viral/admin/announcements', { params: filters });
        return response.data;
    },

    /**
     * Create a new announcement
     * @param {{ title, message, category, publishAt?, drawId?, isActive? }} data
     */
    createAnnouncement: async (data) => {
        const response = await apiClient.post('/viral/admin/announcements', data);
        return response.data;
    },

    /**
     * Update an existing announcement
     * @param {string} announcementId
     * @param {{ title?, message?, category?, publishAt?, drawId?, isActive? }} data
     */
    updateAnnouncement: async (announcementId, data) => {
        const response = await apiClient.put(`/viral/admin/announcements/${announcementId}`, data);
        return response.data;
    },

    /**
     * Soft delete an announcement
     * @param {string} announcementId
     */
    deleteAnnouncement: async (announcementId) => {
        const response = await apiClient.delete(`/viral/admin/announcements/${announcementId}`);
        return response.data;
    },

    // ==================== AUTH & SYSTEM ====================

    login: async (email, password) => {
        const response = await apiClient.post('/admin/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
        }
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/admin/stats');
        return response.data;
    },

    verifyUser: async (userId, status) => {
        const response = await apiClient.patch('/admin/verify-user', { userId, status });
        return response.data;
    },

    suspendUser: async (userId, suspend) => {
        const response = await apiClient.patch('/admin/suspend-user', { userId, suspend });
        return response.data;
    },

    getUsers: async (params = {}) => {
        const response = await apiClient.get('/admin/users', { params });
        return response.data;
    },

    getFinancialLogs: async (page = 1, limit = 10) => {
        const response = await apiClient.get(`/admin/financial-logs?page=${page}&limit=${limit}`);
        return response.data;
    },
};

export default adminService;
