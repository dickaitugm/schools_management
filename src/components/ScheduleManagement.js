import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfMonth, addMonths, subMonths, getDaysInMonth as getDaysInMonthFn } from 'date-fns';
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
    date_to: '',
  });
  const [formData, setFormData] = useState({
    lesson_ids: [],
    school_id: '',
    teacher_ids: [],
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    status: 'scheduled',
    notes: '',
  });
  const [scheduleStats, setScheduleStats] = useState({});
  const [allScheduleStats, setAllScheduleStats] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [filters]);

  useEffect(() => {
    if (schedules.length > 0 && !selectedDate) {
      const nearestSchedule = findNearestUpcomingSchedule();
      if (nearestSchedule) {
        const scheduleDate = parseISO(nearestSchedule.scheduled_date);
        setSelectedDate(scheduleDate);
        loadStatsForDate(scheduleDate);
      }
    }
  }, [schedules]);

  const fetchData = async () => {
    try {
      const [scheduleList, lessonList, schoolList, teacherList] = await Promise.all([
        window.electronAPI.getSchedules(),
        window.electronAPI.getLessons(),
        window.electronAPI.getSchools(),
        window.electronAPI.getTeachers(),
      ]);
      setSchedules(scheduleList || []);
      setLessons(lessonList || []);
      setSchools(schoolList || []);
      setTeachers(teacherList || []);
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
      setSchedules(scheduleList || []);
      loadAllScheduleStats(scheduleList || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const loadAllScheduleStats = async (scheduleList) => {
    const completedSchedules = scheduleList.filter(schedule => schedule.status === 'completed');
    const stats = {};
    for (const schedule of completedSchedules) {
      const scheduleStats = await fetchScheduleStats(schedule.id);
      if (scheduleStats) {
        stats[schedule.id] = scheduleStats;
      }
    }
    setAllScheduleStats(stats);
  };

  const fetchScheduleStats = async (scheduleId) => {
    try {
      const attendanceData = await window.electronAPI.getStudentAttendance(scheduleId);
      if (attendanceData && attendanceData.length > 0) {
        const studentCount = attendanceData.length;
        const knowledgeScores = attendanceData
          .filter(record => record.knowledge_score != null)
          .map(record => record.knowledge_score);
        const avgKnowledge = knowledgeScores.length > 0
          ? (knowledgeScores.reduce((sum, score) => sum + score, 0) / knowledgeScores.length).toFixed(1)
          : 0;
        const participationScores = attendanceData
          .filter(record => record.participation_score != null)
          .map(record => record.participation_score);
        const avgParticipation = participationScores.length > 0
          ? (participationScores.reduce((sum, score) => sum + score, 0) / participationScores.length).toFixed(1)
          : 0;
        const presentCount = attendanceData.filter(record => record.attendance_status === 'present').length;
        const lateCount = attendanceData.filter(record => record.attendance_status === 'late').length;
        const absentCount = attendanceData.filter(record => record.attendance_status === 'absent').length;
        return {
          studentCount,
          avgKnowledge: parseFloat(avgKnowledge),
          avgParticipation: parseFloat(avgParticipation),
          presentCount,
          lateCount,
          absentCount,
          attendanceRate: studentCount > 0 ? ((presentCount + lateCount) / studentCount * 100).toFixed(1) : 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching schedule stats:', error);
      return null;
    }
  };

  const loadStatsForDate = async (date) => {
    const daySchedules = getSchedulesForDate(date);
    const completedSchedules = daySchedules.filter(schedule => schedule.status === 'completed');
    const stats = {};
    for (const schedule of completedSchedules) {
      const scheduleStats = await fetchScheduleStats(schedule.id);
      if (scheduleStats) {
        stats[schedule.id] = scheduleStats;
      }
    }
    setScheduleStats(stats);
  };

  const formatTeacherNames = (teacherNames) => {
    if (!teacherNames) return 'Not assigned';
    if (Array.isArray(teacherNames)) return teacherNames.join(', ');
    if (typeof teacherNames !== 'string') return String(teacherNames);
    if (teacherNames.includes(',')) {
      return teacherNames.split(',').map(name => name.trim()).join(', ');
    }
    const splitByCapital = teacherNames.split(/(?=[A-Z])/).filter(name => name.trim());
    return splitByCapital.length > 1 ? splitByCapital.join(', ') : teacherNames;
  };

  const findNearestUpcomingSchedule = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingSchedules = schedules
      .filter(schedule => {
        const scheduleDate = parseISO(schedule.scheduled_date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= today;
      })
      .sort((a, b) => parseISO(a.scheduled_date) - parseISO(b.scheduled_date));
    return upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.lesson_ids.length === 0) {
      alert('Please select at least one lesson');
      return;
    }
    if (formData.teacher_ids.length === 0) {
      alert('Please select at least one teacher');
      return;
    }
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
        duration_minutes: parseInt(formData.duration_minutes),
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
      notes: '',
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
      notes: schedule.notes || '',
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
    const id = parseInt(teacherId);
    const updatedTeacherIds = formData.teacher_ids.includes(id)
      ? formData.teacher_ids.filter(existingId => existingId !== id)
      : [...formData.teacher_ids, id];
    setFormData({ ...formData, teacher_ids: updatedTeacherIds });
  };

  const handleLessonChange = (lessonId) => {
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

  const getDaysInMonth = (date) => {
    const days = [];
    const firstDay = startOfMonth(date);
    const daysInMonth = getDaysInMonthFn(date);
    const startingDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), day));
    }
    return days;
  };

  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter(schedule => schedule.scheduled_date === dateStr);
  };

  const navigateMonth = (direction) => {
    const newDate = direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
  };

  const navigateToDate = (dateString) => {
    if (!dateString) return;
    const date = parseISO(dateString);
    setCurrentDate(startOfMonth(date));
    setTimeout(() => {
      setSelectedDate(date);
      loadStatsForDate(date);
    }, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'Invalid Date';
    }
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
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Schedule Management</h1>
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
                  {school.name || 'Unnamed School'}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center p-4 border-b">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-xl"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-xl"
            >
              →
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                  {day}
                </div>
              ))}
            </div>
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
                    } ${isToday ? 'ring-2 ring-blue-500' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      if (day) {
                        if (isSelected) {
                          setSelectedDate(null);
                          setScheduleStats({});
                        } else {
                          setSelectedDate(day);
                          loadStatsForDate(day);
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
                              title={`${schedule.lesson_titles?.join(', ') || 'No lessons'} at ${schedule.school_name || 'N/A'} - ${schedule.scheduled_time || 'N/A'} (${formatDate(schedule.scheduled_date)})`}
                            >
                              {schedule.scheduled_time || 'N/A'}
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

        {/* Selected Date/Schedule Details */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedDate
                  ? `Schedule Details for ${format(selectedDate, 'PPP')}`
                  : 'Upcoming Schedule Details'}
              </h3>
              {selectedDate && (
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setScheduleStats({});
                    const nearestSchedule = findNearestUpcomingSchedule();
                    if (nearestSchedule) {
                      const scheduleDate = parseISO(nearestSchedule.scheduled_date);
                      setSelectedDate(scheduleDate);
                      loadStatsForDate(scheduleDate);
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Reset to Upcoming
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {selectedDate && getSchedulesForDate(selectedDate).length > 0 ? (
              <div className="space-y-6">
                {getSchedulesForDate(selectedDate).map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                            {schedule.status}
                          </span>
                          <span className="text-lg font-medium text-gray-900">
                            {schedule.scheduled_time || 'N/A'}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({schedule.duration_minutes} min)
                          </span>
                        </div>
                        <h4 className="text-xl font-medium text-gray-900 mb-3">
                          {schedule.lesson_titles?.join(', ') || 'No lessons'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <p>
                            <span className="font-medium">School:</span> {schedule.school_name || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Teachers:</span> {formatTeacherNames(schedule.teacher_names)}
                          </p>
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-gray-600 mb-4">
                            <span className="font-medium">Notes:</span> {schedule.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {schedule.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/attendance/${schedule.id}`)}
                            className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50"
                            title="View Attendance"
                          >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {schedule.status === 'completed' && scheduleStats[schedule.id] && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h5 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <span className="text-xl mr-2">📊</span>
                          Class Statistics & Performance
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">
                              {scheduleStats[schedule.id].studentCount}
                            </div>
                            <div className="text-sm text-gray-500">Total Students</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-green-600">
                              {scheduleStats[schedule.id].attendanceRate}%
                            </div>
                            <div className="text-sm text-gray-500">Attendance Rate</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-purple-600">
                              {scheduleStats[schedule.id].avgKnowledge || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">Avg Knowledge</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-orange-600">
                              {scheduleStats[schedule.id].avgParticipation || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">Avg Participation</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white rounded-lg p-4 border">
                            <h6 className="text-md font-medium text-gray-800 mb-3">Attendance Breakdown</h6>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                                  <span className="text-sm font-medium">Present ({scheduleStats[schedule.id].presentCount})</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {scheduleStats[schedule.id].studentCount > 0
                                    ? ((scheduleStats[schedule.id].presentCount / scheduleStats[schedule.id].studentCount) * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${scheduleStats[schedule.id].studentCount > 0
                                      ? (scheduleStats[schedule.id].presentCount / scheduleStats[schedule.id].studentCount) * 100
                                      : 0}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                                  <span className="text-sm font-medium">Late ({scheduleStats[schedule.id].lateCount})</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {scheduleStats[schedule.id].studentCount > 0
                                    ? ((scheduleStats[schedule.id].lateCount / scheduleStats[schedule.id].studentCount) * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${scheduleStats[schedule.id].studentCount > 0
                                      ? (scheduleStats[schedule.id].lateCount / scheduleStats[schedule.id].studentCount) * 100
                                      : 0}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                                  <span className="text-sm font-medium">Absent ({scheduleStats[schedule.id].absentCount})</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {scheduleStats[schedule.id].studentCount > 0
                                    ? ((scheduleStats[schedule.id].absentCount / scheduleStats[schedule.id].studentCount) * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${scheduleStats[schedule.id].studentCount > 0
                                      ? (scheduleStats[schedule.id].absentCount / scheduleStats[schedule.id].studentCount) * 100
                                      : 0}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border">
                            <h6 className="text-md font-medium text-gray-800 mb-3">Performance Distribution</h6>
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-1">
                                  {scheduleStats[schedule.id].avgKnowledge || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Average Knowledge Score</div>
                                {scheduleStats[schedule.id].avgKnowledge && (
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${scheduleStats[schedule.id].avgKnowledge}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600 mb-1">
                                  {scheduleStats[schedule.id].avgParticipation || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Average Participation Score</div>
                                {scheduleStats[schedule.id].avgParticipation && (
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${scheduleStats[schedule.id].avgParticipation}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-lg mb-2">No schedules found for this date</p>
                <p className="text-sm">Select a date from the calendar or check the schedule table below</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Schedules Table */}
      <div className="mt-6 bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">All Schedules</h3>
          <p className="text-sm text-gray-500 mt-1">Click on date to view details above</p>
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
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
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
                          <div className="font-medium">{formatDate(schedule.scheduled_date)}</div>
                          <div className="text-gray-500">{schedule.scheduled_time || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div
                          className="max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigateToDate(schedule.scheduled_date)}
                          title="Click to view this date in calendar"
                        >
                          {schedule.lesson_titles?.join(', ') || 'No lessons'}
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
                        <div className="max-w-xs truncate">{formatTeacherNames(schedule.teacher_names)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {schedule.duration_minutes} min
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {schedule.status === 'completed' && allScheduleStats[schedule.id] ? (
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {allScheduleStats[schedule.id].studentCount}
                            </div>
                            <div className="text-xs text-gray-400">
                              {allScheduleStats[schedule.id].attendanceRate}% present
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {schedule.status === 'completed' && allScheduleStats[schedule.id] ? (
                          <div className="text-center">
                            <div className="flex space-x-2 text-xs">
                              <div>
                                <div className="font-bold text-purple-600">
                                  {allScheduleStats[schedule.id].avgKnowledge || 'N/A'}
                                </div>
                                <div className="text-gray-400">Knowledge</div>
                              </div>
                              <div>
                                <div className="font-bold text-orange-600">
                                  {allScheduleStats[schedule.id].avgParticipation || 'N/A'}
                                </div>
                                <div className="text-gray-400">Participation</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {schedule.status === 'completed' && (
                            <button
                              onClick={() => navigate(`/attendance/${schedule.id}`)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="View Attendance"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
                  {school.name || 'Unnamed School'}
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
                  <span className="ml-2 text-sm text-gray-700">{lesson.title || 'Untitled Lesson'}</span>
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
                .filter((teacher) => {
                  if (!formData.school_id) return true;
                  if (typeof teacher.school_ids === 'string') {
                    return teacher.school_ids
                      .split(',')
                      .map(id => parseInt(id.trim()))
                      .includes(parseInt(formData.school_id));
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
                    <span className="ml-2 text-sm text-gray-700">{teacher.name || 'Unnamed Teacher'}</span>
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