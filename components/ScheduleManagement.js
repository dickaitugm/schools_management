'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { useAuth } from './AuthContext';
import { formatDateIndonesian, formatDateTimeIndonesian, formatTimeIndonesian } from '../utils/dateUtils';

const ScheduleManagement = ({ selectedSchoolId, onViewProfile, onViewAssessment }) => {
  const { hasPermission, logActivity, user } = useAuth();
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

  const [assessmentStats, setAssessmentStats] = useState(null);
  const [scheduleAssessments, setScheduleAssessments] = useState({}); // Store assessment data for multiple schedules

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-300' },
    { value: 'in-progress', label: 'In Progress', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' },
    { value: 'completed', label: 'Completed', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300' },
    { value: 'cancelled', label: 'Cancelled', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300' }
  ];

  useEffect(() => {
    fetchSchedules();
    fetchRecentAndUpcomingSchedules();
    fetchSchools();
    fetchTeachers();
    fetchLessons();
  }, [currentPage, searchTerm, statusFilter, selectedSchoolId, schoolFilter, dateFilter, timeFilter]);

  useEffect(() => {
    // Auto-update schedule statuses on component mount
    autoUpdateScheduleStatuses();
  }, []);

  useEffect(() => {
    // Fetch assessment data for recent schedules whenever upcomingSchedules changes
    upcomingSchedules.forEach(schedule => {
      const isFuture = isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time);
      if (!isFuture && !scheduleAssessments[schedule.id]) {
        fetchScheduleAssessment(schedule.id);
      }
    });
  }, [upcomingSchedules]);

  useEffect(() => {
    if (selectedSchoolId) {
      setFormData(prev => ({
        ...prev,
        school_id: selectedSchoolId
      }));
    }
  }, [selectedSchoolId]);

  const autoUpdateScheduleStatuses = async () => {
    try {
      // This will trigger auto-updates in the backend for all schedules based on current time
      const response = await fetch('/api/schedules/auto-update-status', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Refresh schedules to reflect any changes
        if (data.updatedCount > 0) {
          fetchSchedules();
          fetchRecentAndUpcomingSchedules();
        }
      }
    } catch (error) {
      console.error('Error auto-updating schedule statuses:', error);
    }
  };

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

  const fetchRecentAndUpcomingSchedules = async () => {
    try {
      // Get upcoming schedules
      const upcomingParams = new URLSearchParams({
        limit: 3,
        upcoming: 'true'
      });
      if (selectedSchoolId) upcomingParams.append('school_id', selectedSchoolId);

      // Get recent schedules (last 2)
      const recentParams = new URLSearchParams({
        limit: 2,
        page: 1
      });
      if (selectedSchoolId) recentParams.append('school_id', selectedSchoolId);

      const [upcomingResponse, recentResponse] = await Promise.all([
        fetch(`/api/schedules?${upcomingParams}`),
        fetch(`/api/schedules?${recentParams}`)
      ]);

      const [upcomingData, recentData] = await Promise.all([
        upcomingResponse.json(),
        recentResponse.json()
      ]);

      const upcomingSchedules = upcomingData.success ? upcomingData.data || [] : [];
      const recentSchedules = recentData.success ? recentData.data || [] : [];

      // Filter recent schedules to only include past ones and limit to 2
      const pastSchedules = recentSchedules.filter(schedule => 
        !isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time)
      ).slice(0, 2);

      // Combine upcoming and recent schedules, prioritizing upcoming
      const combinedSchedules = [...upcomingSchedules, ...pastSchedules].slice(0, 5);
      
      setUpcomingSchedules(combinedSchedules);

      // Fetch assessment data for recent schedules
      pastSchedules.forEach(schedule => {
        if (!scheduleAssessments[schedule.id]) {
          fetchScheduleAssessment(schedule.id);
        }
      });
      
    } catch (error) {
      console.error('Error fetching schedules:', error);
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

  const fetchScheduleAssessment = async (scheduleId) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/assessment`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.students) {
        // Filter students who have assessment data
        const assessedStudents = data.data.students.filter(student => 
          student.attendance_id && 
          (student.personal_development_level || 
           student.critical_thinking_level || 
           student.team_work_level || 
           student.academic_knowledge_level)
        );
        
        const assessmentData = {
          assessedCount: assessedStudents.length,
          totalStudents: data.data.students.length,
          averages: null
        };
        
        if (assessedStudents.length > 0) {
          const totalPersonalDev = assessedStudents.reduce((sum, s) => sum + (s.personal_development_level || 0), 0);
          const totalCriticalThinking = assessedStudents.reduce((sum, s) => sum + (s.critical_thinking_level || 0), 0);
          const totalTeamWork = assessedStudents.reduce((sum, s) => sum + (s.team_work_level || 0), 0);
          const totalAcademicKnowledge = assessedStudents.reduce((sum, s) => sum + (s.academic_knowledge_level || 0), 0);
          
          const avgPersonalDev = (totalPersonalDev / assessedStudents.length).toFixed(1);
          const avgCriticalThinking = (totalCriticalThinking / assessedStudents.length).toFixed(1);
          const avgTeamWork = (totalTeamWork / assessedStudents.length).toFixed(1);
          const avgAcademicKnowledge = (totalAcademicKnowledge / assessedStudents.length).toFixed(1);
          
          const overallAverage = ((parseFloat(avgPersonalDev) + parseFloat(avgCriticalThinking) + parseFloat(avgTeamWork) + parseFloat(avgAcademicKnowledge)) / 4).toFixed(1);
          
          assessmentData.averages = {
            personal_development: avgPersonalDev,
            critical_thinking: avgCriticalThinking,
            team_work: avgTeamWork,
            academic_knowledge: avgAcademicKnowledge,
            overall: overallAverage
          };
        }
        
        // Store assessment data for this schedule
        setScheduleAssessments(prev => ({
          ...prev,
          [scheduleId]: assessmentData
        }));
        
        return assessmentData;
      }
    } catch (error) {
      console.error('Error fetching schedule assessment:', error);
      return null;
    }
  };

  const fetchAssessmentStats = async (scheduleId) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/assessment`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.students) {
        // Filter students who have assessment data (attendance_id is not null)
        const assessedStudents = data.data.students.filter(student => 
          student.attendance_id && 
          (student.personal_development_level || 
           student.critical_thinking_level || 
           student.team_work_level || 
           student.academic_knowledge_level)
        );
        
        const assessmentStatsData = {
          assessedCount: assessedStudents.length,
          totalStudents: data.data.students.length,
          averages: null
        };
        
        if (assessedStudents.length > 0) {
          const totalPersonalDev = assessedStudents.reduce((sum, s) => sum + (s.personal_development_level || 0), 0);
          const totalCriticalThinking = assessedStudents.reduce((sum, s) => sum + (s.critical_thinking_level || 0), 0);
          const totalTeamWork = assessedStudents.reduce((sum, s) => sum + (s.team_work_level || 0), 0);
          const totalAcademicKnowledge = assessedStudents.reduce((sum, s) => sum + (s.academic_knowledge_level || 0), 0);
          
          const avgPersonalDev = (totalPersonalDev / assessedStudents.length).toFixed(1);
          const avgCriticalThinking = (totalCriticalThinking / assessedStudents.length).toFixed(1);
          const avgTeamWork = (totalTeamWork / assessedStudents.length).toFixed(1);
          const avgAcademicKnowledge = (totalAcademicKnowledge / assessedStudents.length).toFixed(1);
          
          const overallAverage = ((parseFloat(avgPersonalDev) + parseFloat(avgCriticalThinking) + parseFloat(avgTeamWork) + parseFloat(avgAcademicKnowledge)) / 4).toFixed(1);
          
          assessmentStatsData.averages = {
            personal_development: avgPersonalDev,
            critical_thinking: avgCriticalThinking,
            team_work: avgTeamWork,
            academic_knowledge: avgAcademicKnowledge,
            overall: overallAverage
          };
        }
        
        setAssessmentStats(assessmentStatsData);
        
        // Auto-update schedule status based on time and assessment completion
        if (selectedSchedule) {
          const newStatus = getAutoStatus(selectedSchedule, assessmentStatsData);
          if (newStatus !== selectedSchedule.status) {
            await updateScheduleStatus(selectedSchedule.id, newStatus);
          }
        }
        
      } else {
        console.error('Invalid assessment data structure:', data);
        setAssessmentStats(null);
      }
    } catch (error) {
      console.error('Error fetching assessment stats:', error);
      setAssessmentStats(null);
    }
  };

  const updateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedSchedule,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the selected schedule in state
        setSelectedSchedule(prev => prev ? { ...prev, status: newStatus } : null);
        
        // Refresh schedules list to reflect the change
        fetchSchedules();
        fetchRecentAndUpcomingSchedules();
        
        // Log activity
        logActivity(`Updated schedule status to ${newStatus}`, 'update');
      } else {
        console.error('Failed to update schedule status:', data.error);
      }
    } catch (error) {
      console.error('Error updating schedule status:', error);
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
    
    // Fetch assessment stats for this schedule
    if (schedule.id) {
      fetchAssessmentStats(schedule.id);
    }
    
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

    fetchAssessmentStats(schedule.id);
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
    
    // Special handling for status changes
    if (name === 'status' && selectedSchedule) {
      // Check if status change is allowed
      if (!canChangeStatus(selectedSchedule, value)) {
        if (value === 'completed') {
          setError('Cannot mark as completed: not all students have been assessed');
        } else if (['in-progress', 'completed'].includes(value) && 
                   isScheduleInFuture(selectedSchedule.scheduled_date, selectedSchedule.scheduled_time)) {
          setError('Cannot change status to in-progress or completed for future schedules');
        }
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user makes valid changes
    if (error) {
      setError(null);
    }
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
        fetchRecentAndUpcomingSchedules();
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
        fetchRecentAndUpcomingSchedules();
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

  // Helper functions for schedule status management
  const isScheduleInFuture = (scheduledDate, scheduledTime) => {
    const now = new Date();
    const scheduleDateTime = new Date(`${scheduledDate.split('T')[0]}T${scheduledTime}`);
    return scheduleDateTime > now;
  };

  const isScheduleInProgress = (scheduledDate, scheduledTime) => {
    const now = new Date();
    const scheduleDateTime = new Date(`${scheduledDate.split('T')[0]}T${scheduledTime}`);
    return scheduleDateTime <= now;
  };

  const getAutoStatus = (schedule, assessmentStats) => {
    const isFuture = isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time);
    
    if (isFuture) {
      return 'scheduled';
    }
    
    // If it's past/current time
    if (assessmentStats && assessmentStats.assessedCount === assessmentStats.totalStudents && assessmentStats.assessedCount > 0) {
      return 'completed';
    }
    
    return 'in-progress';
  };

  const canChangeStatus = (schedule, newStatus) => {
    const isFuture = isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time);
    
    // Future schedules can only be 'scheduled' or 'cancelled'
    if (isFuture) {
      return ['scheduled', 'cancelled'].includes(newStatus);
    }
    
    // Past/current schedules: check assessment completion for 'completed' status
    if (newStatus === 'completed') {
      // For completed status, all students must be assessed
      return assessmentStats && 
             assessmentStats.assessedCount === assessmentStats.totalStudents && 
             assessmentStats.assessedCount > 0;
    }
    
    // Other statuses are allowed for past/current schedules
    return true;
  };

  const getAvailableStatusOptions = () => {
    // For new schedules, don't show 'completed' status
    if (modalType === 'create') {
      return statusOptions.filter(status => status.value !== 'completed');
    }
    
    // For editing existing schedules
    if (!selectedSchedule || !formData.scheduled_date || !formData.scheduled_time) {
      return statusOptions.filter(status => status.value !== 'completed');
    }
    
    const isFuture = isScheduleInFuture(formData.scheduled_date, formData.scheduled_time);
    
    if (isFuture) {
      // Future schedules can only be 'scheduled' or 'cancelled'
      return statusOptions.filter(status => 
        ['scheduled', 'cancelled'].includes(status.value)
      );
    }
    
    // For past/current schedules, filter out 'completed' if assessment not complete
    if (!assessmentStats || 
        assessmentStats.assessedCount !== assessmentStats.totalStudents || 
        assessmentStats.assessedCount === 0) {
      return statusOptions.filter(status => status.value !== 'completed');
    }
    
    return statusOptions;
  };

  const shouldShowAssessmentButton = (schedule) => {
    const isFuture = isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time);
    return !isFuture && ['in-progress', 'completed'].includes(schedule.status);
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
        {hasPermission('create_schedules') && (
          <button
            onClick={() => openModal('create')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Add New Schedule
          </button>
        )}
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
              {selectedSchedule ? 
                `Schedule Details ${isScheduleInFuture(selectedSchedule.scheduled_date, selectedSchedule.scheduled_time) ? '(Upcoming)' : '(Recent)'}` : 
                (() => {
                  // Determine if we have more recent or upcoming schedules
                  const recentCount = upcomingSchedules.filter(s => !isScheduleInFuture(s.scheduled_date, s.scheduled_time)).length;
                  const upcomingCount = upcomingSchedules.filter(s => isScheduleInFuture(s.scheduled_date, s.scheduled_time)).length;
                  
                  if (recentCount > 0 && upcomingCount > 0) {
                    return 'Recent & Upcoming Schedules';
                  } else if (recentCount > 0) {
                    return 'Recent Schedules';
                  } else if (upcomingCount > 0) {
                    return 'Upcoming Schedules';
                  } else {
                    return 'Schedules';
                  }
                })()
              }
            </h2>
            {selectedSchedule && (
              <button
                onClick={() => {
                  setSelectedSchedule(null);
                  setAssessmentStats(null);
                  setDateFilter('');
                  setSelectedDate(new Date());
                }}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                title="Back to Schedule List"
              >
                Back to List
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
                  <p className="text-gray-600">{formatDateIndonesian(displaySchedule.scheduled_date)}</p>
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
                <div>
                  <span className="font-medium text-gray-700">Students:</span>
                  <p className="text-gray-600">
                    {displaySchedule.assessed_students || 0}/{displaySchedule.total_students || 0} assessed
                  </p>
                </div>
              </div>

              {/* Assessment Statistics */}
              {assessmentStats && (
                <div>
                  {assessmentStats.assessedCount > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="font-medium text-gray-700 block mb-2">Assessment Average:</span>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Personal Development:</span>
                          <span className="font-semibold text-blue-600 ml-2">{assessmentStats.averages.personal_development}/5</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Critical Thinking:</span>
                          <span className="font-semibold text-green-600 ml-2">{assessmentStats.averages.critical_thinking}/5</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Team Work:</span>
                          <span className="font-semibold text-purple-600 ml-2">{assessmentStats.averages.team_work}/5</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Academic Knowledge:</span>
                          <span className="font-semibold text-orange-600 ml-2">{assessmentStats.averages.academic_knowledge}/5</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-600">Overall Average:</span>
                        <span className="font-bold text-indigo-600 ml-2 text-lg">{assessmentStats.averages.overall}/5</span>
                      </div>
                    </div>
                  ) : displaySchedule.status === 'completed' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        📊 No assessment data available for this completed schedule.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

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
                {hasPermission('update_schedules') && (
                  <button
                    onClick={() => openModal('edit', displaySchedule)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}
                {displaySchedule.status === 'completed' && (hasPermission('update_schedules') || user.role === 'admin' || user.role === 'teacher') && (
                  <button
                    onClick={() => handleViewScheduleAssessment(displaySchedule.id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Assessment
                  </button>
                )}
                {hasPermission('delete_schedules') && (
                  <button
                    onClick={() => handleDelete(displaySchedule)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ) : !selectedSchedule && upcomingSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">📅</span>
              <p>No schedules available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.map(schedule => {
                const isFuture = isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time);
                const scheduleAssessment = scheduleAssessments[schedule.id];
                
                return (
                  <div
                    key={schedule.id}
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isFuture ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'
                    }`}
                    onClick={() => handleScheduleClick(schedule)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{schedule.school_name}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            isFuture ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {isFuture ? 'Upcoming' : 'Recent'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(schedule.status).bg} ${getStatusClasses(schedule.status).text}`}>
                          {statusOptions.find(s => s.value === schedule.status)?.label}
                        </span>
                      </div>

                      {/* Date and Time Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <p className="text-gray-600">{formatDateIndonesian(schedule.scheduled_date)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Time:</span>
                          <p className="text-gray-600">{formatTime(schedule.scheduled_time)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Duration:</span>
                          <p className="text-gray-600">{schedule.duration_minutes} minutes</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Students:</span>
                          <p className="text-gray-600">
                            {schedule.assessed_students || 0}/{schedule.total_students || 0} assessed
                          </p>
                        </div>
                      </div>

                      {/* Assessment Average for Recent schedules */}
                      {!isFuture && scheduleAssessment && scheduleAssessment.averages && (
                        <div className="border-t pt-3">
                          <span className="font-medium text-gray-700 text-sm">Assessment Average:</span>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div className="text-gray-600">
                              Personal Development: <span className="font-medium">{scheduleAssessment.averages.personal_development}/5</span>
                            </div>
                            <div className="text-gray-600">
                              Critical Thinking: <span className="font-medium">{scheduleAssessment.averages.critical_thinking}/5</span>
                            </div>
                            <div className="text-gray-600">
                              Team Work: <span className="font-medium">{scheduleAssessment.averages.team_work}/5</span>
                            </div>
                            <div className="text-gray-600">
                              Academic Knowledge: <span className="font-medium">{scheduleAssessment.averages.academic_knowledge}/5</span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-700 font-medium">Overall Average: </span>
                            <span className={`font-bold ${
                              parseFloat(scheduleAssessment.averages.overall) >= 4 ? 'text-green-600' :
                              parseFloat(scheduleAssessment.averages.overall) >= 3 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {scheduleAssessment.averages.overall}/5
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Warning for Recent schedules with no assessment */}
                      {!isFuture && (!scheduleAssessment || !scheduleAssessment.averages) && schedule.status === 'completed' && (
                        <div className="border-t pt-3">
                          <div className="text-amber-600 text-sm flex items-center gap-1">
                            <span>⚠️</span>
                            <span>No assessment data available</span>
                          </div>
                        </div>
                      )}

                      {/* Teachers */}
                      {schedule.teachers && schedule.teachers.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Teachers:</span>
                          <div className="mt-1">
                            {schedule.teachers.slice(0, 2).map(teacher => (
                              <div key={teacher.id} className="text-sm text-gray-600">
                                {teacher.name} - {teacher.subject}
                              </div>
                            ))}
                            {schedule.teachers.length > 2 && (
                              <div className="text-sm text-gray-500">
                                +{schedule.teachers.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Lessons */}
                      {schedule.lessons && schedule.lessons.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Lessons:</span>
                          <div className="mt-1">
                            {schedule.lessons.slice(0, 2).map(lesson => (
                              <div key={lesson.id} className="text-sm text-gray-600">
                                {lesson.title}
                              </div>
                            ))}
                            {schedule.lessons.length > 2 && (
                              <div className="text-sm text-gray-500">
                                +{schedule.lessons.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        {shouldShowAssessmentButton(schedule) && (hasPermission('update_schedules') || user.role === 'admin' || user.role === 'teacher') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewScheduleAssessment(schedule.id);
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            Assessment
                          </button>
                        )}
                        {hasPermission('update_schedules') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('edit', schedule);
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewScheduleProfile(schedule.id);
                          }}
                          className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                        Student Count
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
                              {formatDateIndonesian(schedule.scheduled_date)}
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
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {schedule.assessed_students || 0}/{schedule.total_students || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              {schedule.assessed_students > 0 ? 'assessed' : 'not assessed'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(schedule.status).bg} ${getStatusClasses(schedule.status).text}`}>
                            {statusOptions.find(s => s.value === schedule.status)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {hasPermission('update_schedules') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal('edit', schedule);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                          )}
                          {shouldShowAssessmentButton(schedule) && (hasPermission('update_schedules') || user.role === 'admin' || user.role === 'teacher') && (
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
                          {hasPermission('delete_schedules') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(schedule);
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
                  {getAvailableStatusOptions().map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {modalType === 'edit' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {isScheduleInFuture(formData.scheduled_date, formData.scheduled_time) 
                      ? 'Future schedules can only be scheduled or cancelled'
                      : 'Complete status requires all students to be assessed'
                    }
                  </p>
                )}
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
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
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
