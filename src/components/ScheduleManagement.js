import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

const ScheduleManagement = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({
    school_id: '',
    date_from: '',
    date_to: ''
  });
  const [formData, setFormData] = useState({
    lesson_ids: [],
    school_id: '',
    teacher_ids: [],
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [filters]);

  // Update filters when changing calendar month
  useEffect(() => {
    // Don't auto-set date filters, let user manually set them if needed
  }, [currentDate]);

  const fetchData = async () => {
    try {
      const [scheduleList, lessonList, schoolList, teacherList] = await Promise.all([
        window.electronAPI.getSchedules(),
        window.electronAPI.getLessons(),
        window.electronAPI.getSchools(),
        window.electronAPI.getTeachers()
      ]);
      
      setSchedules(scheduleList);
      setLessons(lessonList);
      setSchools(schoolList);
      setTeachers(teacherList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const filterObj = {};
      if (filters.school_id) filterObj.school_id = filters.school_id;
      if (filters.date_from) filterObj.date_from = filters.date_from;
      if (filters.date_to) filterObj.date_to = filters.date_to;
      
      const scheduleList = await window.electronAPI.getSchedules(filterObj);
      setSchedules(scheduleList);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one lesson is selected
    if (formData.lesson_ids.length === 0) {
      alert('Please select at least one lesson');
      return;
    }
    
    // Validate at least one teacher is selected
    if (formData.teacher_ids.length === 0) {
      alert('Please select at least one teacher');
      return;
    }
    
    // Validate school is selected
    if (!formData.school_id) {
      alert('Please select a school');
      return;
    }
    
    try {
      const scheduleData = {
        ...formData,
        lesson_ids: formData.lesson_ids.map(id => parseInt(id)),
        school_id: parseInt(formData.school_id),
        teacher_ids: formData.teacher_ids.map(id => parseInt(id)),
        duration_minutes: parseInt(formData.duration_minutes)
      };
      
      if (editingSchedule) {
        await window.electronAPI.updateSchedule(editingSchedule.id, scheduleData);
      } else {
        await window.electronAPI.addSchedule(scheduleData);
      }
      setIsModalOpen(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      lesson_ids: [],
      school_id: '',
      teacher_ids: [],
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: 60,
      status: 'scheduled',
      notes: ''
    });
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      lesson_ids: schedule.lesson_ids || [],
      school_id: schedule.school_id || '',
      teacher_ids: schedule.teacher_ids || [],
      scheduled_date: schedule.scheduled_date || '',
      scheduled_time: schedule.scheduled_time || '',
      duration_minutes: schedule.duration_minutes || 60,
      status: schedule.status || 'scheduled',
      notes: schedule.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await window.electronAPI.deleteSchedule(id);
        fetchSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingSchedule(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTeacherChange = (teacherId) => {
    // Ensure teacherId is integer
    const id = parseInt(teacherId);
    const updatedTeacherIds = formData.teacher_ids.includes(id)
      ? formData.teacher_ids.filter(existingId => existingId !== id)
      : [...formData.teacher_ids, id];
    
    setFormData({ ...formData, teacher_ids: updatedTeacherIds });
  };

  const handleLessonChange = (lessonId) => {
    // Ensure lessonId is integer
    const id = parseInt(lessonId);
    const updatedLessonIds = formData.lesson_ids.includes(id)
      ? formData.lesson_ids.filter(existingId => existingId !== id)
      : [...formData.lesson_ids, id];
    
    setFormData({ ...formData, lesson_ids: updatedLessonIds });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSchedulesForDate = (date) => {
    if (!date) return [];
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return schedules.filter(schedule => schedule.scheduled_date === dateStr);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Function to navigate to specific date and select it
  const navigateToDate = (dateString) => {
    if (!dateString) return;
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1)); // Set calendar to that month
    
    // Small delay to allow calendar to update, then select the date
    setTimeout(() => {
      setSelectedDate(date); // Select the specific date
    }, 100);
  };

  // Helper function to format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString();
  };

  const getCalendarStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'rescheduled': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Schedule Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Add New Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">School</label>
            <select
              name="school_id"
              value={filters.school_id}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">All Schools</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid - Calendar and Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Calendar Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-xl"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {new Date(currentDate.getFullYear(), currentDate.getMonth()).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-xl"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((day, index) => {
                const daySchedules = day ? getSchedulesForDate(day) : [];
                const isToday = day && day.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && day && day.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
                      day ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (day) {
                        // If clicking the same date, clear selection
                        if (selectedDate && day.toDateString() === selectedDate.toDateString()) {
                          setSelectedDate(null);
                        } else {
                          setSelectedDate(day);
                        }
                      }
                    }}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {daySchedules.slice(0, 2).map((schedule) => (
                            <div
                              key={schedule.id}
                              className={`text-xs p-1 rounded text-white truncate ${getCalendarStatusColor(schedule.status)}`}
                              title={`${schedule.lesson_titles ? schedule.lesson_titles.join(', ') : 'No lessons'} at ${schedule.school_name} - ${schedule.scheduled_time} (${formatDate(schedule.scheduled_date)})`}
                            >
                              {schedule.scheduled_time}
                            </div>
                          ))}
                          {daySchedules.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{daySchedules.length - 2}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 border-t">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Legend</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                <span className="text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                <span className="text-gray-600">Cancelled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                <span className="text-gray-600">Rescheduled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedules Table - Now takes 3/4 of the width */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">All Schedules</h3>
            <p className="text-sm text-gray-500 mt-1">Click on date, lesson, or school to view details in calendar</p>
          </div>
          <div className="overflow-hidden">
            {schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lessons
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teachers
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div 
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigateToDate(schedule.scheduled_date)}
                            title="Click to view this date in calendar"
                          >
                            <div className="font-medium">
                              {formatDate(schedule.scheduled_date)}
                            </div>
                            <div className="text-gray-500">{schedule.scheduled_time || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div 
                            className="max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigateToDate(schedule.scheduled_date)}
                            title="Click to view this date in calendar"
                          >
                            {schedule.lesson_titles && schedule.lesson_titles.length > 0 
                              ? schedule.lesson_titles.join(', ') 
                              : 'No lessons'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div 
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigateToDate(schedule.scheduled_date)}
                            title="Click to view this date in calendar"
                          >
                            {schedule.school_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {schedule.teacher_names && schedule.teacher_names.length > 0 
                              ? schedule.teacher_names.join(', ') 
                              : 'Not assigned'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {schedule.duration_minutes} min
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          {schedule.status === 'completed' && (
                            <button
                              onClick={() => navigate(`/attendance/${schedule.id}`)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Attendance
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(schedule.id)}
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
            ) : (
              <div className="p-8 text-center text-gray-500">
                No schedules found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Date Details - Show below the main grid */}
      {selectedDate && getSchedulesForDate(selectedDate).length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Schedules for {selectedDate.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {getSchedulesForDate(selectedDate).map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {schedule.scheduled_time || 'N/A'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({schedule.duration_minutes} min)
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {schedule.lesson_titles && schedule.lesson_titles.length > 0 
                          ? schedule.lesson_titles.join(', ') 
                          : 'No lessons'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">School:</span> {schedule.school_name}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Teachers:</span> {schedule.teacher_names && schedule.teacher_names.length > 0 
                          ? schedule.teacher_names.join(', ') 
                          : 'Not assigned'}
                      </p>
                      {schedule.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Notes:</span> {schedule.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      {schedule.status === 'completed' && (
                        <button
                          onClick={() => navigate(`/attendance/${schedule.id}`)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Attendance
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">School</label>
            <select
              name="school_id"
              value={formData.school_id}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lessons</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {lessons.map((lesson) => (
                <label key={lesson.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.lesson_ids.includes(parseInt(lesson.id))}
                    onChange={() => handleLessonChange(lesson.id)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{lesson.title}</span>
                </label>
              ))}
            </div>
            {formData.lesson_ids.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Please select at least one lesson</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teachers</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {teachers
                .filter(teacher => {
                  if (!formData.school_id) return true;
                  
                  // Handle both string and array formats for school_ids
                  if (typeof teacher.school_ids === 'string') {
                    return teacher.school_ids.split(',').map(id => parseInt(id.trim())).includes(parseInt(formData.school_id));
                  } else if (Array.isArray(teacher.school_ids)) {
                    return teacher.school_ids.includes(parseInt(formData.school_id));
                  }
                  
                  return false;
                })
                .map((teacher) => (
                  <label key={teacher.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.teacher_ids.includes(parseInt(teacher.id))}
                      onChange={() => handleTeacherChange(teacher.id)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{teacher.name}</span>
                  </label>
                ))}
            </div>
            {formData.teacher_ids.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Please select at least one teacher</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="15"
                max="240"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
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
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
            >
              {editingSchedule ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;
