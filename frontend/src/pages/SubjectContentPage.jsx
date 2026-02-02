import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Edit2, Eye, EyeOff, Plus, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function SubjectContentPage() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    is_public: true,
    file: null
  });

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Fetch contents for selected subject
  const fetchContents = async () => {
    if (!selectedSubject) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/subject-content/subject/${selectedSubject}`);
      setContents(response.data.contents || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchContents();
  }, [selectedSubject]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!contentForm.file) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', contentForm.file);
    formData.append('subject_id', selectedSubject);
    formData.append('title', contentForm.title);
    formData.append('description', contentForm.description);
    formData.append('is_public', contentForm.is_public);

    try {
      setUploadProgress(0);
      
      const response = await api.post('/subject-content', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      if (response.status === 201) {
        setShowUploadForm(false);
        setContentForm({
          title: '',
          description: '',
          is_public: true,
          file: null
        });
        setUploadProgress(0);
        fetchContents();
        alert('Content uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading content:', error);
      alert('Failed to upload content');
    }
  };

  const handleUpdateContent = async (contentId) => {
    try {
      const response = await api.put(`/subject-content/${contentId}`, {
        title: contentForm.title,
        description: contentForm.description,
        is_public: contentForm.is_public
      });

      if (response.status === 200) {
        setEditingContent(null);
        setContentForm({
          title: '',
          description: '',
          is_public: true,
          file: null
        });
        fetchContents();
        alert('Content updated successfully!');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content');
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const response = await api.delete(`/subject-content/${contentId}`);
      
      if (response.status === 200) {
        fetchContents();
        alert('Content deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

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

  const startEdit = (content) => {
    setEditingContent(content.id);
    setContentForm({
      title: content.title,
      description: content.description || '',
      is_public: content.is_public,
      file: null
    });
  };

  const cancelEdit = () => {
    setEditingContent(null);
    setContentForm({
      title: '',
      description: '',
      is_public: true,
      file: null
    });
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

  const filteredContents = contents.filter(content =>
    content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subject Content Management</h1>
        <p className="text-gray-600">Upload and manage learning materials for your subjects</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Choose a subject...</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Contents</label>
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
        </div>

        {selectedSubject && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredContents.length} of {contents.length} contents
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Upload Content
            </button>
          </div>
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Content</h2>
            <form onSubmit={handleFileUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    placeholder="e.g., Chapter 1 Notes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={contentForm.description}
                    onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                    placeholder="Optional description of the content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                  <input
                    type="file"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setContentForm({ ...contentForm, file: e.target.files[0] })}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, Word, PowerPoint, Images, Text files (Max 50MB)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    className="mr-2"
                    checked={contentForm.is_public}
                    onChange={(e) => setContentForm({ ...contentForm, is_public: e.target.checked })}
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">
                    Make content publicly available to enrolled students
                  </label>
                </div>

                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={uploadProgress > 0}
                >
                  {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content List */}
      {selectedSubject && (
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading contents...</div>
          ) : filteredContents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No content found for this subject</p>
              <p className="text-sm mt-1">Upload your first learning material to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContents.map((content) => (
                <div key={content.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getFileIcon(content.file_type)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{content.title}</h3>
                          <p className="text-sm text-gray-500">{content.file_name}</p>
                        </div>
                      </div>
                      
                      {content.description && (
                        <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Size: {formatFileSize(content.file_size)}</span>
                        <span>Uploaded: {new Date(content.created_at).toLocaleDateString()}</span>
                        <span>By: {content.uploader_name}</span>
                        <span className="flex items-center gap-1">
                          {content.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                          {content.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDownload(content.id, content.file_name)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      
                      <button
                        onClick={() => startEdit(content)}
                        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteContent(content.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Edit Form */}
                  {editingContent === content.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={contentForm.title}
                            onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={contentForm.description}
                            onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`edit_public_${content.id}`}
                            className="mr-2"
                            checked={contentForm.is_public}
                            onChange={(e) => setContentForm({ ...contentForm, is_public: e.target.checked })}
                          />
                          <label htmlFor={`edit_public_${content.id}`} className="text-sm text-gray-700">
                            Make content publicly available
                          </label>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateContent(content.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
