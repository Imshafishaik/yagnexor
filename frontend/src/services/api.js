import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { isTokenExpiringSoon, isTokenExpired } from '../utils/tokenUtils';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Response interceptor - handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 error only for actual authentication failures
    if (error.response?.status === 401) {
      console.log('401 error detected:', error.response?.data);
      
      // Only logout if it's a genuine authentication failure
      // Don't logout for role-based access denials
      if (error.response?.data?.error === 'User role not found' || 
          error.response?.data?.error === 'Invalid token' ||
          error.response?.data?.error === 'Token expired') {
        console.log('Authentication failure, clearing tokens and redirecting to login');
        
        // Clear all tokens and auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        useAuthStore.getState().logout();
        
        // Redirect to login immediately
        window.location.href = '/login';
      } else {
        console.log('Access denied but not logging out:', error.response?.data);
      }
      return Promise.reject(error);
    }

    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
