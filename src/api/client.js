import axios from 'axios';

// Get the API base URL with detailed logging
const apiBaseURL = import.meta.env.VITE_API_URL;
console.log('🔧 API Client Configuration:');
console.log('  - Base URL:', apiBaseURL);
console.log('  - Environment:', import.meta.env.MODE);
console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);

const client = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to attach the token and log requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request details
    // console.log('📤 API Request:', {
    //   method: config.method?.toUpperCase(),
    //   url: config.url,
    //   baseURL: config.baseURL,
    //   fullURL: `${config.baseURL}${config.url}`,
    //   data: config.data,
    //   headers: config.headers,
    // });

    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses and errors
client.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      isTimeout: error.code === 'ECONNABORTED',
      isNetworkError: error.message === 'Network Error',
    });
    return Promise.reject(error);
  }
);

export default client;
