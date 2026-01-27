import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { isTokenExpiringSoon } from '../utils/tokenUtils';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token and check expiration
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    // Check if token is expired first
    const { isTokenExpired } = await import('../utils/tokenUtils');
    if (isTokenExpired(token)) {
      console.log('Token is expired, forcing refresh...');
      try {
        const refreshSuccess = await useAuthStore.getState().refreshToken();
        if (refreshSuccess) {
          const newToken = localStorage.getItem('access_token');
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        console.error('Forced token refresh failed:', error);
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    } else if (isTokenExpiringSoon(token, 5)) {
      console.log('Token is expiring soon, attempting proactive refresh...');
      try {
        const refreshSuccess = await useAuthStore.getState().refreshToken();
        if (refreshSuccess) {
          const newToken = localStorage.getItem('access_token');
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
        // Let the response interceptor handle the failure
      }
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (refresh_token) {
          console.log('Attempting to refresh token...');
          const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token });
          const { access_token } = response.data;

          console.log('Token refreshed successfully');
          localStorage.setItem('access_token', access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Retry the original request
          return api(originalRequest);
        } else {
          console.log('No refresh token available');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Also clear Zustand auth state
        const authStore = useAuthStore.getState();
        authStore.logout();
        
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
