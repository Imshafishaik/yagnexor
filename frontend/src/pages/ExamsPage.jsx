import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Search, Award } from 'lucide-react';
import api from '../services/api';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExamForm, setShowExamForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examForm, setExamForm] = useState({
    subject_id: '',
    class_id: '',
    academic_year_id: '',
    name: '',
    exam_type: 'MIDTERM',
    total_marks: 100,
    exam_date: '',
    exam_time: '09:00',
    duration_minutes: 120,
  });
  const [resultForm, setResultForm] = useState({
    student_id: '',
    marks_obtained: '',
    grade: 'A',
    remarks: '',
  });

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    const filtered = exams.filter(
      (exam) =>
        exam.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.exam_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExams(filtered);
  }, [searchTerm, exams]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams');
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamInputChange = (e) => {
    const { name, value } = e.target;
    setExamForm((prev) => ({
      ...prev,
      [name]: name === 'total_marks' || name === 'duration_minutes' ? parseInt(value) : value,
    }));
  };

  const handleResultInputChange = (e) => {
    const { name, value } = e.target;
    setResultForm((prev) => ({
      ...prev,
      [name]: name === 'marks_obtained' ? parseInt(value) : value,
    }));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams', examForm);
      fetchExams();
      setShowExamForm(false);
      setExamForm({
        subject_id: '',
        class_id: '',
        academic_year_id: '',
        name: '',
        exam_type: 'MIDTERM',
        total_marks: 100,
        exam_date: '',
        exam_time: '09:00',
        duration_minutes: 120,
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam');
    }
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/exams/${selectedExam.id}/results`, resultForm);
      fetchExams();
      setShowResultForm(false);
      setSelectedExam(null);
      setResultForm({
        student_id: '',
        marks_obtained: '',
        grade: 'A',
        remarks: '',
      });
    } catch (error) {
      console.error('Error adding result:', error);
      alert('Failed to add result');
    }
  };

  const handlePublish = async (examId) => {
    try {
      await api.put(`/exams/${examId}/publish`);
      fetchExams();
    } catch (error) {
      console.error('Error publishing exam:', error);
      alert('Failed to publish exam');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await api.delete(`/exams/${id}`);
        fetchExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam');
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
              <FileText className="text-purple-600" />
              Exams Management
            </h1>
            <p className="text-gray-600 mt-1">Create and manage exams, add results, and publish</p>
          </div>
          <button
            onClick={() => setShowExamForm(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Create Exam
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by exam name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Create Exam Modal */}
        {showExamForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create New Exam</h2>
                <button
                  onClick={() => setShowExamForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="subject_id"
                    placeholder="Subject ID"
                    value={examForm.subject_id}
                    onChange={handleExamInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    name="class_id"
                    placeholder="Class ID"
                    value={examForm.class_id}
                    onChange={handleExamInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <input
                  type="text"
                  name="academic_year_id"
                  placeholder="Academic Year ID"
                  value={examForm.academic_year_id}
                  onChange={handleExamInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />

                <input
                  type="text"
                  name="name"
                  placeholder="Exam Name"
                  value={examForm.name}
                  onChange={handleExamInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="exam_type"
                    value={examForm.exam_type}
                    onChange={handleExamInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINAL">Final</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                  <input
                    type="number"
                    name="total_marks"
                    placeholder="Total Marks"
                    value={examForm.total_marks}
                    onChange={handleExamInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    name="exam_date"
                    value={examForm.exam_date}
                    onChange={handleExamInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="time"
                    name="exam_time"
                    value={examForm.exam_time}
                    onChange={handleExamInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <input
                  type="number"
                  name="duration_minutes"
                  placeholder="Duration (minutes)"
                  value={examForm.duration_minutes}
                  onChange={handleExamInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Create Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExamForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Result Modal */}
        {showResultForm && selectedExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Add Exam Result</h2>
                <button
                  onClick={() => {
                    setShowResultForm(false);
                    setSelectedExam(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddResult} className="p-6 space-y-4">
                <input
                  type="text"
                  name="student_id"
                  placeholder="Student ID"
                  value={resultForm.student_id}
                  onChange={handleResultInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />

                <input
                  type="number"
                  name="marks_obtained"
                  placeholder="Marks Obtained"
                  value={resultForm.marks_obtained}
                  onChange={handleResultInputChange}
                  max={selectedExam.total_marks}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />

                <select
                  name="grade"
                  value={resultForm.grade}
                  onChange={handleResultInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>

                <textarea
                  name="remarks"
                  placeholder="Remarks (optional)"
                  value={resultForm.remarks}
                  onChange={handleResultInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                ></textarea>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Add Result
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResultForm(false);
                      setSelectedExam(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Exams List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No exams found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{exam.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{exam.exam_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{exam.exam_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{exam.total_marks}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          exam.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exam.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedExam(exam);
                            setShowResultForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Add Result"
                        >
                          <Award size={18} />
                        </button>
                        <button
                          onClick={() => handlePublish(exam.id)}
                          className="text-green-600 hover:text-green-800 transition text-xs font-semibold"
                          title="Publish"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
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
