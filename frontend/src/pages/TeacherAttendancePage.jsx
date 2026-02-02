import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Users, Calendar, CheckCircle, XCircle, Clock, Save, History, ChevronLeft } from 'lucide-react';

export default function TeacherAttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('take');
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTeacherClasses();
  }, [user, navigate]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/teacher/classes?teacher_id=${user.id}`);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/class/${classId}?date=${selectedDate}`);
      const studentsData = response.data.students || [];
      setStudents(studentsData);

      // Initialize attendance records
      const records = {};
      studentsData.forEach(student => {
        records[student.id] = {
          status: student.status || 'PRESENT',
          remarks: student.remarks || ''
        };
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/attendance/class/${selectedClass}/history?limit=30`);
      setAttendanceHistory(response.data.attendance_history || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    if (activeTab === 'take') {
      fetchClassStudents(classId);
    } else {
      fetchAttendanceHistory();
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      alert('Please select a class and date');
      return;
    }

    try {
      setSaving(true);
      const attendanceData = Object.entries(attendanceRecords).map(([studentId, record]) => ({
        student_id: studentId,
        status: record.status,
        remarks: record.remarks
      }));

      await api.post(`/attendance/class/${selectedClass}`, {
        attendance_date: selectedDate,
        attendance_records: attendanceData,
        teacher_remarks: teacherRemarks
      });

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'ABSENT':
        return <XCircle className="text-red-500" size={20} />;
      case 'LATE':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && classes.length === 0) {
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
                <span>Back</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Attendance</h1>
            </div>
            <div className="text-gray-700">Welcome, {user?.first_name}!</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass || ''}
                onChange={(e) => handleClassSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'take' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {selectedClass && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b">
              <nav className="flex -mb-px">
                <button
                  onClick={() => {
                    setActiveTab('take');
                    fetchClassStudents(selectedClass);
                  }}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'take'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users size={16} />
                    <span>Take Attendance</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    fetchAttendanceHistory();
                  }}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <History size={16} />
                    <span>Attendance History</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Take Attendance Tab */}
        {activeTab === 'take' && selectedClass && (
          <div className="space-y-6">
            {students.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mark Attendance - {selectedDate}
                    </h3>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teacher Remarks (Optional)
                    </label>
                    <textarea
                      value={teacherRemarks}
                      onChange={(e) => setTeacherRemarks(e.target.value)}
                      placeholder="Any general remarks about the class..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4">
                    {students.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex space-x-2">
                            {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student.id, status)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition duration-200 ${
                                  attendanceRecords[student.id]?.status === status
                                    ? getStatusColor(status)
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="Remarks..."
                            value={attendanceRecords[student.id]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance History Tab */}
        {activeTab === 'history' && selectedClass && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
              
              {attendanceHistory.length > 0 ? (
                <div className="space-y-4">
                  {attendanceHistory.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="text-gray-400" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">{record.attendance_date}</p>
                          {record.teacher_remarks && (
                            <p className="text-sm text-gray-500">{record.teacher_remarks}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700">Present: {record.present}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-gray-700">Absent: {record.absent}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-700">Late: {record.late}</span>
                        </div>
                        <div className="text-gray-500">
                          Total: {record.total_students}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found for this class.
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedClass && classes.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500">You haven't been assigned to any classes yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
