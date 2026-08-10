import apiClient from '../config/apiClient';

export const userService = {
    // 1. Get my profile
    getProfile: async () => {
        const response = await apiClient.get('/user/profile');
        return response.data;
    },

    // 2. Update profile
    updateProfile: async (profileData) => {
        const response = await apiClient.post('/user/update', profileData);
        return response.data;
    },

    // 2b. Change password (while logged in)
    changePassword: async (currentPassword, newPassword) => {
        const response = await apiClient.post('/user/change-password', { currentPassword, newPassword });
        return response.data;
    },

    // 3. Get public profile (no auth needed)
    getPublicProfile: async (userId) => {
        const response = await apiClient.get(`/user/public/${userId}`);
        return response.data;
    },

    // 4. Get seller reviews (no auth needed)
    getSellerReviews: async (userId) => {
        const response = await apiClient.get(`/user/public/${userId}/reviews`);
        return response.data;
    },

    // 5. Update FCM token (for push notifications)
    updateFCMToken: async (token, deviceId) => {
        const response = await apiClient.post('/user/fcm-token', { token, deviceId });
        return response.data;
    },

    // 6. Create report
    createReport: async (reportData) => {
        const response = await apiClient.post('/user/reports/create', reportData);
        return response.data;
    },

    // 7. Get my reports
    getMyReports: async () => {
        const response = await apiClient.get('/user/reports/me');
        return response.data;
    },

    // 8. Submit identity verification
    submitVerification: async (documentFile, documentType) => {
        const formData = new FormData();
        formData.append('document', documentFile);
        formData.append('documentType', documentType);

        const response = await apiClient.post('/user/submit-verification', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 9. Get user details (admin only)
    getUserDetails: async (userId) => {
        const response = await apiClient.get(`/user/details/${userId}`);
        return response.data;
    },
};

export default userService;
