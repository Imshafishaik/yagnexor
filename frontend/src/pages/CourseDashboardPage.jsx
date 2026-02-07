import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { BookOpen, Users, Calendar, Clock, Key, Plus, Search, Filter, ChevronRight, CheckCircle, AlertCircle, Loader, Building, LogOut } from 'lucide-react';

export default function CourseDashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  console.log('🚀 CourseDashboardPage component mounted!');
  console.log('👤 Current user:', user);
  console.log('🔑 Token exists:', !!localStorage.getItem('access_token'));
  
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollToken, setEnrollToken] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, enrolled

  // Force API call on mount
  React.useEffect(() => {
    console.log('🔄 Component mounted, forcing API call...');
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('👤 User available, fetching courses...');
      fetchCourses();
      if (user.role === 'student') {
        fetchMyCourses();
      }
    } else {
      console.log('⏳ User not available yet, waiting...');
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      console.log('🔄 Fetching courses...');
      const response = await api.get('/courses');
      console.log('📦 API Response:', response);
      console.log('📊 Courses data:', response.data);
      console.log('📈 Courses count:', response.data.courses?.length);
      
      setCourses(response.data.courses || []);
      console.log('✅ Courses set:', response.data.courses?.length);
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      setCourses([]);
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete');
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
    if (user?.role !== 'student') {
      console.log('❌ Cannot enroll: User role is not student:', user?.role);
      return false;
    }
    if (isEnrolled(course.id)) {
      console.log('❌ Cannot enroll: Already enrolled in course');
      return false;
    }
    console.log('✅ Can enroll: User is student and not enrolled');
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
      const enrollmentData = {
        course_token: enrollToken.trim()
      };
      console.log('📤 Sending enrollment request:', enrollmentData);
      console.log('🎯 Course ID:', selectedCourse.id);
      
      const response = await api.post(`/courses/${selectedCourse.id}/enroll`, enrollmentData);
      
      console.log('✅ Enrollment response:', response);
      alert('Successfully enrolled in course!');
      setShowEnrollModal(false);
      setSelectedCourse(null);
      setEnrollToken('');
      await fetchMyCourses();
      await fetchCourses();
    } catch (error) {
      console.error('❌ Error enrolling in course:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      // Handle specific foreign key constraint error
      if (error.response?.data?.error?.includes('foreign key constraint') || 
          error.response?.data?.error?.includes('students')) {
        alert('Enrollment failed: Your student account is not properly set up. Please contact an administrator or ensure you are registered as a student.');
      } else if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to enroll in course. Please check your account setup and try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const copyCourseToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      alert('Course token copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy course token:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code?.toLowerCase().includes(searchTerm.toLowerCase());

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
        {/* Temporary Debug Info */}
        <div className="mb-4 p-4 bg-yellow-100 rounded">
          <p><strong>Loading:</strong> {loading.toString()}</p>
          <p><strong>Courses Count:</strong> {courses.length}</p>
          <p><strong>Filtered Count:</strong> {filteredCourses.length}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>User Email:</strong> {user?.email}</p>
          <p><strong>User Role:</strong> {user?.role}</p>
          <p><strong>Is Student:</strong> {user?.role === 'student' ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Can Enroll:</strong> {courses.length > 0 ? (canEnroll(courses[0]) ? '✅ Yes' : '❌ No') : 'N/A'}</p>
          {courses.length > 0 && (
            <div className="mt-2">
              <p><strong>First Course Code:</strong> {courses[0].code || 'No code'}</p>
              <p><strong>First Course Token:</strong></p>
              <p className="text-xs font-mono bg-gray-200 p-1 rounded break-all">
                {courses[0].course_token || 'No token available'}
              </p>
            </div>
          )}
        </div>
        
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh clicked');
                  fetchCourses();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200"
              >
                Refresh Courses
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200"
              >
                <LogOut size={16} />
                Logout
              </button>
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
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (course.class_count || 0), 0)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Users className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (course.subject_count || 0), 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BookOpen className="text-green-600" size={24} />
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
                placeholder="Search courses by name, description, or department..."
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

                {/* Debug Raw Courses */}
        <div className="mb-8 p-4 bg-red-100 rounded-lg">
          <h3 className="font-bold mb-2">Raw Courses Debug:</h3>
          <p>Courses array length: {courses.length}</p>
          <p>Filtered courses length: {filteredCourses.length}</p>
          <p>Loading: {loading.toString()}</p>
          <p>User: {user?.email} ({user?.role})</p>
          
          {courses.length > 0 && (
            <div className="mt-2">
              <p>First course name: {courses[0].name}</p>
              <p>First course code: {courses[0].code}</p>
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {loading ? 'Loading courses...' : 'No courses available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const status = getCourseStatus(course);
              const StatusIcon = status.icon;

              return (
                <div key={course.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                      {course.code && (
                        <p className="text-sm text-gray-500">Code: {course.code}</p>
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
                        {course.class_count || 0} classes
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <BookOpen size={16} />
                      <span>
                        {course.subject_count || 0} subjects
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <Building size={16} />
                      <span>
                        {course.department_name || 'No Department'}
                      </span>
                    </div>

                    {course.duration_years && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={16} />
                        <span>{course.duration_years} years</span>
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
                <h3 className="font-semibold text-gray-900">{selectedCourse.name || selectedCourse.title}</h3>
                <p className="text-sm text-gray-600">
                  {selectedCourse.department_name || 'Course'}
                </p>
                <div className="mt-2 space-y-2">
                  {selectedCourse.code && (
                    <div className="p-2 bg-blue-50 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-blue-700">Course Code:</span>
                        <span className="text-blue-600">{selectedCourse.code}</span>
                      </div>
                    </div>
                  )}
                  {selectedCourse.course_token && (
                    <div className="p-2 bg-gray-100 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Course Token:</span>
                        <button
                          onClick={() => copyCourseToken(selectedCourse.course_token)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="font-mono text-gray-600 break-all">
                        {selectedCourse.course_token}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Token * (64-character token)
                </label>
                <input
                  type="text"
                  value={enrollToken}
                  onChange={(e) => setEnrollToken(e.target.value)}
                  placeholder="Enter 64-character course token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                {selectedCourse.course_token && (
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Copy the course token above and paste it here
                  </p>
                )}
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
