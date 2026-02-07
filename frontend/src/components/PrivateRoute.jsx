import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  console.log('🔐 PrivateRoute - isAuthenticated:', isAuthenticated);
  console.log('🔐 PrivateRoute - token exists:', !!localStorage.getItem('access_token'));

  useEffect(() => {
    console.log('🔐 PrivateRoute - checking auth...');
    checkAuth();
  }, [checkAuth]);

  const token = localStorage.getItem('access_token');

  if (!token || !isAuthenticated) {
    console.log('🚫 PrivateRoute - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ PrivateRoute - rendering children');
  return children;
}
