import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../config/apiClient';

// Helper to load user from local storage
const loadUserFromStorage = () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    // Decode token to get user info
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('Failed to load user from storage', error);
    return null;
  }
};

const storedUser = loadUserFromStorage();

const initialState = {
  user: storedUser,
  isAuthenticated: !!storedUser,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      console.log('Attempting login with credentials:', credentials);
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login API Response:', response);
      console.log('Login API Response Data:', response.data);

      const { token, user } = response.data;

      if (!token) {
        console.error('Login failed: No token in response');
        return rejectWithValue({ message: 'Authentication failed: No token received' });
      }

      // Store token immediately
      localStorage.setItem('authToken', token);
      console.log('Login successful, token stored');

      // If user data is provided in login response, use it
      if (user) {
        return user;
      }

      // If no user data, fetch it using the token
      // console.log('Fetching user profile...');
      // const userResponse = await apiClient.get('/auth/me');
      // return userResponse.data.user;

      // /auth/me is disabled, try to decode token to get basic user info
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedUser = JSON.parse(jsonPayload);
        console.log('Decoded user from token:', decodedUser);
        return decodedUser;
      } catch (e) {
        console.warn('Failed to decode token', e);
        // Return a placeholder so login doesn't fail completely
        return { id: 'unknown', role: 'user' };
      }

    } catch (error) {
      console.error('Login API Error:', error);
      console.error('Login API Error Response:', error.response);
      // Clear any existing token on error
      localStorage.removeItem('authToken');
      // Return both message and status for frontend logic
      return rejectWithValue({
        message: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed',
        status: error.response?.status
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Attempting registration with data:', userData);
      const response = await apiClient.post('/auth/register', userData);
      console.log('Register API Response:', response);
      console.log('Register API Response Data:', response.data);

      // The backend returns { message, userId } - no token yet as verification is required
      return response.data;
    } catch (error) {
      console.error('Registration API Error:', error);
      console.error('Registration API Error Response:', error.response);
      return rejectWithValue({
        message: error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed',
        status: error.response?.status
      });
    }
  }
);

export const loginAdmin = createAsyncThunk(
  'user/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/admin/login', credentials);
      const { token, user } = response.data;
      if (!token) throw new Error('No token received');
      localStorage.setItem('authToken', token);
      if (user) return user;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Admin login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/user/profile');
      // API returns { profile: { ... } }
      return response.data.profile || response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.error || error.response?.data?.message || error.message,
        status: error.response?.status,
      });
    }
  }
);

export const verifyUser = createAsyncThunk(
  'user/verify',
  async (verificationData, { rejectWithValue }) => {
    try {
      // verificationData: { identifier, code }
      const response = await apiClient.post('/auth/verify', verificationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
    }
  }
);

export const resendCode = createAsyncThunk(
  'user/resendCode',
  async (identifier, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/resend-verification', { identifier });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'user/forgotPassword',
  async (identifier, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { identifier });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async (resetData, { rejectWithValue }) => {
    try {
      // resetData: { identifier, code, newPassword }
      const response = await apiClient.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('authToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // Only mark as authenticated if we have valid user data
        if (action.payload && typeof action.payload === 'object') {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.error = 'Invalid user data received';
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        // Handle both object (new format) and string (legacy/fallback)
        state.error = action.payload?.message || action.payload || 'Login failed';
        state.user = null;
        state.isAuthenticated = false;
      })
      // Admin Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object') {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.error = 'Invalid admin data';
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Admin login failed';
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Registration successful, but not authenticated yet (needs verification)
        state.error = null;
        // We might want to store the userId temporarily if needed, but for now just clear loading
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Registration failed';
        state.user = null;
        state.isAuthenticated = false;
      })
      // Fetch Me
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        // Merge full profile on top of whatever we already have (e.g. id/role from the JWT)
        if (action.payload && typeof action.payload === 'object') {
          state.user = { ...state.user, ...action.payload };
          state.isAuthenticated = true;
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        // Only a real auth failure (401/403) should log the user out;
        // don't wipe the session on a transient network error.
        if (action.payload?.status === 401 || action.payload?.status === 403) {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('authToken');
        }
      })
      // Verify User
      .addCase(verifyUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyUser.fulfilled, (state) => {
        state.loading = false;
        // Verification successful, user can now login or is considered verified
      })
      .addCase(verifyUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Resend Code
      .addCase(resendCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendCode.fulfilled, (state) => {
        state.loading = false;
        // Code resent successfully
      })
      .addCase(resendCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
