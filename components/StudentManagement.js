'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from './AuthContext';
import { formatDateIndonesian } from '../utils/dateUtils';
import { conditionallyMaskStudentName } from '../utils/privacyUtils';

const StudentManagement = ({ selectedSchoolId, onViewProfile }) => {
  const { hasPermission, logActivity, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    school_id: selectedSchoolId || '',
    grade: '',
    age: '',
    phone: '',
    email: '',
    enrollment_date: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchSchools();
  }, [currentPage, searchTerm, selectedSchoolId]);

  useEffect(() => {
    // Update form school_id when selectedSchoolId changes
    if (selectedSchoolId) {
      setFormData(prev => ({
        ...prev,
        school_id: selectedSchoolId
      }));
    }
  }, [selectedSchoolId]);

  // Monitor schools state
  useEffect(() => {
    // Schools state updated
  }, [schools]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      if (selectedSchoolId) {
        params.append('school_id', selectedSchoolId);
      }

      const response = await fetch(`/api/students?${params}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setSchools(data.data);
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        setSchools(data);
      } else {
        console.error('🏫 Schools API response format error:', data);
        setSchools([]);
      }
    } catch (error) {
      console.error('🏫 Failed to fetch schools:', error);
      setSchools([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      school_id: selectedSchoolId || '',
      grade: '',
      age: '',
      phone: '',
      email: '',
      enrollment_date: ''
    });
  };

  const handleViewStudentProfile = (studentId) => {
    if (onViewProfile) {
      onViewProfile('students', studentId);
    }
  };

  const openModal = (type, student = null) => {
    setModalType(type);
    setSelectedStudent(student);
    
    if (type === 'edit' && student) {
      setFormData({
        name: student.name || '',
        school_id: student.school_id || '',
        grade: student.grade || '',
        age: student.age || '',
        phone: student.phone || '',
        email: student.email || '',
        enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : ''
      });
    } else {
      resetForm();
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = modalType === 'edit' 
        ? `/api/students/${selectedStudent.id}`
        : '/api/students';
      
      const method = modalType === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age) : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        closeModal();
        fetchStudents();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  // Add state for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const handleDelete = async (student) => {
    try {
      // Check if student has related records
      const checkResponse = await fetch(`/api/students/${student.id}/check-relations`);
      
      if (checkResponse.ok) {
        const { hasRelations, attendanceCount, studentTeachersCount } = await checkResponse.json();
        
        if (hasRelations) {
          // Show confirmation dialog
          setDeleteConfirmation({
            student: student,
            attendanceCount: attendanceCount,
            studentTeachersCount: studentTeachersCount,
            show: true
          });
          return;
        }
      }
      
      // Direct delete if no relations or check failed
      if (confirm(`Are you sure you want to delete student "${student.name}"?`)) {
        await performDelete(student.id, false);
      }
      
    } catch (error) {
      console.error('Error checking student relations:', error);
      // Fallback to direct delete attempt
      if (confirm(`Are you sure you want to delete student "${student.name}"?`)) {
        await performDelete(student.id, false);
      }
    }
  };

  const performDelete = async (studentId, cascade = false) => {
    setLoading(true);
    console.log(`🔧 Frontend DELETE - StudentID: ${studentId}, Cascade: ${cascade}`);
    
    try {
      const url = cascade ? `/api/students/${studentId}?cascade=true` : `/api/students/${studentId}`;
      console.log(`📡 Calling API: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log(`📋 API Response:`, data);

      if (data.success) {
        setSuccess(data.message);
        fetchStudents();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        if (data.code === 'FOREIGN_KEY_VIOLATION') {
          // Show error with suggestion
          setError(`${data.error}\n\n💡 ${data.suggestion}`);
        } else {
          setError(data.error);
        }
      }
    } catch (error) {
      setError('Failed to delete student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = (action) => {
    if (action === 'cascade' && deleteConfirmation?.student) {
      performDelete(deleteConfirmation.student.id, true);
    }
    setDeleteConfirmation(null);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };



  const getSchoolName = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'Unknown School';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">BB for Society - Students</h1>
          {selectedSchoolId && (
            <p className="text-sm text-gray-600 mt-1">
              Filtered by: {getSchoolName(selectedSchoolId)}
            </p>
          )}
        </div>
        {hasPermission('create_students') && (
          <button 
            onClick={() => openModal('create')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add New Student
          </button>
        )}
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
              placeholder="Search students by name, email, or grade..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-4">👨‍🎓</span>
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="mb-4">
              {searchTerm ? 'No students match your search criteria.' : 'Start by adding your first student.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School & Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {conditionallyMaskStudentName(student.name, user, { preserveFirstName: true })}
                          </div>
                          {student.age && (
                            <div className="text-sm text-gray-500">Age: {student.age}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.school_name}</div>
                        <div className="text-sm text-gray-500">{student.grade || 'No grade'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{student.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateIndonesian(student.enrollment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewStudentProfile(student.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          View Profile
                        </button>
                        {hasPermission('update_students') && (
                          <button
                            onClick={() => openModal('edit', student)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('delete_students') && (
                          <button
                            onClick={() => handleDelete(student)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
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
                      {' '}({pagination.total} total students)
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
            {modalType === 'edit' ? 'Edit Student' : 'Add New Student'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School *
                </label>
                <select
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a school</option>
                  {schools.length === 0 && (
                    <option disabled>No schools available</option>
                  )}
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="e.g., Kelas 5, Grade 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  name="enrollment_date"
                  value={formData.enrollment_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
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
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Saving...' : (modalType === 'edit' ? 'Update Student' : 'Create Student')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              ⚠️ Delete Student Confirmation
            </h3>
            <div className="mb-6 text-gray-700">
              <p className="mb-3">
                <strong>Student:</strong> {deleteConfirmation.student?.name}
              </p>
              <p className="mb-3">
                This student has related records:
              </p>
              <ul className="list-disc list-inside mb-4 text-sm bg-gray-50 p-3 rounded">
                <li>{deleteConfirmation.attendanceCount} attendance record(s)</li>
                <li>{deleteConfirmation.studentTeachersCount} teacher relationship(s)</li>
              </ul>
              <p className="text-red-600 font-medium">
                What would you like to do?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleConfirmDelete('cascade')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                🗑️ Delete Student and All Related Records
              </button>
              <button
                onClick={() => handleConfirmDelete('cancel')}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagement;
