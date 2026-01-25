import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard',
      description: 'System overview and statistics'
    },
    {
      title: 'Institutions',
      icon: Building2,
      path: '/tenants',
      description: 'Manage educational institutions'
    },
    {
      title: 'System Users',
      icon: Users,
      path: '/users',
      description: 'Manage system-wide users'
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings',
      description: 'System configuration'
    }
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-600" size={28} />
            <span className="text-xl font-bold text-gray-800">SuperAdmin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4">
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Logged in as</div>
            <div className="font-medium text-gray-800">{user?.first_name} {user?.last_name}</div>
            <div className="text-sm text-blue-600">Super Administrator</div>
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
              >
                <item.icon size={20} className="group-hover:text-blue-600" />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="text-blue-600" size={24} />
              <span className="font-semibold text-gray-800">YAGNEXOR</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-600">Manage all educational institutions and system settings</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="text-blue-600" size={24} />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">12</div>
              <div className="text-sm text-gray-600">Institutions</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <Users className="text-green-600" size={24} />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">3,847</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <Shield className="text-purple-600" size={24} />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">11</div>
              <div className="text-sm text-gray-600">Active Tenants</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="text-orange-600" size={24} />
                <span className="text-sm text-gray-500">Growth</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">+23%</div>
              <div className="text-sm text-gray-600">This Month</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/tenants"
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Building2 className="text-blue-600" size={20} />
                  <div>
                    <div className="font-medium text-gray-800">Add New Institution</div>
                    <div className="text-sm text-gray-600">Create a new educational institution</div>
                  </div>
                </Link>

                <Link
                  to="/users"
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Users className="text-green-600" size={20} />
                  <div>
                    <div className="font-medium text-gray-800">Manage Users</div>
                    <div className="text-sm text-gray-600">View and manage system users</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">New institution registered</div>
                    <div className="text-xs text-gray-500">Lincoln High School - 2 hours ago</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">System backup completed</div>
                    <div className="text-xs text-gray-500">5 hours ago</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">User registration spike</div>
                    <div className="text-xs text-gray-500">23 new users today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
