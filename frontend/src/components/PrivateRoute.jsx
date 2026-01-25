import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const token = localStorage.getItem('access_token');

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
