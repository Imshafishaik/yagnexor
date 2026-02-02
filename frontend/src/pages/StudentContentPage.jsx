import React, { useState, useEffect } from 'react';
import { Download, Search, BookOpen, FileText, Calendar, User } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function StudentContentPage() {
  const { user } = useAuthStore();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Fetch student's accessible content
  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/subject-content/student/${user.id}`);
      setContents(response.data.contents || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleDownload = async (contentId, fileName) => {
    try {
      const response = await api.get(`/subject-content/${contentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading content:', error);
      alert('Failed to download content');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  // Get unique subjects from contents
  const subjects = [...new Set(contents.map(content => content.subject_name))];
  
  // Filter contents
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !selectedSubject || content.subject_name === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  // Group contents by subject
  const groupedContents = filteredContents.reduce((groups, content) => {
    const subjectName = content.subject_name;
    if (!groups[subjectName]) {
      groups[subjectName] = [];
    }
    groups[subjectName].push(content);
    return groups;
  }, {});

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Learning Materials</h1>
        <p className="text-gray-600">Access study materials for your enrolled subjects</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Materials</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by title, description, or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Subject</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredContents.length} of {contents.length} materials
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookOpen size={16} />
            <span>{subjects.length} subjects</span>
          </div>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          Loading learning materials...
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No learning materials available</p>
          <p className="text-sm mt-1">
            {contents.length === 0 
              ? "You haven't enrolled in any subjects yet or no materials have been uploaded."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedContents).map(([subjectName, subjectContents]) => (
            <div key={subjectName} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{subjectName}</h3>
                <p className="text-sm text-gray-600">{subjectContents.length} materials</p>
              </div>
              
              <div className="divide-y">
                {subjectContents.map((content) => (
                  <div key={content.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getFileIcon(content.file_type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{content.title}</h4>
                            <p className="text-sm text-gray-500">{content.file_name}</p>
                          </div>
                        </div>
                        
                        {content.description && (
                          <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {content.subject_code}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {formatFileSize(content.file_size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(content.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {content.uploader_name}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDownload(content.id, content.file_name)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
