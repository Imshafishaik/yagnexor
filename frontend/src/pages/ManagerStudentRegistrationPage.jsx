import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function ManagerStudentRegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register-student-invitation', formData);
      
      setSuccess(`Registration invitation sent successfully to ${formData.email}! The student will receive an email with login instructions.`);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
      });
      
    } catch (error) {
      console.error('Error sending student invitation:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to send invitation. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="text-white" size={24} />
                <h1 className="text-2xl font-bold text-white">Student Registration Invitation</h1>
              </div>
              <button
                onClick={() => navigate('/students')}
                className="flex items-center gap-2 text-white hover:text-blue-100 transition"
              >
                <ArrowLeft size={20} />
                Back to Students
              </button>
            </div>
            <p className="text-blue-100 mt-2">
              Send registration invitation to new students via email
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5" size={20} />
                <div className="text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-0.5" size={20} />
                <div className="text-green-700">{success}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Student will receive an email with registration instructions</li>
                  <li>• Email will contain a link to: http://localhost:5173/student-register</li>
                  <li>• Student can create their account and complete registration</li>
                  <li>• Student will be automatically assigned the "student" role</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      first_name: '',
                      last_name: '',
                      email: '',
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Clear
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Instructions for Manager</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>1.</strong> Enter the student's full name and email address
            </p>
            <p>
              <strong>2.</strong> Click "Send Invitation" to send the registration email
            </p>
            <p>
              <strong>3.</strong> The student will receive an email with a link to register
            </p>
            <p>
              <strong>4.</strong> After registration, the student will appear in the Students Management page
            </p>
            <p>
              <strong>5.</strong> You can then assign the student to classes and academic years
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
