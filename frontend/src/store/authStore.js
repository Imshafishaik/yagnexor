import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';
import { isTokenExpired } from '../utils/tokenUtils';

export const useAuthStore = create(
  persist(
    (set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (tenantDomain, email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Login attempt - tenantDomain:", tenantDomain, "email:", email);
      const response = await api.post('/auth/login', {
        tenant_domain: tenantDomain,
        email,
        password,
      });

      console.log("Login response:", response.data);
      const { access_token, refresh_token, user } = response.data;

      console.log("Storing user data:", user);
      // Store tokens in localStorage (Zustand persist will handle user state)
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      console.log("Setting auth state with user:", user);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (tenantName, tenantDomain, adminEmail, adminPassword, adminFirstName, adminLastName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register?action=ndksd321423fndkfds86459', {
        tenant_name: tenantName,
        tenant_domain: tenantDomain,
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_first_name: adminFirstName,
        admin_last_name: adminLastName,
      });

      const { access_token, refresh_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  facultyRegister: async (tenantDomain, email, password, firstName, lastName, department, specialization, phone) => {
    set({ isLoading: true, error: null });
    try {
      const requestData = {
        tenant_domain: tenantDomain,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      };

      // Only include optional fields if they have values
      if (department) requestData.department = department;
      if (specialization) requestData.specialization = specialization;
      if (phone) requestData.phone = phone;

      const response = await api.post('/auth/faculty-register', requestData);

      // Don't auto-login after registration, just return success
      set({ isLoading: false });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Faculty registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  studentRegister: async (tenantDomain, email, password, firstName, lastName, rollNumber, classId, phone, address, dateOfBirth) => {
    set({ isLoading: true, error: null });
    try {
      const requestData = {
        tenant_domain: tenantDomain,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      };

      // Only include optional fields if they have values
      if (classId) requestData.class_id = classId;
      if (phone) requestData.phone = phone;
      if (address) requestData.address = address;
      if (dateOfBirth) requestData.date_of_birth = dateOfBirth;

      const response = await api.post('/auth/student-register', requestData);

      // Don't auto-login after registration, just return success
      set({ isLoading: false });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Student registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Zustand persist will automatically clear the persisted state when we set user to null
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('access_token');

    console.log("checkAuth - token:", token);

    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log("Token is expired, logging out user");
        // Clear expired tokens and auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
        });
        return null;
      }

      // If we have a valid token, check if we have persisted user state
      const currentState = useAuthStore.getState();
      console.log("checkAuth - current state user:", currentState.user);
      console.log("checkAuth - current state isAuthenticated:", currentState.isAuthenticated);
      
      if (currentState.user && currentState.isAuthenticated) {
        console.log("checkAuth - using persisted user state");
        return currentState.user;
      }
      
      // If we have token but no user state, try to restore from localStorage (fallback)
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          console.log("checkAuth - restored user from localStorage:", parsedUser);
          set({
            user: parsedUser,
            isAuthenticated: true,
          });
          return parsedUser;
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    } else {
      console.log("No token found in localStorage");
      set({
        user: null,
        isAuthenticated: false,
      });
    }
    return null;
  },

  refreshToken: async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      console.log('No refresh token available');
      return false;
    }

    try {
      console.log('Proactively refreshing token...');
      const response = await api.post('/auth/refresh', { refresh_token });
      const { access_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      console.log('Proactive token refresh successful');
      return true;
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
      // If refresh fails, logout the user
      useAuthStore.getState().logout();
      return false;
    }
  },
}),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
