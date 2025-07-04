'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const ScheduleManagement = ({ selectedSchoolId, onViewProfile, onViewAssessment }) => {
  const [schedules, setSchedules] = useState([]);
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    school_id: selectedSchoolId || '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    status: 'scheduled',
    notes: '',
    teacher_ids: [],
    lesson_ids: []
  });

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: 'blue' },
    { value: 'in-progress', label: 'In Progress', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  useEffect(() => {
    fetchSchedules();
    fetchSchools();
    fetchTeachers();
    fetchLessons();
  }, [currentPage, searchTerm, statusFilter, selectedSchoolId]);

  useEffect(() => {
    if (selectedSchoolId) {
      setFormData(prev => ({
        ...prev,
        school_id: selectedSchoolId
      }));
    }
  }, [selectedSchoolId]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      if (statusFilter) params.append('status', statusFilter);
      if (selectedSchoolId) params.append('school_id', selectedSchoolId);

      const response = await fetch(`/api/schedules?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      setSchools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      setTeachers(data.success ? data.data : []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      const data = await response.json();
      setLessons(data.success ? data.data : []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleViewScheduleProfile = (scheduleId) => {
    if (onViewProfile) {
      onViewProfile('schedules', scheduleId);
    }
  };

  const handleViewScheduleAssessment = (scheduleId) => {
    if (onViewAssessment) {
      onViewAssessment(scheduleId);
    }
  };

  const openModal = (type, schedule = null) => {
    setModalType(type);
    setSelectedSchedule(schedule);
    
    if (schedule) {
      setFormData({
        school_id: schedule.school_id,
        scheduled_date: schedule.scheduled_date.split('T')[0],
        scheduled_time: schedule.scheduled_time.slice(0, 5),
        duration_minutes: schedule.duration_minutes,
        status: schedule.status,
        notes: schedule.notes || '',
        teacher_ids: schedule.teachers.map(t => t.id),
        lesson_ids: schedule.lessons.map(l => l.id)
      });
    } else {
      setFormData({
        school_id: selectedSchoolId || '',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        status: 'scheduled',
        notes: '',
        teacher_ids: [],
        lesson_ids: []
      });
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = selectedSchedule ? `/api/schedules/${selectedSchedule.id}` : '/api/schedules';
      const method = selectedSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(selectedSchedule ? 'Schedule updated successfully!' : 'Schedule created successfully!');
        setIsModalOpen(false);
        fetchSchedules();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schedule) => {
    if (!confirm(`Are you sure you want to delete the schedule on ${schedule.scheduled_date}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Schedule deleted successfully!');
        fetchSchedules();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete schedule');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.slice(0, 5) : '';
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : 'gray';
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target;
      const arrayName = name.replace('_checkbox', '');
      const itemId = parseInt(value);
      
      setFormData(prev => ({
        ...prev,
        [arrayName]: checked 
          ? [...prev[arrayName], itemId]
          : prev[arrayName].filter(id => id !== itemId)
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500 text-xl">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Schedules</h1>
        <button
          onClick={() => openModal('create')}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Add New Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 h-10"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">📅</span>
            <p>No schedules found</p>
            <button
              onClick={() => openModal('create')}
              className="mt-2 text-orange-600 hover:text-orange-800"
            >
              Create your first schedule
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lessons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(schedule.scheduled_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(schedule.scheduled_time)} ({schedule.duration_minutes} min)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{schedule.school_name}</div>
                        <div className="text-sm text-gray-500">{schedule.school_address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {schedule.teachers && schedule.teachers.length > 0 ? (
                            schedule.teachers.slice(0, 3).map((teacher) => (
                              <span
                                key={teacher.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                title={teacher.subject}
                              >
                                {teacher.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No teachers assigned</span>
                          )}
                          {schedule.teachers && schedule.teachers.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{schedule.teachers.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {schedule.lessons && schedule.lessons.length > 0 ? (
                            schedule.lessons.slice(0, 2).map((lesson) => (
                              <span
                                key={lesson.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                {lesson.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No lessons assigned</span>
                          )}
                          {schedule.lessons && schedule.lessons.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{schedule.lessons.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${getStatusColor(schedule.status) === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                          ${getStatusColor(schedule.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${getStatusColor(schedule.status) === 'green' ? 'bg-green-100 text-green-800' : ''}
                          ${getStatusColor(schedule.status) === 'red' ? 'bg-red-100 text-red-800' : ''}
                          ${getStatusColor(schedule.status) === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {statusOptions.find(s => s.value === schedule.status)?.label || schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewScheduleProfile(schedule.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          View Profile
                        </button>
                        {schedule.status === 'completed' && (
                          <button
                            onClick={() => handleViewScheduleAssessment(schedule.id)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            Assessment
                          </button>
                        )}
                        <button
                          onClick={() => openModal('edit', schedule)}
                          className="text-orange-600 hover:text-orange-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(schedule)}
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
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span> pages
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {modalType === 'edit' ? 'Edit Schedule' : 'Create New Schedule'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <select
                name="school_id"
                value={formData.school_id}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
              >
                <option value="">Select School</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="15"
                max="480"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teachers</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {teachers.map(teacher => (
                <label key={teacher.id} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    name="teacher_ids_checkbox"
                    value={teacher.id}
                    checked={formData.teacher_ids.includes(teacher.id)}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">{teacher.name} - {teacher.subject}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lessons</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {lessons.map(lesson => (
                <label key={lesson.id} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    name="lesson_ids_checkbox"
                    value={lesson.id}
                    checked={formData.lesson_ids.includes(lesson.id)}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">{lesson.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
              placeholder="Additional notes..."
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
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (modalType === 'edit' ? 'Update Schedule' : 'Create Schedule')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ScheduleManagement;
