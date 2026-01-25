import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import DashboardPage from '../pages/DashboardPage';
import StudentDashboardPage from '../pages/StudentDashboardPage';
import TeacherDashboardPage from '../pages/TeacherDashboardPage';

export default function RoleBasedDashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to student dashboard if user role is student
  if (user.role === 'student') {
    return <StudentDashboardPage />;
  }

  // Route to teacher dashboard if user role is faculty or teacher
  if (user.role === 'faculty' || user.role === 'teacher') {
    return <TeacherDashboardPage />;
  }

  // Default to admin/staff dashboard for all other roles
  return <DashboardPage />;
}
