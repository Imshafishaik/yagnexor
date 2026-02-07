import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Eye, Search } from 'lucide-react';
import api from '../services/api';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    subject_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    remarks: '',
  });

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users');
      setStudents(response.data.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Helper functions to get names by ID
  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : studentId;
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  useEffect(() => {
    const filtered = attendance.filter(
      (a) => {
        const studentName = getStudentName(a.student_id);
        const subjectName = getSubjectName(a.subject_id);
        return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               a.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               a.subject_id?.toLowerCase().includes(searchTerm.toLowerCase());
      }
    );
    setFilteredAttendance(filtered);
  }, [searchTerm, attendance, students, subjects]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance');
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (studentId) => {
    try {
      const response = await api.get(`/attendance/summary/${studentId}`);
      setSelectedSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
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
    try {
      await api.post('/attendance', formData);
      fetchAttendance();
      setShowForm(false);
      setFormData({
        student_id: '',
        subject_id: '',
        attendance_date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        remarks: '',
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const statusColors = {
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    EXCUSED: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-yellow-600" />
              Attendance Management
            </h1>
            <p className="text-gray-600 mt-1">Track and manage student attendance records</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setFormData({
                student_id: '',
                subject_id: '',
                attendance_date: new Date().toISOString().split('T')[0],
                status: 'PRESENT',
                remarks: '',
              });
            }}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Mark Attendance
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by student name, subject name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Mark Attendance</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <select
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select Student</option>
                  {students.filter(s => s.role === 'student').map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>

                <select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  name="attendance_date"
                  value={formData.attendance_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>

                <textarea
                  name="remarks"
                  placeholder="Remarks (optional)"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                ></textarea>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Mark
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

        {/* Summary Modal */}
        {selectedSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Attendance Summary</h2>
                <button
                  onClick={() => setSelectedSummary(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Total Days</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedSummary.total_days}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Present</p>
                    <p className="text-3xl font-bold text-green-600">{selectedSummary.present_days}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <p className="text-gray-600 text-sm">Attendance %</p>
                  <p className="text-4xl font-bold text-yellow-600">{selectedSummary.attendance_percentage}%</p>
                </div>

                <button
                  onClick={() => setSelectedSummary(null)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{getStudentName(record.student_id)}</div>
                          <div className="text-xs text-gray-500">ID: {record.student_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <div className="font-medium">{getSubjectName(record.subject_id)}</div>
                          <div className="text-xs text-gray-500">ID: {record.subject_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.attendance_date}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          statusColors[record.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.remarks}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchSummary(record.student_id)}
                          className="text-yellow-600 hover:text-yellow-800 transition"
                        >
                          <Eye size={18} />
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
