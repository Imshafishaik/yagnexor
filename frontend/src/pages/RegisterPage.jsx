import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Building2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantDomain: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
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

    if (formData.adminPassword.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(
        formData.tenantName,
        formData.tenantDomain,
        formData.adminEmail,
        formData.adminPassword,
        formData.adminFirstName,
        formData.adminLastName
      );
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-green-600 p-3 rounded-full">
            <Building2 className="text-white" size={28} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Institution</h1>
        <p className="text-center text-gray-600 mb-8">Register your educational institution</p>

        {(error || localError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name
            </label>
            <input
              id="tenantName"
              name="tenantName"
              type="text"
              placeholder="e.g., Lincoln High School"
              value={formData.tenantName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Admin User</h3>

            <div>
              <label htmlFor="adminFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="adminFirstName"
                name="adminFirstName"
                type="text"
                placeholder="Admin first name"
                value={formData.adminFirstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="adminLastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="adminLastName"
                name="adminLastName"
                type="text"
                placeholder="Admin last name"
                value={formData.adminLastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="admin@institution.com"
                value={formData.adminEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password (minimum 8 characters)
              </label>
              <input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="Enter a strong password"
                value={formData.adminPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 mt-6"
          >
            {isLoading ? 'Creating...' : 'Create Institution'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already registered?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
