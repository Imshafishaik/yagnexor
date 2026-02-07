import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../services/api';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    department_id: '',
    qualification: '',
    specialization: '',
    phone: '',
    office_number: '',
  });

  useEffect(() => {
    fetchFaculty();
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  useEffect(() => {
    const filtered = faculty.filter(
      (f) =>
        f.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.qualification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFaculty(filtered);
  }, [searchTerm, faculty]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await api.get('/faculty');
      setFaculty(response.data.faculty || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form data:', formData,editingId);
    try {
      if (editingId) {
        console.log('Editing faculty member:', editingId, formData);
        await api.put(`/faculty/${editingId}`, formData);
      } else {
        console.log('Adding new faculty member:', formData);
        await api.post('/faculty', formData);
      }
      fetchFaculty();
      setShowForm(false);
      setFormData({
        user_id: '',
        department_id: '',
        qualification: '',
        specialization: '',
        phone: '',
        office_number: '',
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('Failed to save faculty record');
    }
  };

  const handleEdit = (f) => {
    setFormData(f);
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await api.delete(`/faculty/${id}`);
        fetchFaculty();
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert('Failed to delete faculty');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="text-green-600" />
              Faculty Management
            </h1>
            <p className="text-gray-600 mt-1">Manage faculty members and their details</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                user_id: '',
                department_id: '',
                qualification: '',
                specialization: '',
                phone: '',
                office_number: '',
              });
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Add Faculty
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, qualification, specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Faculty' : 'Add Faculty Member'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select User</option>
                    {users.filter(u => u.role === 'faculty' || u.role === 'teacher').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="qualification"
                    placeholder="Qualification (e.g., M.Sc, B.Tech)"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="specialization"
                    placeholder="Specialization (e.g., Mathematics)"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    name="office_number"
                    placeholder="Office Number"
                    value={formData.office_number}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {editingId ? 'Update Faculty' : 'Add Faculty'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Faculty List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No faculty members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Qualification</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Specialization</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Office #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => (
                    <tr key={f.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{f.first_name} {f.last_name}</div>
                        <div className="text-xs text-gray-500">ID: {f.user_id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{f.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{f.qualification}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{f.specialization}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{f.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{f.office_number}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          f.employment_status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {f.employment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="text-green-600 hover:text-green-800 transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
