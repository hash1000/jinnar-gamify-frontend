import axios from 'axios';

// Single source of truth for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Validate configuration
if (!API_BASE_URL) {
    console.error('❌ VITE_API_URL is not set in environment variables!');
    console.error('Please check your .env file');
}

console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL,
    mode: import.meta.env.MODE,
});

// Create single axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log requests in development
        if (import.meta.env.DEV) {
            // console.log('📤 API Request:', {
            //     method: config.method?.toUpperCase(),
            //     url: `${config.baseURL}${config.url}`,
            // });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => {
        // Log responses in development
        if (import.meta.env.DEV) {
            console.log('📥 API Response:', {
                status: response.status,
                url: response.config.url,
            });
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            // Removed global redirect to prevent public pages from forcing login
            // ProtectedRoute will handle redirects for authenticated-only routes
        }

        // Log errors
        console.error('❌ API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
        });

        return Promise.reject(error);
    }
);

export default apiClient;
