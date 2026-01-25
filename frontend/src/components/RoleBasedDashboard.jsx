import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import DashboardPage from '../pages/DashboardPage';
import StudentDashboardPage from '../pages/StudentDashboardPage';
import TeacherDashboardPage from '../pages/TeacherDashboardPage';
import SuperAdminDashboardPage from '../pages/SuperAdminDashboardPage';

export default function RoleBasedDashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to super admin dashboard if user role is super_admin
  if (user.role === 'super_admin') {
    return <SuperAdminDashboardPage />;
  }

  // Route to student dashboard if user role is student
  if (user.role === 'student') {
    return <StudentDashboardPage />;
  }

  // Route to teacher dashboard if user role is faculty or teacher
  if (user.role === 'faculty' || user.role === 'teacher') {
    return <TeacherDashboardPage />;
  }

  // Route to admin/staff dashboard for manager and principal roles
  if (user.role === 'manager' || user.role === 'principal') {
    return <DashboardPage />;
  }

  // Default to admin dashboard for all other roles
  return <DashboardPage />;
}
