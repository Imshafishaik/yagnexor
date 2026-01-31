import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Users, Calendar, Clock, Key, Plus, Search, Filter, ChevronRight, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function CourseDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollToken, setEnrollToken] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, enrolled

  useEffect(() => {
    fetchCourses();
    if (user?.role === 'student') {
      fetchMyCourses();
    }
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const response = await api.get('/courses/student/my-courses');
      setMyCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching my courses:', error);
    }
  };

  const isEnrolled = (courseId) => {
    return myCourses.some(course => course.id === courseId);
  };

  const canEnroll = (course) => {
    if (user?.role !== 'student') return false;
    if (isEnrolled(course.id)) return false;
    if (course.max_students > 0 && course.current_enrollments >= course.max_students) return false;
    return true;
  };

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !enrollToken.trim()) {
      alert('Please enter a course token');
      return;
    }

    setEnrolling(true);
    try {
      const response = await api.post(`/courses/${selectedCourse.id}/enroll`, {
        course_token: enrollToken.trim()
      });

      alert('Successfully enrolled in course!');
      setShowEnrollModal(false);
      setSelectedCourse(null);
      setEnrollToken('');
      await fetchMyCourses();
      await fetchCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to enroll in course');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher_last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'enrolled') {
      return matchesSearch && isEnrolled(course.id);
    } else if (filterStatus === 'available') {
      return matchesSearch && canEnroll(course);
    } else {
      return matchesSearch;
    }
  });

  const getCourseStatus = (course) => {
    if (isEnrolled(course.id)) {
      return { status: 'enrolled', color: 'green', text: 'Enrolled', icon: CheckCircle };
    } else if (canEnroll(course)) {
      return { status: 'available', color: 'blue', text: 'Available', icon: Key };
    } else if (course.max_students > 0 && course.current_enrollments >= course.max_students) {
      return { status: 'full', color: 'red', text: 'Full', icon: AlertCircle };
    } else {
      return { status: 'unavailable', color: 'gray', text: 'Not Available', icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Dashboard</h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'teacher' ? 'Manage your courses and track student enrollments' : 
                 user?.role === 'student' ? 'Discover and enroll in courses using tokens' : 
                 'Browse all available courses'}
              </p>
            </div>
            {user?.role === 'teacher' && (
              <button
                onClick={() => navigate('/teacher/courses')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                <Plus size={20} />
                Create Course
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {user?.role === 'student' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{myCourses.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter(course => canEnroll(course)).length}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Key className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (course.current_enrollments || 0), 0)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Users className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search courses by title, description, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {user?.role === 'student' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    filterStatus === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Courses
                </button>
                <button
                  onClick={() => setFilterStatus('available')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    filterStatus === 'available' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setFilterStatus('enrolled')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    filterStatus === 'enrolled' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Enrolled
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No courses match your current filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const status = getCourseStatus(course);
              const StatusIcon = status.icon;

              return (
                <div key={course.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      {course.course_code && (
                        <p className="text-sm text-gray-500">Code: {course.course_code}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                      <StatusIcon size={12} />
                      {status.text}
                    </div>
                  </div>

                  {course.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  )}

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users size={16} />
                      <span>
                        {course.current_enrollments || 0} enrolled
                        {course.max_students > 0 && ` / ${course.max_students} max`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <BookOpen size={16} />
                      <span>
                        {course.teacher_first_name} {course.teacher_last_name}
                      </span>
                    </div>

                    {(course.start_date || course.end_date) && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={16} />
                        <span>
                          {course.start_date && new Date(course.start_date).toLocaleDateString()}
                          {course.start_date && course.end_date && ' - '}
                          {course.end_date && new Date(course.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {isEnrolled(course.id) && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Clock size={16} />
                        <span>Enrolled {new Date(course.enrolled_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {user?.role === 'teacher' && course.teacher_id === user.id && (
                      <button
                        onClick={() => navigate('/teacher/courses')}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-200"
                      >
                        Manage Course
                      </button>
                    )}

                    {user?.role === 'student' && canEnroll(course) && (
                      <button
                        onClick={() => handleEnrollClick(course)}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2"
                      >
                        <Key size={16} />
                        Enroll with Token
                      </button>
                    )}

                    {user?.role === 'student' && isEnrolled(course.id) && (
                      <button
                        onClick={() => navigate('/course-access')}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition duration-200 flex items-center justify-center gap-2"
                      >
                        <ChevronRight size={16} />
                        Access Course
                      </button>
                    )}

                    {user?.role === 'manager' || user?.role === 'tenant_admin' || user?.role === 'super_admin' ? (
                      <button
                        onClick={() => navigate('/courses')}
                        className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition duration-200"
                      >
                        View Details
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enroll Modal */}
        {showEnrollModal && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Enroll in Course</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-sm text-gray-600">
                  Instructor: {selectedCourse.teacher_first_name} {selectedCourse.teacher_last_name}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Token *
                </label>
                <input
                  type="text"
                  value={enrollToken}
                  onChange={(e) => setEnrollToken(e.target.value)}
                  placeholder="Enter 64-character course token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedCourse(null);
                    setEnrollToken('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling || !enrollToken.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {enrolling ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    'Enroll'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
