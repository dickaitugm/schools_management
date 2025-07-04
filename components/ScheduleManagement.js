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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
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
    { value: 'scheduled', label: 'Scheduled', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-300' },
    { value: 'in-progress', label: 'In Progress', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' },
    { value: 'completed', label: 'Completed', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300' },
    { value: 'cancelled', label: 'Cancelled', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300' }
  ];

  useEffect(() => {
    fetchSchedules();
    fetchUpcomingSchedules();
    fetchSchools();
    fetchTeachers();
    fetchLessons();
  }, [currentPage, searchTerm, statusFilter, selectedSchoolId, schoolFilter, dateFilter, timeFilter]);

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
      if (schoolFilter) params.append('school_id', schoolFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (timeFilter) params.append('time', timeFilter);

      const response = await fetch(`/api/schedules?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data || []);
        setPagination(data.pagination || {});
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingSchedules = async () => {
    try {
      const params = new URLSearchParams({
        limit: 5,
        upcoming: 'true'
      });

      if (selectedSchoolId) params.append('school_id', selectedSchoolId);

      const response = await fetch(`/api/schedules?${params}`);
      const data = await response.json();

      if (data.success) {
        setUpcomingSchedules(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming schedules:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      setSchools(data.success ? data.data : Array.isArray(data) ? data : []);
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

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    
    // Navigate calendar to the schedule's date
    if (schedule.scheduled_date) {
      const scheduleDate = new Date(schedule.scheduled_date);
      setSelectedDate(new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), 1));
      setDateFilter(schedule.scheduled_date.split('T')[0]);
      
      // Scroll to calendar section smoothly
      setTimeout(() => {
        const calendarElement = document.querySelector('[data-calendar-section]');
        if (calendarElement) {
          calendarElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
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
        teacher_ids: schedule.teachers?.map(t => t.id) || [],
        lesson_ids: schedule.lessons?.map(l => l.id) || []
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
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

  const handleLessonSelection = (lessonId) => {
    setFormData(prev => ({
      ...prev,
      lesson_ids: prev.lesson_ids.includes(lessonId)
        ? prev.lesson_ids.filter(id => id !== lessonId)
        : [...prev.lesson_ids, lessonId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = modalType === 'edit' 
        ? `/api/schedules/${selectedSchedule.id}`
        : '/api/schedules';
      
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
        fetchSchedules();
        fetchUpcomingSchedules();
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
    if (!confirm(`Are you sure you want to delete this schedule?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchSchedules();
        fetchUpcomingSchedules();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.slice(0, 5);
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : 'gray';
  };

  const getStatusClasses = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    if (statusOption) {
      return {
        bg: statusOption.bgColor,
        text: statusOption.textColor,
        border: statusOption.borderColor
      };
    }
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-300'
    };
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const daySchedules = schedules.filter(schedule => 
        schedule.scheduled_date.split('T')[0] === dateString
      );
      
      days.push({
        day,
        date: dateString,
        schedules: daySchedules,
        isToday: dateString === new Date().toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSchoolFilter('');
    setStatusFilter('');
    setDateFilter('');
    setTimeFilter('');
    setCurrentPage(1);
    setSelectedSchedule(null);
    setSelectedDate(new Date());
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500 text-xl">Loading schedules...</div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const displaySchedule = selectedSchedule || (upcomingSchedules.length > 0 ? upcomingSchedules[0] : null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">BB for Society - Schedules</h1>
        <button
          onClick={() => openModal('create')}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Add New Schedule
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Row 1: Calendar and Schedule Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6" data-calendar-section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Calendar View</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                  setSelectedDate(prevMonth);
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Previous Month"
              >
                ←
              </button>
              <span className="font-medium text-gray-700 min-w-[150px] text-center">
                {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
                  setSelectedDate(nextMonth);
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Next Month"
              >
                →
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(new Date(today.getFullYear(), today.getMonth(), 1));
                  setDateFilter('');
                }}
                className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Go to Current Month"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-gray-600 bg-gray-50">
                {day}
              </div>
            ))}
            {calendarDays.map((dayData, index) => {
              const isSelectedDate = dayData && dateFilter === dayData.date;
              const hasSchedules = dayData && dayData.schedules.length > 0;
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-1 border border-gray-200 ${
                    dayData 
                      ? `cursor-pointer hover:bg-gray-50 transition-colors ${
                          dayData.isToday 
                            ? 'bg-blue-50 ring-2 ring-blue-300' 
                            : isSelectedDate 
                              ? 'bg-orange-50 ring-2 ring-orange-300'
                              : hasSchedules
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white'
                        }`
                      : 'bg-gray-50'
                  }`}
                  onClick={() => dayData && setDateFilter(dayData.date)}
                  title={dayData && hasSchedules ? `${dayData.schedules.length} schedule(s) on this date` : ''}
                >
                  {dayData && (
                    <>
                      <div className={`text-sm ${
                        dayData.isToday 
                          ? 'font-bold text-blue-600' 
                          : isSelectedDate 
                            ? 'font-bold text-orange-600'
                            : hasSchedules
                              ? 'font-medium text-green-700'
                              : 'text-gray-700'
                      }`}>
                        {dayData.day}
                        {hasSchedules && (
                          <span className="ml-1 text-xs text-green-600">●</span>
                        )}
                      </div>
                    {dayData.schedules.length > 0 && (
                      <div className="space-y-1">
                        {dayData.schedules.slice(0, 2).map(schedule => {
                          const statusClasses = getStatusClasses(schedule.status);
                          const schoolName = schools.find(s => s.id === schedule.school_id)?.name || 'Unknown School';
                          return (
                            <div
                              key={schedule.id}
                              className={`text-xs p-1 rounded cursor-pointer ${statusClasses.bg} ${statusClasses.text} hover:shadow-md transition-shadow`}
                              title={`${schoolName} - ${formatTime(schedule.scheduled_time)} - ${statusOptions.find(s => s.value === schedule.status)?.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleClick(schedule);
                              }}
                            >
                              {formatTime(schedule.scheduled_time)}
                            </div>
                          );
                        })}
                        {dayData.schedules.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayData.schedules.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Status Legend:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {statusOptions.map(status => (
                <div key={status.value} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${status.bgColor} ${status.borderColor} border`}></div>
                  <span className="text-xs text-gray-600">{status.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Details/Upcoming */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedSchedule ? 'Schedule Details' : 'Upcoming Schedules'}
            </h2>
            {selectedSchedule && (
              <button
                onClick={() => {
                  setSelectedSchedule(null);
                  setDateFilter('');
                  setSelectedDate(new Date());
                }}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                title="Reset to Upcoming View"
              >
                Reset to Upcoming
              </button>
            )}
          </div>

          {displaySchedule ? (
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-medium text-gray-900">{displaySchedule.school_name}</h3>
                <p className="text-sm text-gray-600">{displaySchedule.school_address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <p className="text-gray-600">{formatDate(displaySchedule.scheduled_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time:</span>
                  <p className="text-gray-600">{formatTime(displaySchedule.scheduled_time)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <p className="text-gray-600">{displaySchedule.duration_minutes} minutes</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(displaySchedule.status).bg} ${getStatusClasses(displaySchedule.status).text}`}>
                    {statusOptions.find(s => s.value === displaySchedule.status)?.label}
                  </span>
                </div>
              </div>

              {displaySchedule.teachers && displaySchedule.teachers.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Teachers:</span>
                  <div className="mt-1 space-y-1">
                    {displaySchedule.teachers.map(teacher => (
                      <div key={teacher.id} className="text-sm text-gray-600">
                        {teacher.name} - {teacher.subject}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displaySchedule.lessons && displaySchedule.lessons.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Lessons:</span>
                  <div className="mt-1 space-y-1">
                    {displaySchedule.lessons.map(lesson => (
                      <div key={lesson.id} className="text-sm text-gray-600">
                        {lesson.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displaySchedule.notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <p className="text-sm text-gray-600 mt-1">{displaySchedule.notes}</p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => openModal('edit', displaySchedule)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Edit
                </button>
                {displaySchedule.status === 'completed' && (
                  <button
                    onClick={() => handleViewScheduleAssessment(displaySchedule.id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Assessment
                  </button>
                )}
                <button
                  onClick={() => handleDelete(displaySchedule)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : !selectedSchedule && upcomingSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">📅</span>
              <p>No upcoming schedules</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.map(schedule => (
                <div
                  key={schedule.id}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleScheduleClick(schedule)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{schedule.school_name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(schedule.scheduled_date)} at {formatTime(schedule.scheduled_time)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(schedule.status).bg} ${getStatusClasses(schedule.status).text}`}>
                      {statusOptions.find(s => s.value === schedule.status)?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Advanced Search and Schedule List */}
      <div className="space-y-6">
        {/* Advanced Search Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Search & Filters</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Schools</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
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
                onClick={clearFilters}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 h-10"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Schedule List Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading schedules...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-4">📅</span>
              <h3 className="text-lg font-semibold mb-2">No Schedules Found</h3>
              <p className="mb-4">
                {searchTerm || schoolFilter || dateFilter || statusFilter 
                  ? 'No schedules match your search criteria.' 
                  : 'Start by adding your first schedule.'
                }
              </p>
              <button
                onClick={() => openModal('create')}
                className="text-orange-600 hover:text-orange-800 text-sm"
              >
                Create your first schedule →
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
                      <tr 
                        key={schedule.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedSchedule?.id === schedule.id ? 'bg-orange-50' : ''
                        }`}
                        onClick={() => handleScheduleClick(schedule)}
                      >
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">{schedule.school_name}</div>
                            <div className="text-sm text-gray-500">{schedule.school_address}</div>
                          </div>
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
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(schedule.status).bg} ${getStatusClasses(schedule.status).text}`}>
                            {statusOptions.find(s => s.value === schedule.status)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('edit', schedule);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          {schedule.status === 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewScheduleAssessment(schedule.id);
                              }}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="View Assessment"
                            >
                              Assessment
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(schedule);
                            }}
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
                        {' '}({pagination.total} total schedules)
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
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">
            {modalType === 'edit' ? 'Edit Schedule' : 'Add New Schedule'}
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
                  School *
                </label>
                <select
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  min="15"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teachers
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {teachers.map(teacher => (
                  <label key={teacher.id} className="flex items-center space-x-2 p-1">
                    <input
                      type="checkbox"
                      checked={formData.teacher_ids.includes(teacher.id)}
                      onChange={() => handleTeacherSelection(teacher.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{teacher.name} - {teacher.subject}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lessons
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {lessons.map(lesson => (
                  <label key={lesson.id} className="flex items-center space-x-2 p-1">
                    <input
                      type="checkbox"
                      checked={formData.lesson_ids.includes(lesson.id)}
                      onChange={() => handleLessonSelection(lesson.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">{lesson.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (modalType === 'edit' ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;
