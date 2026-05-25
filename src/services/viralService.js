import apiClient from '../config/apiClient';

/**
 * Viral Campaign Service
 * Handles all API calls related to viral campaigns, submissions, draws, leaderboards, and rewards
 */
const viralService = {
    // ==================== FX / CURRENCY ====================

    /**
     * Get all supported FX rates (base: USD)
     * @returns {Promise} { baseCurrency: 'USD', rates: { TZS: 2580, KES: 130, ... } }
     */
    getFxRates: async () => {
        const response = await apiClient.get('/fx/rates');
        return response.data;
    },

    // ==================== SUBMISSIONS ====================

    /**
     * Create a new submission (with optional video file OR live link)
     * @param {Object} payload
     * @param {string} payload.drawId
     * @param {string} payload.title
     * @param {string} [payload.liveLinkUrl] - Social media live link URL
     * @param {string} [payload.platform] - e.g. 'tiktok', 'instagram'
     * @param {File}   [payload.videoFile]  - Optional video file upload
     * @returns {Promise} Created submission object
     */
    createSubmission: async ({ drawId, title, liveLinkUrl, platform, videoFile, videoUrl }) => {
        // If a raw file is passed (legacy), use FormData — otherwise send plain JSON
        if (videoFile) {
            const formData = new FormData();
            formData.append('drawId', drawId);
            formData.append('title', title);
            if (liveLinkUrl) formData.append('liveLinkUrl', liveLinkUrl);
            if (platform) formData.append('platform', platform);
            formData.append('video', videoFile);
            const response = await apiClient.post('/viral/submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        }

        // Standard path: file already uploaded via /upload/viral-video, send JSON
        const body = {
            drawId,
            title,
            ...(liveLinkUrl ? { liveLinkUrl } : {}),
            ...(platform ? { platform } : {}),
            ...(videoUrl ? { videoUrl } : {}),
        };
        const response = await apiClient.post('/viral/submissions', body);
        return response.data;
    },

    /**
     * Legacy alias — upload a video submission for a draw
     * @param {File} videoFile
     * @param {string} drawId
     * @param {string} title
     */
    uploadVideo: async (videoFile, drawId, title) => {
        return viralService.createSubmission({ drawId, title, videoFile });
    },

    // ==================== DEDICATED FILE UPLOADS ====================

    /**
     * Upload a viral video file
     * POST /upload/viral-video
     * Form-data field: viral_video (file)
     * @param {File} file - The video file to upload
     * @param {Function} [onProgress] - Optional upload progress callback (0-100)
     * @returns {Promise} { url, ... } — the hosted video URL
     */
    uploadViralVideo: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('viral_video', file);
        const response = await apiClient.post('/upload/viral-video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress
                ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
                : undefined,
        });
        return response.data;
    },

    /**
     * Upload a viral image file
     * POST /upload/viral-image
     * Form-data field: viral_image (file)
     * @param {File} file - The image file to upload
     * @param {Function} [onProgress] - Optional upload progress callback (0-100)
     * @returns {Promise} { url, ... } — the hosted image URL
     */
    uploadViralImage: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('viral_image', file);
        const response = await apiClient.post('/upload/viral-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress
                ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
                : undefined,
        });
        return response.data;
    },

    /**
     * Get current user's submissions
     * @returns {Promise} Array of user submissions
     */
    getMySubmissions: async () => {
        const response = await apiClient.get('/viral/submissions/me');
        return response.data;
    },

    /**
     * Get a single submission by ID (current user)
     * @param {string} submissionId
     */
    getMySubmissionById: async (submissionId) => {
        const response = await apiClient.get(`/viral/submissions/me/${submissionId}`);
        return response.data;
    },

    /**
     * Submit a social media post link for an already-uploaded video submission.
     * Called from SubmitPostLink page AFTER the user has posted their video on social media.
     *
     * @param {Object} params
     * @param {string} params.submissionId  - ID of the existing video submission
     * @param {string} params.drawId        - ID of the draw
     * @param {string} params.platform      - 'tiktok' | 'instagram' | 'facebook' | 'youtube'
     * @param {string} params.postUrl       - The live URL of the social media post
     * @param {File}   [params.screenshot]  - Optional proof screenshot
     * @returns {Promise} Created post object
     */
    submitPost: async ({ submissionId, drawId, platform, postUrl, screenshot }) => {
        const formData = new FormData();
        formData.append('submissionId', submissionId);
        formData.append('drawId', drawId);
        formData.append('platform', platform);
        formData.append('postUrl', postUrl);
        if (screenshot) formData.append('screenshot', screenshot);

        const response = await apiClient.post('/viral/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Upload a thumbnail for an existing submission
     * @param {string} submissionId
     * @param {File} thumbnailFile
     */
    uploadThumbnail: async (submissionId, thumbnailFile) => {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        const response = await apiClient.post(`/viral/submissions/${submissionId}/thumbnail`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // ==================== DRAWS ====================

    /**
     * Get list of draws filtered by status
     * @param {string} status - 'active' | 'upcoming' | 'completed' | 'closed'
     */
    getDraws: async (status = 'active') => {
        const response = await apiClient.get('/viral/draws', { params: { status } });
        return response.data;
    },

    /**
     * Get a single draw by ID (returns submissions array for that draw)
     * @param {string} drawId
     */
    getSingleDraw: async (drawId) => {
        const response = await apiClient.get(`/viral/draws/${drawId}`);
        return response.data;
    },

    /**
     * Get public winners for a specific draw
     * @param {string} drawId
     */
    getDrawWinners: async (drawId) => {
        const response = await apiClient.get(`/viral/draws/${drawId}/winners`);
        return response.data;
    },

    // ==================== LEADERBOARD ====================

    /**
     * Get global leaderboard (optionally for a specific draw)
     * @param {string|null} drawId
     * @param {string} scope - 'global' | 'country' | 'city'
     * @param {number} limit
     */
    getLeaderboard: async (drawId = null, scope = 'global', limit = 50) => {
        const params = { scope, limit };
        if (drawId) params.drawId = drawId;
        const response = await apiClient.get('/viral/leaderboard', { params });
        return response.data;
    },

    /**
     * Get current user's rank in a specific draw
     * @param {string} drawId
     */
    getMyRank: async (drawId) => {
        const response = await apiClient.get('/viral/leaderboard/me', { params: { drawId } });
        return response.data;
    },

    // ==================== POINTS ====================

    /**
     * Get current user's points and breakdown
     */
    getMyPoints: async () => {
        const response = await apiClient.get('/viral/points/me');
        return response.data;
    },

    // ==================== REWARDS (USER) ====================

    /**
     * Get current user's active rewards and rejection history
     * @returns {Promise} { activeRewards: [], rejections: [] }
     */
    getMyRewards: async () => {
        const response = await apiClient.get('/viral/rewards/me');
        return response.data;
    },

    // ==================== ANNOUNCEMENTS ====================

    /**
     * Get platform announcements (public)
     * @param {{ category?: string, page?: number, limit?: number }} params
     */
    getAnnouncements: async (params = {}) => {
        const response = await apiClient.get('/announcements', { params });
        return response.data;
    },

    /**
     * Get a single public announcement by ID
     * @param {string} id
     */
    getAnnouncementById: async (id) => {
        const response = await apiClient.get(`/announcements/${id}`);
        return response.data;
    },

    // ==================== HELPER SHORTCUTS ====================

    getActiveDraws: async () => viralService.getDraws('active'),
    getUpcomingDraws: async () => viralService.getDraws('upcoming'),
    getCompletedDraws: async () => viralService.getDraws('completed'),
    getClosedDraws: async () => viralService.getDraws('closed'),

    getGlobalLeaderboard: async (drawId, limit = 50) =>
        viralService.getLeaderboard(drawId, 'global', limit),
    getCountryLeaderboard: async (drawId, limit = 50) =>
        viralService.getLeaderboard(drawId, 'country', limit),
    getCityLeaderboard: async (drawId, limit = 50) =>
        viralService.getLeaderboard(drawId, 'city', limit),

    // ==================== DRAW LIFECYCLE ====================

    archiveDraw: async (drawId) => {
        const response = await apiClient.post(`/viral/draws/${drawId}/archive`);
        return response.data;
    },

    unarchiveDraw: async (drawId) => {
        const response = await apiClient.post(`/viral/draws/${drawId}/unarchive`);
        return response.data;
    },

    // ==================== PARTICIPANTS ====================

    getLatestParticipants: async () => {
        const response = await apiClient.get('/viral/draws/latest/participants');
        return response.data;
    },
};

export default viralService;
