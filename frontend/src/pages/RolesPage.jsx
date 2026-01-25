import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Search, Lock, Eye } from 'lucide-react';
import api from '../services/api';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
  });
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);

  const availablePermissions = [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.create',
    'roles.read',
    'roles.update',
    'roles.delete',
    'students.create',
    'students.read',
    'students.update',
    'students.delete',
    'faculty.create',
    'faculty.read',
    'faculty.update',
    'faculty.delete',
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'exams.create',
    'exams.read',
    'exams.update',
    'exams.delete',
    'fees.create',
    'fees.read',
    'fees.update',
    'fees.delete',
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const filtered = roles.filter(
      (role) =>
        role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [searchTerm, roles]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleForm);
      } else {
        await api.post('/roles', roleForm);
      }
      fetchRoles();
      setShowRoleForm(false);
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
      });
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
    });
    setShowRoleForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/roles/${id}`);
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        alert('Failed to delete role');
      }
    }
  };

  const handleViewPermissions = (role) => {
    setSelectedRole(role);
    setRolePermissions(role.permissions || []);
    setShowPermissionModal(true);
  };

  const togglePermission = (permission) => {
    setRolePermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    try {
      if (selectedRole) {
        await api.put(`/roles/${selectedRole.id}/permissions`, {
          permissions: rolePermissions,
        });
        fetchRoles();
        setShowPermissionModal(false);
        setSelectedRole(null);
        setRolePermissions([]);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Failed to save permissions');
    }
  };

  const handleCloseForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="text-indigo-600" />
              Roles Management
            </h1>
            <p className="text-gray-600 mt-1">Create and manage user roles with permissions</p>
          </div>
          <button
            onClick={() => {
              setEditingRole(null);
              setRoleForm({
                name: '',
                description: '',
              });
              setShowRoleForm(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Create Role
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Roles</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{roles.length}</p>
            </div>
            <Shield className="text-indigo-600" size={48} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by role name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Role Form Modal */}
        {showRoleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Role Name"
                  value={roleForm.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />

                <textarea
                  name="description"
                  placeholder="Role Description"
                  value={roleForm.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                ></textarea>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionModal && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage Permissions: {selectedRole.name}</h2>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setSelectedRole(null);
                    setRolePermissions([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 font-medium">{permission}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={handleSavePermissions}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Save Permissions
                  </button>
                  <button
                    onClick={() => {
                      setShowPermissionModal(false);
                      setSelectedRole(null);
                      setRolePermissions([]);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No roles found</p>
            </div>
          ) : (
            filteredRoles.map((role) => (
              <div
                key={role.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                  <Shield className="text-indigo-600" size={24} />
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 font-semibold mb-2">Permissions: {role.permissions?.length || 0}</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 3).map((perm) => (
                      <span
                        key={perm}
                        className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {role.permissions?.length > 3 && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewPermissions(role)}
                    className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 py-2 px-3 rounded border border-blue-200 transition text-sm font-semibold"
                  >
                    <Eye size={16} />
                    Permissions
                  </button>
                  <button
                    onClick={() => handleEdit(role)}
                    className="flex items-center justify-center text-gray-600 hover:bg-gray-100 py-2 px-3 rounded border border-gray-300 transition"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="flex items-center justify-center text-red-600 hover:bg-red-50 py-2 px-3 rounded border border-red-300 transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
