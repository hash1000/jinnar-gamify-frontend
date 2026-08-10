import apiClient from '../config/apiClient';

export const authService = {
  // 1. Register new user
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  // 2. Verify account with code
  verify: async (email, code) => {
    const response = await apiClient.post('/auth/verify', { email, code });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  // 3. Resend verification code
  resendVerification: async (email) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // 4. Login
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  // 5. Forgot password
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // 6. Reset password
  resetPassword: async (email, code, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      email,
      code,
      newPassword
    });
    return response.data;
  },

  // 7. Switch role (requires auth)
  switchRole: async (role) => {
    const response = await apiClient.post('/auth/switch-role', { newRole: role });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  // 8. Initiate contact change
  initiateContactChange: async (newEmail) => {
    const response = await apiClient.post('/auth/change-contact/initiate', { newIdentifier: newEmail, type: 'email' });
    return response.data;
  },

  // 9. Verify contact change
  verifyContactChange: async (code) => {
    const response = await apiClient.post('/auth/change-contact/verify', { code });
    return response.data;
  },

  // 10. Google OAuth
  googleAuth: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  },

  // 11. GitHub OAuth
  githubAuth: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
  },

  // 12. Facebook OAuth
  facebookAuth: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
  },

  // Legacy aliases for backward compatibility
  signup: async (userData) => authService.register(userData),
  verifyAccount: async (code) => authService.verify(null, code),

  // Logout user
  logout: () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
};

export default authService;
