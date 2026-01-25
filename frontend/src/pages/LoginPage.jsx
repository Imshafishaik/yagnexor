import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    tenantDomain: '',
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    try {
      await login(formData.tenantDomain, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <LogIn className="text-white" size={28} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">YAGNEXOR</h1>
        <p className="text-center text-gray-600 mb-8">Educational Management Platform</p>

        {(error || localError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenantDomain" className="block text-sm font-medium text-gray-700 mb-1">
              Institution Domain
            </label>
            <input
              id="tenantDomain"
              name="tenantDomain"
              type="text"
              placeholder="e.g., lincolnhigh"
              value={formData.tenantDomain}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@institution.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Are you a faculty member?{' '}
            <Link to="/faculty-register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register here
            </Link>
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Are you a student?{' '}
            <Link to="/student-register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register here
            </Link>
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Don't have an institution?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Create Institution
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
