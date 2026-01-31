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

    // Handle any 401 error immediately by clearing tokens
    if (error.response?.status === 401) {
      console.log('401 error detected, clearing tokens and redirecting to login');
      console.log('Error details:', error.response?.data);
      
      // Clear all tokens and auth state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.getState().logout();
      
      // Redirect to login immediately
      window.location.href = '/login';
      return Promise.reject(error);
    }

    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
