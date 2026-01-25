import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Users, BookOpen, LogOut, Users2, BarChart3, FileText, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    classes: 0,
    attendancePercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [studentsRes, facultyRes] = await Promise.all([
          api.get('/students'),
          api.get('/faculty'),
        ]).catch(() => [{ data: { students: [] } }, { data: { faculty: [] } }]);

        setStats({
          students: studentsRes.data.students?.length || 0,
          faculty: facultyRes.data.faculty?.length || 0,
          classes: 0,
          attendancePercentage: 85,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const modules = [
    { name: 'Students', icon: Users, color: 'bg-blue-50 text-blue-600', path: '/students' },
    { name: 'Faculty', icon: BookOpen, color: 'bg-green-50 text-green-600', path: '/faculty' },
    { name: 'Attendance', icon: BarChart3, color: 'bg-yellow-50 text-yellow-600', path: '/attendance' },
    { name: 'Exams', icon: FileText, color: 'bg-purple-50 text-purple-600', path: '/exams' },
    { name: 'Fees', icon: DollarSign, color: 'bg-indigo-50 text-indigo-600', path: '/fees' },
    { name: 'Users', icon: Users2, color: 'bg-pink-50 text-pink-600', path: '/users' },
  ];

  const handleModuleClick = (path) => {
    if (path !== '#') {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">YAGNEXOR</h1>
            <p className="text-gray-600 text-sm">Welcome, {user?.first_name} ({user?.role})</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Students</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.students}</p>
                  </div>
                  <Users className="text-blue-600" size={40} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Faculty</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.faculty}</p>
                  </div>
                  <BookOpen className="text-green-600" size={40} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Classes</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.classes}</p>
                  </div>
                  <BarChart3 className="text-yellow-600" size={40} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Avg Attendance</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.attendancePercentage}%</p>
                  </div>
                  <BarChart3 className="text-indigo-600" size={40} />
                </div>
              </div>
            </div>

            {/* Modules Grid */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div
                      key={module.name}
                      onClick={() => handleModuleClick(module.path)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
                    >
                      <div className={`${module.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                        <Icon size={32} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">{module.name}</h3>
                      <p className="text-gray-600 text-sm mt-2">Manage {module.name.toLowerCase()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
