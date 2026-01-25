import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../services/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  console.log(".......students",students);
  const [filteredStudents, setFilteredStudents] = useState([]);
  console.log(".......filteredStudents",filteredStudents);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  console.log(".......users",users);
  
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    class_id: '',
    academic_year_id: '',
    roll_number: '',
    enrollment_number: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    address: '',
  });
  console.log(".......formData",formData);
  
  useEffect(() => {
    fetchStudents();
    fetchUsers();
    fetchClasses();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      console.log(".......response",response);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic-years');
      setAcademicYears(response.data.academicYears || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.user_id.trim()) {
      setError('User ID is required');
      return false;
    }
    if (!formData.class_id.trim()) {
      setError('Class ID is required');
      return false;
    }
    if (!formData.academic_year_id.trim()) {
      setError('Academic Year ID is required');
      return false;
    }
    if (!formData.roll_number.trim()) {
      setError('Roll Number is required');
      return false;
    }
    if (!formData.enrollment_number.trim()) {
      setError('Enrollment Number is required');
      return false;
    }
    if (!formData.date_of_birth) {
      setError('Date of Birth is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, formData);
      } else {
        await api.post('/students', formData);
      }
      fetchStudents();
      setShowForm(false);
      setFormData({
        user_id: '',
        class_id: '',
        academic_year_id: '',
        roll_number: '',
        enrollment_number: '',
        date_of_birth: '',
        gender: 'Male',
        phone: '',
        address: '',
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save student. Please check your inputs.';
      setError(errorMessage);
    }
  };

  const handleEdit = (student) => {
    setFormData(student);
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.delete(`/students/${id}`);
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student');
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
              <Users className="text-blue-600" />
              Students Management
            </h1>
            <p className="text-gray-600 mt-1">Manage student admissions and records</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                user_id: '',
                class_id: '',
                academic_year_id: '',
                roll_number: '',
                enrollment_number: '',
                date_of_birth: '',
                gender: 'Male',
                phone: '',
                address: '',
              });
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Add Student
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by roll number, enrollment number, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <select
                      name="class_id"
                      value={formData.class_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                    <select
                      name="academic_year_id"
                      value={formData.academic_year_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an Academic Year</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.year_name} ({year.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    name="roll_number"
                    placeholder="Roll Number *"
                    value={formData.roll_number}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="enrollment_number"
                    placeholder="Enrollment Number *"
                    value={formData.enrollment_number}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    name="date_of_birth"
                    placeholder="Date of Birth *"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number *"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <textarea
                  name="address"
                  placeholder="Address *"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                ></textarea>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {editingId ? 'Update Student' : 'Add Student'}
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

        {/* Students List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Roll #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Enrollment #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents?.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">{student.first_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.roll_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.enrollment_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.gender}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          student.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
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
