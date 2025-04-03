import axios from 'axios';

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '192.168.1.9:5000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// API methods
export const login = (credentials) => api.post('/api/auth/login', credentials); 
export const register = (userData) => api.post('/api/auth/register', userData);
export const verifyEmail = (token) => api.get(`/api/auth/verify-email?token=${token}`);
export const requestPasswordReset = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (token, newPassword, confirmPassword) => api.post('/api/auth/reset-password', { token, newPassword, confirmPassword });
export const setPassword = (email, password, confirmPassword) =>api.post('/api/auth/set-password', { email, password, confirmPassword });
export const checkToken = (token) => api.get(`/api/auth/check-token/${token}`);

export default api;