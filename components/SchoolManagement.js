'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from './AuthContext';
import { formatDateIndonesian } from '../utils/dateUtils';

const SchoolManagement = ({ onSchoolSelect, selectedSchoolId, onViewProfile }) => {
  const { hasPermission } = useAuth();
  const [schools, setSchools] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  
  // Add state for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchTerm]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`/api/schools?${params}`);
      if (!response.ok) throw new Error('Failed to fetch schools');
      
      const data = await response.json();
      
      if (data.success) {
        setSchools(data.data);
        setPagination(data.pagination);
      } else {
        setSchools(Array.isArray(data) ? data : []);
        // For backwards compatibility if API doesn't return paginated response
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError('Error fetching schools: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null); // Clear previous errors
      
      // Validate school name
      if (!formData.name || formData.name.trim() === '') {
        setError('School name is required');
        return;
      }
      
      // Add minimum delay to ensure loading indicator is visible
      const startTime = Date.now();
      
      const url = editingSchool ? `/api/schools/${editingSchool.id}` : '/api/schools';
      const method = editingSchool ? 'PUT' : 'POST';
      
      // Trim data before sending
      const trimmedData = {
        name: formData.name.trim(),
        address: formData.address?.trim() || '',
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || ''
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedData),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('School name already exists. Please choose a different name.');
        } else {
          throw new Error(data.error || 'Failed to save school');
        }
      }
      
      // Ensure minimum loading time of 800ms to show spinner
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 800 - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setIsModalOpen(false);
      setEditingSchool(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
      setSuccess(data.message || `School ${editingSchool ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      fetchSchools();
    } catch (error) {
      console.error('Error saving school:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || ''
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSchool(null);
    setFormData({ name: '', address: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleViewSchoolProfile = (schoolId) => {
    if (onViewProfile) {
      onViewProfile('schools', schoolId);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (school) => {
    try {
      // Check if school has related records
      const checkResponse = await fetch(`/api/schools/${school.id}/check-relations`);
      
      if (checkResponse.ok) {
        const relationData = await checkResponse.json();
        
        if (relationData.hasRelations) {
          // Show confirmation dialog with related counts
          setDeleteConfirmation({
            school: school,
            studentsCount: relationData.studentsCount || 0,
            teacherSchoolsCount: relationData.teacherSchoolsCount || 0,
            cashFlowCount: relationData.cashFlowCount || 0,
            attendanceCount: relationData.attendanceCount || 0,
            studentTeachersCount: relationData.studentTeachersCount || 0,
            show: true
          });
          return;
        }
      }
      
      // Direct delete if no relations or check failed
      if (confirm(`Are you sure you want to delete school "${school.name}"?`)) {
        await performDelete(school.id, false);
      }
      
    } catch (error) {
      console.error('Error checking school relations:', error);
      // Fallback to direct delete attempt
      if (confirm(`Are you sure you want to delete school "${school.name}"?`)) {
        await performDelete(school.id, false);
      }
    }
  };

  const performDelete = async (schoolId, cascade = false) => {
    setLoading(true);
    console.log(`🔧 Frontend DELETE - SchoolID: ${schoolId}, Cascade: ${cascade}`);
    
    try {
      const url = cascade ? `/api/schools/${schoolId}?cascade=true` : `/api/schools/${schoolId}`;
      console.log(`📡 Calling API: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log(`📋 API Response:`, data);

      if (data.success) {
        setSuccess(data.message);
        fetchSchools();
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
      setError('Failed to delete school: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = (action) => {
    if (action === 'cascade' && deleteConfirmation?.school) {
      performDelete(deleteConfirmation.school.id, true);
    }
    setDeleteConfirmation(null);
  };



  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500 text-xl">Loading schools...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB for Society - Schools</h1>
        {hasPermission('create_schools') && (
          <button
            onClick={handleAddNew}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add New School
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
              placeholder="Search schools by name, address, or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading schools...</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-4">🏫</span>
            <h3 className="text-lg font-semibold mb-2">No Schools Found</h3>
            <p className="mb-4">
              {searchTerm ? 'No schools match your search criteria.' : 'Start by adding your first school.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schools.map((school) => (
                    <tr 
                      key={school.id}
                      className={`hover:bg-gray-50 ${
                        selectedSchoolId === school.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td 
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => onSchoolSelect(school.id)}
                      >
                        <div>
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-900">
                            {school.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {school.address || 'No address provided'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{school.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{school.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateIndonesian(school.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSchoolProfile(school.id);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          View Profile
                        </button>
                        {hasPermission('update_schools') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(school);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('delete_schools') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(school);
                            }}
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
                      {' '}({pagination.total} total schools)
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchool ? 'Edit School' : 'Add New School'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? 'Saving...' : (editingSchool ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Delete School Confirmation
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {deleteConfirmation.school?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {deleteConfirmation.school?.address}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-amber-800 font-medium mb-2">
                        This school has related records that will be affected:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <div className="bg-green-500 w-2 h-2 rounded-full mr-3"></div>
                          <span className="text-gray-700">
                            <strong>{deleteConfirmation.studentsCount}</strong> student(s)
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-blue-500 w-2 h-2 rounded-full mr-3"></div>
                          <span className="text-gray-700">
                            <strong>{deleteConfirmation.teacherSchoolsCount}</strong> teacher relationship(s)
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-yellow-500 w-2 h-2 rounded-full mr-3"></div>
                          <span className="text-gray-700">
                            <strong>{deleteConfirmation.cashFlowCount}</strong> cash flow record(s)
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-purple-500 w-2 h-2 rounded-full mr-3"></div>
                          <span className="text-gray-700">
                            <strong>{deleteConfirmation.attendanceCount}</strong> attendance record(s)
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-indigo-500 w-2 h-2 rounded-full mr-3"></div>
                          <span className="text-gray-700">
                            <strong>{deleteConfirmation.studentTeachersCount}</strong> student-teacher relationship(s)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium text-center">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleConfirmDelete('cascade')}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete School & All Related Data
                </button>
                <button
                  onClick={() => handleConfirmDelete('cancel')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolManagement;
