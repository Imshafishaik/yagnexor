import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  Users, 
  UserPlus, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Calendar,
  Building
} from 'lucide-react';

export default function ManagerClassManagementPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignFaculty, setShowAssignFaculty] = useState(null);
  const [showEnrollStudents, setShowEnrollStudents] = useState(null);
  const [classForm, setClassForm] = useState({
    name: '',
    course_id: '',
    academic_year_id: '',
    class_teacher_id: '',
    capacity: 30
  });

  // Fetch data
  useEffect(() => {
    fetchClasses();
    fetchCourses();
    fetchAcademicYears();
    fetchFaculty();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
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

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/faculty');
      setFaculty(response.data.faculty || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchClassSubjects = async (classId) => {
    try {
      const response = await api.get(`/api/classes/${classId}/subjects`);
      return response.data.subjects || [];
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      return [];
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const response = await api.get(`/api/classes/${classId}/students`);
      return response.data.students || [];
    } catch (error) {
      console.error('Error fetching class students:', error);
      return [];
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/classes', classForm);
      
      if (response.status === 201) {
        setShowCreateForm(false);
        setClassForm({
          name: '',
          course_id: '',
          academic_year_id: '',
          class_teacher_id: '',
          capacity: 30
        });
        fetchClasses();
      }
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleAssignFaculty = async (classId, facultyId) => {
    try {
      const response = await api.post(`/classes/${classId}/assign-faculty`, { faculty_id: facultyId });
      
      if (response.status === 200) {
        setShowAssignFaculty(null);
        fetchClasses();
      }
    } catch (error) {
      console.error('Error assigning faculty:', error);
    }
  };

  const handleEnrollStudents = async (classId, studentIds) => {
    try {
      const response = await api.post(`/classes/${classId}/enroll-students`, { student_ids: studentIds });
      
      if (response.status === 200) {
        setShowEnrollStudents(null);
        fetchClasses();
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      const response = await api.delete(`/api/classes/${classId}/students/${studentId}`);
      
      if (response.status === 200) {
        fetchClasses();
      }
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const toggleClassExpansion = async (classId) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
    } else {
      setExpandedClass(classId);
      // Fetch additional data when expanding
      const [subjectsData, studentsData] = await Promise.all([
        fetchClassSubjects(classId),
        fetchClassStudents(classId)
      ]);
      setSubjects(subjectsData);
      // Update the class with student data
      setClasses(prev => prev.map(cls => 
        cls.id === classId ? { ...cls, students: studentsData } : cls
      ));
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.class_teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailableStudents = (classItem) => {
    const enrolledStudentIds = classItem.students?.map(s => s.id) || [];
    return students.filter(student => !enrolledStudentIds.includes(student.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading class management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="text-blue-600 mr-3" size={24} />
              <h1 className="text-xl font-semibold text-gray-900">Class Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search classes..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Create Class
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="text-blue-600" size={24} />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{classes.length}</div>
            <div className="text-sm text-gray-600">Classes</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-green-600" size={24} />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Enrolled Students</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <GraduationCap className="text-purple-600" size={24} />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{faculty.length}</div>
            <div className="text-sm text-gray-600">Faculty</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-orange-600" size={24} />
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {academicYears.filter(ay => ay.is_current).length}
            </div>
            <div className="text-sm text-gray-600">Academic Years</div>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
          </div>
          
          <div className="divide-y">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{classItem.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {classItem.course_name}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {classItem.academic_year_name}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <UserCheck size={16} />
                        <span>{classItem.class_teacher_name || 'No teacher assigned'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{classItem.students?.length || 0}/{classItem.capacity} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building size={16} />
                        <span>Capacity: {classItem.capacity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleClassExpansion(classItem.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedClass === classItem.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                      onClick={() => setShowAssignFaculty(classItem.id)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Assign Faculty"
                    >
                      <UserCheck size={20} />
                    </button>
                    <button
                      onClick={() => setShowEnrollStudents(classItem.id)}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Enroll Students"
                    >
                      <UserPlus size={20} />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Class"
                    >
                      <Edit size={20} />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedClass === classItem.id && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Subjects */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Subjects</h4>
                        <div className="space-y-2">
                          {subjects.filter(s => s.course_id === classItem.course_id).map(subject => (
                            <div key={subject.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <BookOpen size={16} className="text-gray-500" />
                              <span className="text-sm text-gray-700">{subject.name}</span>
                              <span className="text-xs text-gray-500">({subject.code})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Enrolled Students */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Enrolled Students</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {classItem.students?.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-700">{student.full_name}</span>
                                <span className="text-xs text-gray-500">({student.roll_number})</span>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(classItem.id, student.id)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Remove Student"
                              >
                                <UserX size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={classForm.course_id}
                    onChange={(e) => setClassForm({ ...classForm, course_id: e.target.value })}
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={classForm.academic_year_id}
                    onChange={(e) => setClassForm({ ...classForm, academic_year_id: e.target.value })}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.year_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={classForm.class_teacher_id}
                    onChange={(e) => setClassForm({ ...classForm, class_teacher_id: e.target.value })}
                  >
                    <option value="">Select Faculty</option>
                    {faculty.map(fac => (
                      <option key={fac.id} value={fac.user_id}>
                        {fac.first_name} {fac.last_name} - {fac.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Faculty to Class</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {faculty.map(fac => (
                <div key={fac.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{fac.first_name} {fac.last_name}</div>
                    <div className="text-sm text-gray-500">{fac.specialization}</div>
                  </div>
                  <button
                    onClick={() => handleAssignFaculty(showAssignFaculty, fac.user_id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAssignFaculty(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {showEnrollStudents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enroll Students in Class</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {getAvailableStudents(classes.find(c => c.id === showEnrollStudents)).map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{student.full_name}</div>
                    <div className="text-sm text-gray-500">{student.roll_number}</div>
                  </div>
                  <button
                    onClick={() => handleEnrollStudents(showEnrollStudents, [student.id])}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Enroll
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEnrollStudents(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
