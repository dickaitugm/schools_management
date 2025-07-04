'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const TeacherManagement = ({ selectedSchoolId, onViewProfile }) => {
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    phone: '',
    email: '',
    hire_date: '',
    school_ids: []
  });

  useEffect(() => {
    fetchTeachers();
    fetchSchools();
  }, [currentPage, searchTerm]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`/api/teachers?${params}`);
      const data = await response.json();

      if (data.success) {
        setTeachers(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();

      // API schools returns array directly, not {success: true, data: [...]}
      if (Array.isArray(data)) {
        setSchools(data);
        console.log('Schools loaded:', data.length, 'schools');
      } else {
        console.error('Unexpected schools API response format:', data);
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      phone: '',
      email: '',
      hire_date: '',
      school_ids: []
    });
  };

  const handleViewTeacherProfile = (teacherId) => {
    if (onViewProfile) {
      onViewProfile('teachers', teacherId);
    }
  };

  const openModal = (type, teacher = null) => {
    setModalType(type);
    setSelectedTeacher(teacher);
    
    if (type === 'edit' && teacher) {
      setFormData({
        name: teacher.name || '',
        subject: teacher.subject || '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        hire_date: teacher.hire_date ? teacher.hire_date.split('T')[0] : '',
        school_ids: teacher.schools ? teacher.schools.map(s => s.id) : []
      });
    } else {
      resetForm();
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
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

  const handleSchoolSelection = (schoolId) => {
    setFormData(prev => ({
      ...prev,
      school_ids: prev.school_ids.includes(schoolId)
        ? prev.school_ids.filter(id => id !== schoolId)
        : [...prev.school_ids, schoolId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = modalType === 'edit' 
        ? `/api/teachers/${selectedTeacher.id}`
        : '/api/teachers';
      
      const method = modalType === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        closeModal();
        fetchTeachers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacher) => {
    if (!confirm(`Are you sure you want to delete teacher "${teacher.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchTeachers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Teachers</h1>
        <button 
          onClick={() => openModal('create')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add New Teacher
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
              placeholder="Search teachers by name, subject, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-4">👨‍🏫</span>
            <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
            <p className="mb-4">
              {searchTerm ? 'No teachers match your search criteria.' : 'Start by adding your first teacher.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schools
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hire Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">{teacher.subject}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{teacher.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.schools && teacher.schools.length > 0 ? (
                            teacher.schools.map((school) => (
                              <span 
                                key={school.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {school.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No schools assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(teacher.hire_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewTeacherProfile(teacher.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => openModal('edit', teacher)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher)}
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
                      {' '}({pagination.total} total teachers)
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
            {modalType === 'edit' ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* School Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Schools
              </label>
              <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                {schools.length === 0 ? (
                  <p className="text-gray-500 text-sm">No schools available</p>
                ) : (
                  schools.map((school) => (
                    <label key={school.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.school_ids.includes(school.id)}
                        onChange={() => handleSchoolSelection(school.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{school.name}</span>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (modalType === 'edit' ? 'Update Teacher' : 'Create Teacher')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherManagement;
