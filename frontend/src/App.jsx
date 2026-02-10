import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useTokenValidation } from './hooks/useTokenValidation';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import ManagerStudentRegistrationPage from './pages/ManagerStudentRegistrationPage';
import FacultyRegisterPage from './pages/FacultyRegisterPage';
import RoleBasedDashboard from './components/RoleBasedDashboard';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import AttendancePage from './pages/AttendancePage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import ExamManagementPage from './pages/ExamManagementPage';
import FeesPage from './pages/FeesPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import ClassesPage from './pages/ClassesPage';
import CoursesPage from './pages/CoursesPage';
import CourseDashboardPage from './pages/CourseDashboardPage';
import TenantsPage from './pages/TenantsPage';
import TeacherCoursePage from './pages/TeacherCoursePage';
import CourseAccessPage from './pages/CourseAccessPage';
import ManagerClassManagementPage from './pages/ManagerClassManagementPage';
import ManagerCourseManagementPage from './pages/ManagerCourseManagementPage';
import ManagerDepartmentManagementPage from './pages/ManagerDepartmentManagementPage';
import SubjectContentPage from './pages/SubjectContentPage';
import StudentContentPage from './pages/StudentContentPage';
import ClassSchedulePage from './pages/ClassSchedulePage';

function App() {
  const { checkAuth, user, isAuthenticated } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Use token validation hook for proactive checking
  useTokenValidation();

  useEffect(() => {
    console.log("App useEffect - checking auth...");
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token && refreshToken) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        console.log("App useEffect - token expires at:", new Date(payload.exp * 1000), "current time:", new Date(currentTime * 1000));
        
        if (payload.exp > currentTime) {
          const persistedUser = useAuthStore.getState().user;
          const persistedAuth = useAuthStore.getState().isAuthenticated;
          
        //   if (persistedUser && persistedAuth) {
        //     console.log("App useEffect - using persisted state");
        //     // Clear tokens immediately to force fresh login
        //     console.log("App useEffect - clearing old tokens to force fresh login");
        //     localStorage.removeItem('access_token');
        //     localStorage.removeItem('refresh_token');
        //     useAuthStore.getState().logout();
        //     setAuthChecked(true);
        //   } else {
        //     console.log("App useEffect - checking auth with valid token");
        //     checkAuth();
        //     setAuthChecked(true);
        //   }
        // } else {
        //   console.log("App useEffect - token expired, clearing tokens");
        //   localStorage.removeItem('access_token');
        //   localStorage.removeItem('refresh_token');
        //   useAuthStore.getState().logout();
        //   setAuthChecked(true);
        // }
        if (persistedUser && persistedAuth) {
            console.log("App useEffect - using persisted state");
            setAuthChecked(true);
          } else {
            console.log("App useEffect - checking auth with valid token");
            checkAuth();
          setAuthChecked(true);
        }
      } 
      } catch (error) {
        console.log("App useEffect - invalid token format, clearing tokens");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        useAuthStore.getState().logout();
        setAuthChecked(true);
      }
    } else {
      console.log("App useEffect - no tokens found");
      setAuthChecked(true);
    }
  }, [checkAuth]);

  // Listen for authentication state changes
  useEffect(() => {
    console.log("App useEffect - auth state changed:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

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

  console.log("App render - authChecked:", authChecked, "isAuthenticated:", isAuthenticated, "user:", user);

  // if (!authChecked) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Checking authentication...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <Router>
      <Routes>
        {/* Public routes - redirect to dashboard if authenticated */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/student-register" 
          element={!isAuthenticated ? <StudentRegisterPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/manager-student-registration" 
          element={isAuthenticated ? <PrivateRoute><ManagerStudentRegistrationPage /></PrivateRoute> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/faculty-register" 
          element={!isAuthenticated ? <FacultyRegisterPage /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes - redirect to login if not authenticated */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <PrivateRoute><RoleBasedDashboard /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/students"
          element={isAuthenticated ? <PrivateRoute><StudentsPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/faculty"
          element={isAuthenticated ? <PrivateRoute><FacultyPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/attendance"
          element={isAuthenticated ? <PrivateRoute><AttendancePage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/teacher-attendance"
          element={isAuthenticated ? <PrivateRoute><TeacherAttendancePage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/exams"
          element={isAuthenticated ? <PrivateRoute><ExamManagementPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/fees"
          element={isAuthenticated ? <PrivateRoute><FeesPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/users"
          element={isAuthenticated ? <PrivateRoute><UsersPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/roles"
          element={isAuthenticated ? <PrivateRoute><RolesPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/classes"
          element={isAuthenticated ? <PrivateRoute><ClassesPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/courses"
          element={isAuthenticated ? <PrivateRoute><CoursesPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/course-dashboard"
          element={isAuthenticated ? <PrivateRoute><CourseDashboardPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/teacher/courses"
          element={isAuthenticated ? <PrivateRoute><TeacherCoursePage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/course-access"
          element={isAuthenticated ? <PrivateRoute><CourseAccessPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/tenants"
          element={isAuthenticated ? <PrivateRoute><TenantsPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/manager/classes"
          element={isAuthenticated ? <PrivateRoute><ManagerClassManagementPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/manager/courses"
          element={isAuthenticated ? <PrivateRoute><ManagerCourseManagementPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/manager/departments"
          element={isAuthenticated ? <PrivateRoute><ManagerDepartmentManagementPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subject-content"
          element={isAuthenticated ? <PrivateRoute><SubjectContentPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/student-content"
          element={isAuthenticated ? <PrivateRoute><StudentContentPage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        <Route
          path="/class-schedule"
          element={isAuthenticated ? <PrivateRoute><ClassSchedulePage /></PrivateRoute> : <Navigate to="/login" replace />}
        />
        
        {/* Default routes - redirect based on authentication status */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="*" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
