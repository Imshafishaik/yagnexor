import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { LogOut, BookOpen, Calendar, Award, FileText, User, Key, Download } from 'lucide-react';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState({
    attendance: 0,
    exams: 0,
    assignments: 0,
    fees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStudentData = async () => {
      try {
        // For now, use the user object directly as student info
        // In a real implementation, you might fetch additional student-specific data
        setStudentInfo(user);

        // Mock stats for now - in real app, these would come from API
        setStats({
          attendance: 92,
          exams: 3,
          assignments: 5,
          fees: 1250,
        });
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.first_name}!</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <User className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendance}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.exams}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assignments}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <BookOpen className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Fees</p>
                <p className="text-2xl font-bold text-gray-900">${stats.fees}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Award className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/course-dashboard')}
              className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition duration-200"
            >
              <BookOpen className="text-green-600" size={20} />
              <span className="text-green-700 font-medium">Course Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/course-access')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition duration-200"
            >
              <Key className="text-blue-600" size={20} />
              <span className="text-blue-700 font-medium">Enroll with Token</span>
            </button>
            <button
              onClick={() => navigate('/student-content')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition duration-200"
            >
              <Download className="text-purple-600" size={20} />
              <span className="text-purple-700 font-medium">Learning Materials</span>
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Calendar className="text-gray-600" size={20} />
              <span className="text-gray-700">View Attendance</span>
            </button>
            <button
              onClick={() => navigate('/exams')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <FileText className="text-gray-600" size={20} />
              <span className="text-gray-700">View Exams</span>
            </button>
            <button
              onClick={() => navigate('/fees')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Award className="text-gray-600" size={20} />
              <span className="text-gray-700">View Fees</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
