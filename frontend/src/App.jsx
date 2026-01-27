import React, { useEffect, useState } from 'react';
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
import ManagerClassManagementPage from './pages/ManagerClassManagementPage';
import ManagerCourseManagementPage from './pages/ManagerCourseManagementPage';
import ManagerDepartmentManagementPage from './pages/ManagerDepartmentManagementPage';

function App() {
  const { checkAuth, user, isAuthenticated } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    console.log("App useEffect - checking auth...");
    
    // Check for valid token first
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token && refreshToken) {
      // Check if token is valid (not expired)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          console.log("App useEffect - valid token found");
          setHasValidToken(true);
          
          // Check if we have persisted auth state
          const persistedUser = useAuthStore.getState().user;
          const persistedAuth = useAuthStore.getState().isAuthenticated;
          
          if (persistedUser && persistedAuth) {
            console.log("App useEffect - using persisted state");
            setAuthChecked(true);
          } else {
            console.log("App useEffect - checking fresh auth");
            const result = checkAuth();
            console.log("App useEffect - checkAuth result:", result);
            setAuthChecked(true);
          }
        } else {
          console.log("App useEffect - token expired");
          setHasValidToken(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error("App useEffect - invalid token format:", error);
        setHasValidToken(false);
        setAuthChecked(true);
      }
    } else {
      console.log("App useEffect - no token found");
      setHasValidToken(false);
      setAuthChecked(true);
    }
  }, [checkAuth]);

  // Periodic token refresh check
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRefreshToken = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const { isTokenExpiringSoon } = await import('./utils/tokenUtils');
          if (isTokenExpiringSoon(token, 10)) { // Check every 10 minutes, refresh if expiring within 10 minutes
            console.log('Periodic check: Token expiring soon, refreshing...');
            await useAuthStore.getState().refreshToken();
          }
        } catch (error) {
          console.error('Periodic token refresh failed:', error);
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  console.log("App render - authChecked:", authChecked, "hasValidToken:", hasValidToken, "user:", user, "isAuthenticated:", isAuthenticated);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={hasValidToken ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={hasValidToken ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/student-register" element={hasValidToken ? <Navigate to="/dashboard" replace /> : <StudentRegisterPage />} />
        <Route path="/faculty-register" element={hasValidToken ? <Navigate to="/dashboard" replace /> : <FacultyRegisterPage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <RoleBasedDashboard />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/students"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <StudentsPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/faculty"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <FacultyPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/attendance"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <AttendancePage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/teacher-attendance"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <TeacherAttendancePage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/exams"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <ExamsPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/fees"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <FeesPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/users"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <UsersPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/roles"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <RolesPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/classes"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <ClassesPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/courses"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <CoursesPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tenants"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <TenantsPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager/classes"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <ManagerClassManagementPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager/courses"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <ManagerCourseManagementPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager/departments"
          element={
            hasValidToken ? (
              <PrivateRoute>
                <ManagerDepartmentManagementPage />
              </PrivateRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Default routes */}
        <Route 
          path="/" 
          element={
            hasValidToken ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="*" 
          element={
            hasValidToken ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
