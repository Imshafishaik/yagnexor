import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (tenantDomain, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', {
        tenant_domain: tenantDomain,
        email,
        password,
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
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (tenantName, tenantDomain, adminEmail, adminPassword, adminFirstName, adminLastName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
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
      if (rollNumber) requestData.roll_number = rollNumber;
      if (classId) requestData.class_id = classId;
      if (phone) requestData.phone = phone;
      if (address) requestData.address = address;
      if (dateOfBirth) requestData.date_of_birth = dateOfBirth;

      const response = await api.post('/auth/student-register', requestData);

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
      const errorMessage = error.response?.data?.error || 'Student registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    if (token && user) {
      set({
        user: JSON.parse(user),
        isAuthenticated: true,
      });
    }
  },
}));
