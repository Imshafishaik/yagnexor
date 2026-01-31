import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { LogOut, Users, Calendar, BookOpen, Award, FileText, User, CheckCircle } from 'lucide-react';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    attendanceToday: 0,
    pendingAssignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchTeacherData = async () => {
      try {
        // For now, use mock data to avoid API errors
        // In a real implementation, you would fetch teacher's classes and students
        setTeacherInfo({ classes: [] });

        // Mock stats for now - in real app, these would come from API
        setStats({
          classes: 0,
          students: 0,
          attendanceToday: 0,
          pendingAssignments: 3,
        });
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
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
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
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
        {/* Teacher Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500">Role: {user?.role}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.classes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceToday}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FileText className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/course-dashboard')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition duration-200"
            >
              <BookOpen className="text-purple-600" size={20} />
              <span className="text-purple-700 font-medium">Course Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/teacher/courses')}
              className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition duration-200"
            >
              <BookOpen className="text-green-600" size={20} />
              <span className="text-green-700 font-medium">Manage Courses</span>
            </button>
            <button
              onClick={() => navigate('/teacher-attendance')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition duration-200"
            >
              <Calendar className="text-blue-600" size={20} />
              <span className="text-blue-700 font-medium">Take Attendance</span>
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Users className="text-gray-600" size={20} />
              <span className="text-gray-700">View Reports</span>
            </button>
            <button
              onClick={() => navigate('/exams')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <FileText className="text-gray-600" size={20} />
              <span className="text-gray-700">Manage Exams</span>
            </button>
            <button
              onClick={() => navigate('/students')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Award className="text-gray-600" size={20} />
              <span className="text-gray-700">View Students</span>
            </button>
          </div>
        </div>

        {/* Recent Classes */}
        {teacherInfo?.classes && teacherInfo.classes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Classes</h3>
            <div className="space-y-4">
              {teacherInfo.classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <BookOpen className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cls.name}</p>
                      {cls.section && <p className="text-sm text-gray-500">Section: {cls.section}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/teacher-attendance?class=${cls.id}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                  >
                    Take Attendance
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!teacherInfo?.classes || teacherInfo.classes.length === 0) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500">You haven't been assigned to any classes yet. Please contact your administrator.</p>
          </div>
        )}
      </main>
    </div>
  );
}
