import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Key, Users, Calendar, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function CourseAccessPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [myCourses, setMyCourses] = useState([]);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await api.get('/courses/student/my-courses');
      setMyCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching my courses:', error);
    }
  };

  const validateToken = async () => {
    if (!token.trim()) {
      alert('Please enter a course token');
      return;
    }

    setValidating(true);
    setCourseInfo(null);

    try {
      const response = await api.post('/courses/validate-token', { course_token: token.trim() });
      setCourseInfo(response.data.course);
    } catch (error) {
      console.error('Error validating token:', error);
      setCourseInfo(null);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Invalid course token');
      }
    } finally {
      setValidating(false);
    }
  };

  const enrollInCourse = async () => {
    if (!courseInfo) return;

    setEnrolling(true);
    try {
      const response = await api.post(`/courses/${courseInfo.id}/enroll`, {
        course_token: token.trim()
      });

      alert('Successfully enrolled in course!');
      setCourseInfo(null);
      setToken('');
      await fetchMyCourses();
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

  const isAlreadyEnrolled = (courseId) => {
    return myCourses.some(course => course.id === courseId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Access</h1>
          <p className="mt-2 text-gray-600">Enter a course token to enroll in a course</p>
        </div>

        {/* Token Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Enter Course Token</h2>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter course token (64-character code)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <button
              onClick={validateToken}
              disabled={validating || !token.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {validating ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Token'
              )}
            </button>
          </div>
        </div>

        {/* Course Information */}
        {courseInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold">Course Found</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{courseInfo.title}</h3>
                {courseInfo.description && (
                  <p className="text-gray-600 mt-1">{courseInfo.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users size={16} />
                  <span>
                    {courseInfo.current_enrollments} enrolled
                    {courseInfo.max_students > 0 && ` / ${courseInfo.max_students} max`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-500">
                  <BookOpen size={16} />
                  <span>Instructor: {courseInfo.teacher_first_name} {courseInfo.teacher_last_name}</span>
                </div>

                {(courseInfo.start_date || courseInfo.end_date) && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={16} />
                    <span>
                      {courseInfo.start_date && new Date(courseInfo.start_date).toLocaleDateString()}
                      {courseInfo.start_date && courseInfo.end_date && ' - '}
                      {courseInfo.end_date && new Date(courseInfo.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {courseInfo.max_students > 0 && courseInfo.current_enrollments >= courseInfo.max_students && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="text-red-700 text-sm">This course has reached maximum capacity</span>
                </div>
              )}

              {isAlreadyEnrolled(courseInfo.id) ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-green-700 text-sm">You are already enrolled in this course</span>
                </div>
              ) : (
                <button
                  onClick={enrollInCourse}
                  disabled={enrolling || (courseInfo.max_students > 0 && courseInfo.current_enrollments >= courseInfo.max_students)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {enrolling ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    'Enroll in Course'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* My Enrolled Courses */}
        {myCourses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold">My Enrolled Courses</h2>
            </div>

            <div className="space-y-4">
              {myCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Instructor: {course.teacher_first_name} {course.teacher_last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Enrolled on {new Date(course.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Enrolled</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
