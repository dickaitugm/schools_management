'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const LessonManagement = ({ onViewProfile }) => {
  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    materials: '',
    target_grade: '',
    teacher_ids: []
  });

  useEffect(() => {
    fetchLessons();
    fetchTeachers();
  }, [currentPage, searchTerm]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`/api/lessons?${params}`);
      const data = await response.json();

      if (data.success) {
        setLessons(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();

      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration_minutes: 60,
      materials: '',
      target_grade: '',
      teacher_ids: []
    });
  };

  const handleViewLessonProfile = (lessonId) => {
    if (onViewProfile) {
      onViewProfile('lessons', lessonId);
    }
  };

  const openModal = (type, lesson = null) => {
    setModalType(type);
    setSelectedLesson(lesson);
    
    if (type === 'edit' && lesson) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        duration_minutes: lesson.duration_minutes || 60,
        materials: lesson.materials || '',
        target_grade: lesson.target_grade || '',
        teacher_ids: lesson.teachers ? lesson.teachers.map(t => t.id) : []
      });
    } else {
      resetForm();
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLesson(null);
    resetForm();
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeacherSelection = (teacherId) => {
    setFormData(prev => ({
      ...prev,
      teacher_ids: prev.teacher_ids.includes(teacherId)
        ? prev.teacher_ids.filter(id => id !== teacherId)
        : [...prev.teacher_ids, teacherId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = modalType === 'edit' 
        ? `/api/lessons/${selectedLesson.id}`
        : '/api/lessons';
      
      const method = modalType === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes) || 60
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        closeModal();
        fetchLessons();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lesson) => {
    if (!confirm(`Are you sure you want to delete lesson "${lesson.title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchLessons();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB for Society - Lessons</h1>
        <button 
          onClick={() => openModal('create')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add New Lesson
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search lessons by title, description, or target grade..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-4">📚</span>
            <h3 className="text-lg font-semibold mb-2">No Lessons Found</h3>
            <p className="mb-4">
              {searchTerm ? 'No lessons match your search criteria.' : 'Start by adding your first lesson.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lesson Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration & Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materials
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {lesson.description || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDuration(lesson.duration_minutes)}</div>
                        <div className="text-sm text-gray-500">{lesson.target_grade || 'All grades'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {lesson.materials || 'No materials specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {lesson.teachers && lesson.teachers.length > 0 ? (
                            lesson.teachers.map((teacher) => (
                              <span 
                                key={teacher.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                title={teacher.subject}
                              >
                                {teacher.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No teachers assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewLessonProfile(lesson.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => openModal('edit', lesson)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(lesson)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                      {' '}({pagination.total} total lessons)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            {modalType === 'edit' ? 'Edit Lesson' : 'Add New Lesson'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  min="1"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Grade
                </label>
                <input
                  type="text"
                  name="target_grade"
                  value={formData.target_grade}
                  onChange={handleInputChange}
                  placeholder="e.g., Kelas 5-6, SMP, SMA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materials
                </label>
                <textarea
                  name="materials"
                  value={formData.materials}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="List of materials needed for this lesson..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Teacher Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Teachers
              </label>
              <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                {teachers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No teachers available</p>
                ) : (
                  teachers.map((teacher) => (
                    <label key={teacher.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.teacher_ids.includes(teacher.id)}
                        onChange={() => handleTeacherSelection(teacher.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        {teacher.name} - {teacher.subject}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Saving...' : (modalType === 'edit' ? 'Update Lesson' : 'Create Lesson')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default LessonManagement;
