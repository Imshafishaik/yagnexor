import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { isTokenExpired, getTimeUntilExpiration } from '../utils/tokenUtils';

export const useTokenValidation = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const checkTokenExpiration = () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('No token found during periodic check');
        logout();
        return;
      }

      if (isTokenExpired(token)) {
        console.log('Token expired during periodic check, logging out');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        logout();
        window.location.href = '/login';
        return;
      }

      // Log time until expiration for debugging
      const timeUntilExpiration = getTimeUntilExpiration(token);
      console.log(`Token expires in ${Math.floor(timeUntilExpiration / 60)} minutes`);
    };

    // Check immediately
    checkTokenExpiration();

    // Set up periodic check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    // Also check when the page becomes visible again (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, logout]);
};
