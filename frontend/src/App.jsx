import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import FacultyRegisterPage from './pages/FacultyRegisterPage';
import RoleBasedDashboard from './components/RoleBasedDashboard';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import AttendancePage from './pages/AttendancePage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import ExamsPage from './pages/ExamsPage';
import FeesPage from './pages/FeesPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import ClassesPage from './pages/ClassesPage';
import CoursesPage from './pages/CoursesPage';
import TenantsPage from './pages/TenantsPage';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student-register" element={<StudentRegisterPage />} />
        <Route path="/faculty-register" element={<FacultyRegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <RoleBasedDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/students"
          element={
            <PrivateRoute>
              <StudentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/faculty"
          element={
            <PrivateRoute>
              <FacultyPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <PrivateRoute>
              <AttendancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher-attendance"
          element={
            <PrivateRoute>
              <TeacherAttendancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <PrivateRoute>
              <ExamsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <PrivateRoute>
              <FeesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <PrivateRoute>
              <RolesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <PrivateRoute>
              <ClassesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <CoursesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            <PrivateRoute>
              <TenantsPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
