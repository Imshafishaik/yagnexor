import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Building2, Users, UserCheck, BookOpen, Eye } from 'lucide-react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [tenantStats, setTenantStats] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants');
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantStats = async (tenantId) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/stats`);
      setTenantStats(response.data);
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      setError('Failed to fetch tenant statistics');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const requestData = {
        name: formData.name,
        domain: formData.domain,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        admin_first_name: formData.admin_first_name,
        admin_last_name: formData.admin_last_name,
      };

      if (editingTenant) {
        await api.put(`/tenants/${editingTenant.id}`, {
          name: formData.name,
          domain: formData.domain,
          is_active: formData.is_active,
        });
        setEditingTenant(null);
      } else {
        await api.post('/tenants', requestData);
      }

      setShowForm(false);
      resetForm();
      fetchTenants();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save tenant');
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain,
      admin_email: '',
      admin_password: '',
      admin_first_name: '',
      admin_last_name: '',
      is_active: tenant.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (tenantId) => {
    if (!window.confirm('Are you sure you want to deactivate this tenant? This action can be reversed.')) {
      return;
    }

    try {
      await api.delete(`/tenants/${tenantId}`);
      fetchTenants();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to deactivate tenant');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      admin_email: '',
      admin_password: '',
      admin_first_name: '',
      admin_last_name: '',
      is_active: true,
    });
  };

  const openForm = () => {
    setEditingTenant(null);
    resetForm();
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Institution Management</h1>
        <button
          onClick={openForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} />
          Add Institution
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {editingTenant ? 'Edit Institution' : 'Add New Institution'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain *
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., lincolnhigh"
                required
              />
            </div>

            {!editingTenant && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.admin_first_name}
                    onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.admin_last_name}
                    onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </>
            )}

            {editingTenant && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            )}

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {editingTenant ? 'Update Institution' : 'Create Institution'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTenant(null);
                  resetForm();
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenant Statistics Modal */}
      {showStats && selectedTenant && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Statistics: {selectedTenant.name}
            </h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users size={20} />
                <span className="font-semibold">Total Users</span>
              </div>
              <div className="text-2xl font-bold">{tenantStats.total_users || 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <UserCheck size={20} />
                <span className="font-semibold">Students</span>
              </div>
              <div className="text-2xl font-bold">{tenantStats.students || 0}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Users size={20} />
                <span className="font-semibold">Faculty</span>
              </div>
              <div className="text-2xl font-bold">{tenantStats.faculty || 0}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <BookOpen size={20} />
                <span className="font-semibold">Classes</span>
              </div>
              <div className="text-2xl font-bold">{tenantStats.classes || 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Institution</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Domain</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Users</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Students</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculty</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No institutions found. Click "Add Institution" to create your first institution.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-blue-600" />
                      <span className="font-medium">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">{tenant.domain}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tenant.user_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tenant.student_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tenant.faculty_count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          fetchTenantStats(tenant.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="View Statistics"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit Institution"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Deactivate Institution"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
