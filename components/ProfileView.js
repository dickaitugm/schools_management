'use client';

import React, { useState, useEffect } from 'react';

const ProfileView = ({ entityType, id, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && entityType) {
      fetchProfile();
    }
  }, [id, entityType]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching profile for ${entityType} ID: ${id}`);
      const response = await fetch(`/api/${entityType}/${id}/profile`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch ${entityType} profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Profile data:', data);
      setProfile(data);
    } catch (error) {
      console.error(`Error fetching ${entityType} profile:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString).toLocaleDateString('id-ID');
    const time = timeString ? timeString.slice(0, 5) : '';
    return time ? `${date} ${time}` : date;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {entityType.charAt(0).toUpperCase() + entityType.slice(1).slice(0, -1)} Profile
        </h1>
      </div>

        {/* School Profile */}
        {entityType === 'schools' && (
          <div>
            {/* Basic Info */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">{profile.school.name}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Address:</strong> {profile.school.address || 'N/A'}</p>
                  <p><strong>Phone:</strong> {profile.school.phone || 'N/A'}</p>
                  <p><strong>Email:</strong> {profile.school.email || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Created:</strong> {formatDate(profile.school.created_at)}</p>
                  <p><strong>Total Students:</strong> {profile.statistics.total_students}</p>
                  <p><strong>Total Teachers:</strong> {profile.statistics.total_teachers}</p>
                  <p><strong>Upcoming Schedules:</strong> {profile.statistics.upcoming_schedules}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <h4 className="text-green-800 font-semibold">Students</h4>
                <p className="text-2xl font-bold text-green-600">{profile.statistics.total_students}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <h4 className="text-blue-800 font-semibold">Teachers</h4>
                <p className="text-2xl font-bold text-blue-600">{profile.statistics.total_teachers}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <h4 className="text-purple-800 font-semibold">Total Schedules</h4>
                <p className="text-2xl font-bold text-purple-600">{profile.statistics.total_schedules}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center">
                <h4 className="text-orange-800 font-semibold">Upcoming</h4>
                <p className="text-2xl font-bold text-orange-600">{profile.statistics.upcoming_schedules}</p>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Teachers ({profile.teachers.length})</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.teachers.slice(0, 6).map((teacher) => (
                  <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold">{teacher.name}</h5>
                    <p className="text-sm text-gray-600">Subject: {teacher.subject || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Email: {teacher.email || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Associated: {formatDate(teacher.association_date)}</p>
                  </div>
                ))}
              </div>
              {profile.teachers.length > 6 && (
                <p className="text-sm text-gray-500 mt-2">... and {profile.teachers.length - 6} more teachers</p>
              )}
            </div>

            {/* Recent Schedules */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Recent Schedules</h4>
              <div className="space-y-3">
                {profile.recent_schedules.slice(0, 5).map((schedule) => (
                  <div key={schedule.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{formatDateTime(schedule.scheduled_date, schedule.scheduled_time)}</p>
                        <p className="text-sm text-gray-600">Duration: {schedule.duration_minutes} minutes</p>
                        <p className="text-sm text-gray-600">Status: {schedule.status}</p>
                        {schedule.teacher_names && schedule.teacher_names[0] && (
                          <p className="text-sm text-gray-600">Teachers: {schedule.teacher_names.join(', ')}</p>
                        )}
                        {schedule.lesson_titles && schedule.lesson_titles[0] && (
                          <p className="text-sm text-gray-600">Lessons: {schedule.lesson_titles.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Teacher Profile */}
        {entityType === 'teachers' && (
          <div>
            {/* Basic Info */}
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-green-800">{profile.teacher.name}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Subject:</strong> {profile.teacher.subject || 'N/A'}</p>
                  <p><strong>Phone:</strong> {profile.teacher.phone || 'N/A'}</p>
                  <p><strong>Email:</strong> {profile.teacher.email || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Hire Date:</strong> {formatDate(profile.teacher.hire_date)}</p>
                  <p><strong>Created:</strong> {formatDate(profile.teacher.created_at)}</p>
                  <p><strong>Schools:</strong> {profile.statistics.total_schools}</p>
                  <p><strong>Students:</strong> {profile.statistics.total_students}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <h4 className="text-blue-800 font-semibold">Schools</h4>
                <p className="text-2xl font-bold text-blue-600">{profile.statistics.total_schools}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <h4 className="text-green-800 font-semibold">Students</h4>
                <p className="text-2xl font-bold text-green-600">{profile.statistics.total_students}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <h4 className="text-purple-800 font-semibold">Lessons</h4>
                <p className="text-2xl font-bold text-purple-600">{profile.statistics.total_lessons}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center">
                <h4 className="text-orange-800 font-semibold">Total Schedules</h4>
                <p className="text-2xl font-bold text-orange-600">{profile.statistics.total_schedules}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <h4 className="text-red-800 font-semibold">Upcoming</h4>
                <p className="text-2xl font-bold text-red-600">{profile.statistics.upcoming_schedules}</p>
              </div>
            </div>

            {/* Schools Section */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Schools ({profile.schools.length})</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.schools.map((school) => (
                  <div key={school.id} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold">{school.name}</h5>
                    <p className="text-sm text-gray-600">{school.address || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Associated: {formatDate(school.association_date)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lessons Section */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Lessons ({profile.lessons.length})</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.lessons.slice(0, 4).map((lesson) => (
                  <div key={lesson.id} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold">{lesson.title}</h5>
                    <p className="text-sm text-gray-600">{lesson.description || 'No description'}</p>
                    <p className="text-sm text-gray-600">Duration: {lesson.duration_minutes} minutes</p>
                    <p className="text-sm text-gray-600">Target Grade: {lesson.target_grade || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Profile */}
        {entityType === 'students' && (
          <div>
            {/* Basic Info */}
            <div className="bg-purple-50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-purple-800">{profile.student.name}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>School:</strong> {profile.student.school_name}</p>
                  <p><strong>Grade:</strong> {profile.student.grade || 'N/A'}</p>
                  <p><strong>Age:</strong> {profile.student.age || 'N/A'}</p>
                  <p><strong>Phone:</strong> {profile.student.phone || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Email:</strong> {profile.student.email || 'N/A'}</p>
                  <p><strong>Enrollment Date:</strong> {formatDate(profile.student.enrollment_date)}</p>
                  <p><strong>Attendance Rate:</strong> {profile.statistics.attendance_rate}%</p>
                  <p><strong>Teachers:</strong> {profile.statistics.total_teachers}</p>
                </div>
              </div>
            </div>

            {/* Performance Statistics */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <h4 className="text-green-800 font-semibold">Attendance Rate</h4>
                <p className="text-2xl font-bold text-green-600">{profile.statistics.attendance_rate}%</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <h4 className="text-blue-800 font-semibold">Avg Knowledge</h4>
                <p className="text-2xl font-bold text-blue-600">{profile.statistics.avg_knowledge_score || 'N/A'}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <h4 className="text-purple-800 font-semibold">Avg Participation</h4>
                <p className="text-2xl font-bold text-purple-600">{profile.statistics.avg_participation_score || 'N/A'}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center">
                <h4 className="text-orange-800 font-semibold">Total Sessions</h4>
                <p className="text-2xl font-bold text-orange-600">{profile.statistics.total_attendances}</p>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Teachers ({profile.teachers.length})</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold">{teacher.name}</h5>
                    <p className="text-sm text-gray-600">Subject: {teacher.subject || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Teaching since: {formatDate(teacher.association_date)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Recent Attendance</h4>
              <div className="space-y-3">
                {profile.attendance_records.slice(0, 5).map((record) => (
                  <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{formatDateTime(record.scheduled_date, record.scheduled_time)}</p>
                        <p className="text-sm text-gray-600">Status: 
                          <span className={`ml-1 ${record.attendance_status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.attendance_status}
                          </span>
                        </p>
                        {record.lesson_titles && record.lesson_titles[0] && (
                          <p className="text-sm text-gray-600">Lessons: {record.lesson_titles.join(', ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {record.knowledge_score && (
                          <p className="text-sm">Knowledge: {record.knowledge_score}/100</p>
                        )}
                        {record.participation_score && (
                          <p className="text-sm">Participation: {record.participation_score}/100</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lesson Profile */}
        {entityType === 'lessons' && (
          <div>
            {/* Basic Info */}
            <div className="bg-orange-50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-4 text-orange-800">{profile.lesson.title}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Description:</strong> {profile.lesson.description || 'No description'}</p>
                  <p><strong>Duration:</strong> {profile.lesson.duration_minutes} minutes</p>
                  <p><strong>Target Grade:</strong> {profile.lesson.target_grade || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Created:</strong> {formatDate(profile.lesson.created_at)}</p>
                  <p><strong>Teachers:</strong> {profile.statistics.total_teachers}</p>
                  <p><strong>Students Taught:</strong> {profile.statistics.total_students_taught}</p>
                  <p><strong>Total Sessions:</strong> {profile.statistics.total_schedules}</p>
                </div>
              </div>
              {profile.lesson.materials && (
                <div className="mt-4">
                  <p><strong>Materials:</strong></p>
                  <p className="text-sm bg-white p-3 rounded mt-1">{profile.lesson.materials}</p>
                </div>
              )}
            </div>

            {/* Performance Statistics */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <h4 className="text-blue-800 font-semibold">Teachers</h4>
                <p className="text-2xl font-bold text-blue-600">{profile.statistics.total_teachers}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <h4 className="text-green-800 font-semibold">Students Taught</h4>
                <p className="text-2xl font-bold text-green-600">{profile.statistics.total_students_taught}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <h4 className="text-purple-800 font-semibold">Avg Knowledge</h4>
                <p className="text-2xl font-bold text-purple-600">{profile.statistics.avg_knowledge_score || 'N/A'}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center">
                <h4 className="text-orange-800 font-semibold">Avg Participation</h4>
                <p className="text-2xl font-bold text-orange-600">{profile.statistics.avg_participation_score || 'N/A'}</p>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-3">Teachers ({profile.teachers.length})</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold">{teacher.name}</h5>
                    <p className="text-sm text-gray-600">Subject: {teacher.subject || 'N/A'}</p>
                    {teacher.school_names && teacher.school_names[0] && (
                      <p className="text-sm text-gray-600">Schools: {teacher.school_names.join(', ')}</p>
                    )}
                    <p className="text-xs text-gray-500">Teaching since: {formatDate(teacher.association_date)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance by School */}
            {profile.performance_by_school.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-3">Performance by School</h4>
                <div className="space-y-3">
                  {profile.performance_by_school.map((school, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold">{school.school_name}</h5>
                          <p className="text-sm text-gray-600">Students: {school.students_count}</p>
                          <p className="text-sm text-gray-600">Sessions: {school.total_sessions}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Knowledge: {school.avg_knowledge_score || 'N/A'}</p>
                          <p className="text-sm">Participation: {school.avg_participation_score || 'N/A'}</p>
                          <p className="text-sm">Attendance: {school.total_attendance_records > 0 ? 
                            ((school.present_count / school.total_attendance_records) * 100).toFixed(1) : 0}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default ProfileView;
