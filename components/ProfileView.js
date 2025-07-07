'use client';

import React, { useState, useEffect } from 'react';
import { formatDateIndonesian, formatDateTimeIndonesian } from '../utils/dateUtils';

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
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 text-blue-800">{profile.school.name}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Address:</strong> {profile.school.address || 'N/A'}</p>
                    <p><strong>Phone:</strong> {profile.school.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {profile.school.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>Created:</strong> {formatDateIndonesian(profile.school.created_at)}</p>
                    <p><strong>Total Students:</strong> {profile.statistics.total_students}</p>
                    <p><strong>Total Teachers:</strong> {profile.statistics.total_teachers}</p>
                    <p><strong>Upcoming Schedules:</strong> {profile.statistics.upcoming_schedules}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">School Statistics</h4>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="bg-green-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-green-800 font-semibold">Students</h4>
                  <p className="text-2xl font-bold text-green-600">{profile.statistics.total_students}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-blue-800 font-semibold">Teachers</h4>
                  <p className="text-2xl font-bold text-blue-600">{profile.statistics.total_teachers}</p>
                </div>
                <div className="bg-indigo-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-indigo-800 font-semibold">Lessons</h4>
                  <p className="text-2xl font-bold text-indigo-600">{profile.statistics.total_lessons || 0}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-purple-800 font-semibold">Total Schedules</h4>
                  <p className="text-2xl font-bold text-purple-600">{profile.statistics.total_schedules}</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-orange-800 font-semibold">Upcoming</h4>
                  <p className="text-2xl font-bold text-orange-600">{profile.statistics.upcoming_schedules}</p>
                </div>
              </div>
            </div>

            {/* Students Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-green-600 mr-2">👥</span>
                Students ({profile.students?.length || 0})
              </h4>
              {(profile.students?.length || 0) > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {profile.students.slice(0, 9).map((student) => (
                    <div key={student.id} className="bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <span className="text-green-600 text-sm font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-green-800">{student.name}</h5>
                          <p className="text-sm text-green-600">Grade: {student.grade || 'N/A'}</p>
                          <p className="text-sm text-green-600">Email: {student.email || 'N/A'}</p>
                          <p className="text-xs text-green-500">Enrolled: {formatDateIndonesian(student.enrollment_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">👥</span>
                  <p>No students enrolled yet</p>
                </div>
              )}
              {(profile.students?.length || 0) > 9 && (
                <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.students?.length || 0) - 9} more students</p>
              )}
            </div>

            {/* Lessons Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-indigo-600 mr-2">📚</span>
                Lessons ({profile.lessons?.length || 0})
              </h4>
              {profile.lessons && profile.lessons.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.lessons.slice(0, 8).map((lesson) => (
                    <div key={lesson.id} className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                          <span className="text-indigo-600 text-sm">📖</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-indigo-800">{lesson.title}</h5>
                          <p className="text-sm text-indigo-600">Subject: {lesson.subject || 'N/A'}</p>
                          <p className="text-sm text-indigo-600">Duration: {lesson.duration_minutes} min</p>
                          <p className="text-xs text-indigo-500">Used {lesson.usage_count} times in schedules</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">📚</span>
                  <p>No lessons scheduled yet</p>
                </div>
              )}
              {profile.lessons && (profile.lessons.length || 0) > 8 && (
                <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.lessons?.length || 0) - 8} more lessons</p>
              )}
            </div>

            {/* Teachers Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-blue-600 mr-2">👨‍🏫</span>
                Teachers ({profile.teachers?.length || 0})
              </h4>
              {(profile.teachers?.length || 0) > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.teachers.slice(0, 6).map((teacher) => (
                    <div key={teacher.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <span className="text-blue-600 text-sm font-semibold">
                            {teacher.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-blue-800">{teacher.name}</h5>
                          <p className="text-sm text-blue-600">Subject: {teacher.subject || 'N/A'}</p>
                          <p className="text-sm text-blue-600">Email: {teacher.email || 'N/A'}</p>
                          <p className="text-xs text-blue-500">Associated: {formatDateIndonesian(teacher.association_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">👨‍🏫</span>
                  <p>No teachers assigned yet</p>
                </div>
              )}
              {(profile.teachers?.length || 0) > 6 && (
                <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.teachers?.length || 0) - 6} more teachers</p>
              )}
            </div>

            {/* Recent Schedules */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-purple-600 mr-2">📅</span>
                Recent Schedules
              </h4>
              {(profile.recent_schedules?.length || 0) > 0 ? (
                <div className="space-y-4">
                  {profile.recent_schedules.slice(0, 5).map((schedule) => {
                    const statusColor = {
                      'scheduled': 'blue',
                      'in-progress': 'yellow', 
                      'completed': 'green',
                      'cancelled': 'red'
                    }[schedule.status] || 'gray';
                    
                    return (
                      <div key={schedule.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-purple-800 text-lg">
                                📅 {formatDateTimeIndonesian(schedule.scheduled_date, schedule.scheduled_time)}
                              </h5>
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800 border border-${statusColor}-200`}>
                                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-purple-600 mb-1">
                                  <span className="font-medium">🏫 School:</span> {schedule.school_name}
                                </p>
                                <p className="text-sm text-purple-600 mb-1">
                                  <span className="font-medium">⏱️ Duration:</span> {schedule.duration_minutes} minutes
                                </p>
                                {schedule.notes && (
                                  <p className="text-sm text-purple-600">
                                    <span className="font-medium">📝 Notes:</span> {schedule.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                {schedule.lesson_titles && schedule.lesson_titles[0] && (
                                  <div>
                                    <p className="text-sm font-medium text-purple-700 mb-1">📚 Lessons:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {schedule.lesson_titles.map((title, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                                          {title}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs text-purple-500">
                              <span className="bg-purple-100 px-2 py-1 rounded">
                                Schedule ID: {schedule.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">📅</span>
                  <p>No recent schedules found</p>
                </div>
              )}
              {(profile.recent_schedules?.length || 0) > 5 && (
                <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.recent_schedules?.length || 0) - 5} more schedules</p>
              )}
            </div>
          </div>
        )}

        {/* Teacher Profile */}
        {entityType === 'teachers' && (
          <div>
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 text-green-800">{profile.teacher.name}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Subject:</strong> {profile.teacher.subject || 'N/A'}</p>
                    <p><strong>Phone:</strong> {profile.teacher.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {profile.teacher.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>Hire Date:</strong> {formatDateIndonesian(profile.teacher.hire_date)}</p>
                    <p><strong>Created:</strong> {formatDateIndonesian(profile.teacher.created_at)}</p>
                    <p><strong>Schools:</strong> {profile.statistics.total_schools}</p>
                    <p><strong>Students:</strong> {profile.statistics.total_students}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Teacher Statistics</h4>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-blue-800 font-semibold">Schools</h4>
                  <p className="text-2xl font-bold text-blue-600">{profile.statistics.total_schools}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-green-800 font-semibold">Students</h4>
                  <p className="text-2xl font-bold text-green-600">{profile.statistics.total_students}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-purple-800 font-semibold">Lessons</h4>
                  <p className="text-2xl font-bold text-purple-600">{profile.statistics.total_lessons}</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-orange-800 font-semibold">Total Schedules</h4>
                  <p className="text-2xl font-bold text-orange-600">{profile.statistics.total_schedules}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-red-800 font-semibold">Upcoming</h4>
                  <p className="text-2xl font-bold text-red-600">{profile.statistics.upcoming_schedules}</p>
                </div>
              </div>
            </div>

            {/* Schools Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4">Schools ({profile.schools?.length || 0})</h4>
              {(profile.schools?.length || 0) > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.schools.map((school) => (
                    <div key={school.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h5 className="font-semibold">{school.name}</h5>
                      <p className="text-sm text-gray-600">{school.address || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Associated: {formatDateIndonesian(school.association_date)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">🏫</span>
                  <p>No schools associated yet</p>
                </div>
              )}
            </div>

            {/* Lessons Section */}
            {profile.lessons && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold mb-4">Lessons ({profile.lessons?.length || 0})</h4>
                {profile.lessons.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.lessons.slice(0, 4).map((lesson) => (
                      <div key={lesson.id} className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <div className="bg-indigo-100 p-2 rounded-full mr-3">
                            <span className="text-indigo-600 text-sm font-semibold">📚</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-indigo-800">{lesson.title}</h5>
                            <p className="text-sm text-indigo-600">{lesson.description || 'No description'}</p>
                            <p className="text-sm text-indigo-600">Duration: {lesson.duration_minutes} minutes</p>
                            <p className="text-xs text-indigo-500">Target Grade: {lesson.target_grade || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <span className="text-4xl block mb-2">📚</span>
                    <p>No lessons assigned yet</p>
                  </div>
                )}
                {(profile.lessons?.length || 0) > 4 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.lessons?.length || 0) - 4} more lessons</p>
                )}
              </div>
            )}

            {/* Recent Schedules */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-purple-600 mr-2">📅</span>
                Recent Schedules
              </h4>
              {profile.recent_schedules && profile.recent_schedules.length > 0 ? (
                <div className="space-y-4">
                  {profile.recent_schedules.slice(0, 5).map((schedule) => {
                    const statusColor = {
                      'scheduled': 'blue',
                      'in-progress': 'yellow', 
                      'completed': 'green',
                      'cancelled': 'red'
                    }[schedule.status] || 'gray';
                    
                    return (
                      <div key={schedule.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-purple-800 text-lg">
                                📅 {formatDateTimeIndonesian(schedule.scheduled_date, schedule.scheduled_time)}
                              </h5>
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800 border border-${statusColor}-200`}>
                                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-purple-600 mb-1">
                                  <span className="font-medium">🏫 School:</span> {schedule.school_name}
                                </p>
                                <p className="text-sm text-purple-600 mb-1">
                                  <span className="font-medium">⏱️ Duration:</span> {schedule.duration_minutes} minutes
                                </p>
                                {schedule.notes && (
                                  <p className="text-sm text-purple-600">
                                    <span className="font-medium">📝 Notes:</span> {schedule.notes}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                {schedule.lesson_titles && schedule.lesson_titles[0] && (
                                  <div>
                                    <p className="text-sm font-medium text-purple-700 mb-1">📚 Lessons:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {schedule.lesson_titles.map((title, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                                          {title}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs text-purple-500">
                              <span className="bg-purple-100 px-2 py-1 rounded">
                                Schedule ID: {schedule.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">📅</span>
                  <p>No recent schedules found</p>
                </div>
              )}
              {profile.recent_schedules && (profile.recent_schedules.length || 0) > 5 && (
                <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.recent_schedules?.length || 0) - 5} more schedules</p>
              )}
            </div>
          </div>
        )}

        {/* Student Profile */}
        {entityType === 'students' && (
          <div>
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <div className="bg-purple-50 rounded-lg p-6">
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
                    <p><strong>Enrollment Date:</strong> {formatDateIndonesian(profile.student.enrollment_date)}</p>
                    <p><strong>Attendance Rate:</strong> {profile.statistics.attendance_rate}%</p>
                    <p><strong>Teachers:</strong> {profile.statistics.total_teachers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Performance Statistics</h4>
              <div className="grid md:grid-cols-6 gap-4">
                <div className="bg-green-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-green-800 font-semibold text-sm">Attendance Rate</h4>
                  <p className="text-xl font-bold text-green-600">{profile.statistics.attendance_rate}%</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-blue-800 font-semibold text-sm">Knowledge</h4>
                  <p className="text-xl font-bold text-blue-600">{profile.statistics.avg_knowledge_score || 'N/A'}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-purple-800 font-semibold text-sm">Participation</h4>
                  <p className="text-xl font-bold text-purple-600">{profile.statistics.avg_participation_score || 'N/A'}</p>
                </div>
                <div className="bg-indigo-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-indigo-800 font-semibold text-sm">Personal Dev.</h4>
                  <p className="text-xl font-bold text-indigo-600">{profile.statistics.avg_personal_development || 'N/A'}</p>
                </div>
                <div className="bg-pink-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-pink-800 font-semibold text-sm">Critical Think.</h4>
                  <p className="text-xl font-bold text-pink-600">{profile.statistics.avg_critical_thinking || 'N/A'}</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-orange-800 font-semibold text-sm">Team Work</h4>
                  <p className="text-xl font-bold text-orange-600">{profile.statistics.avg_team_work || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4">Teachers ({profile.teachers?.length || 0})</h4>
              {(profile.teachers?.length || 0) > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.teachers.map((teacher) => (
                    <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <h5 className="font-semibold">{teacher.name}</h5>
                      <p className="text-sm text-gray-600">Subject: {teacher.subject || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Teaching since: {formatDateIndonesian(teacher.association_date)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">👨‍🏫</span>
                  <p>No teachers associated yet</p>
                </div>
              )}
            </div>

            {/* Learning Activity - Combined Attendance & Schedules */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-purple-600 mr-2">📚</span>
                Learning Activity
              </h4>
              <div className="space-y-3">
                {/* Combine and sort attendance records and schedules by date */}
                {(() => {
                  const activities = [];
                  
                  // Add attendance records
                  if (profile.attendance_records && profile.attendance_records.length > 0) {
                    profile.attendance_records.forEach(record => {
                      activities.push({
                        ...record,
                        type: 'attendance',
                        sort_date: new Date(record.scheduled_date + ' ' + (record.scheduled_time || '00:00'))
                      });
                    });
                  }
                  
                  // Add recent schedules
                  if (profile.recent_schedules && profile.recent_schedules.length > 0) {
                    profile.recent_schedules.forEach(schedule => {
                      activities.push({
                        ...schedule,
                        type: 'schedule',
                        sort_date: new Date(schedule.scheduled_date + ' ' + (schedule.scheduled_time || '00:00'))
                      });
                    });
                  }
                  
                  // Sort by date (newest first) and take top 8
                  const sortedActivities = activities
                    .sort((a, b) => b.sort_date - a.sort_date)
                    .slice(0, 8);
                  
                  return sortedActivities.map((activity, index) => {
                    if (activity.type === 'attendance') {
                      // Render attendance record
                      return (
                        <div key={`attendance-${activity.id}-${index}`} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                                <span className="text-yellow-600 text-sm">
                                  {activity.attendance_status === 'present' ? '✅' : '❌'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <h5 className="font-semibold text-yellow-800">
                                    📅 {formatDateTimeIndonesian(activity.scheduled_date, activity.scheduled_time)}
                                  </h5>
                                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Attendance
                                  </span>
                                </div>
                                <p className="text-sm text-yellow-600 mb-1">
                                  Status: <span className={`font-medium ${activity.attendance_status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                                    {activity.attendance_status}
                                  </span>
                                </p>
                                {activity.lesson_titles && activity.lesson_titles[0] && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {activity.lesson_titles.map((title, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                                        📚 {title}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {activity.knowledge_score && (
                                <p className="text-sm text-yellow-700">Knowledge: {activity.knowledge_score}/100</p>
                              )}
                              {activity.participation_score && (
                                <p className="text-sm text-yellow-700">Participation: {activity.participation_score}/100</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Render schedule
                      const statusColor = {
                        'scheduled': 'blue',
                        'in-progress': 'yellow', 
                        'completed': 'green',
                        'cancelled': 'red'
                      }[activity.status] || 'gray';
                      
                      return (
                        <div key={`schedule-${activity.id}-${index}`} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="bg-purple-100 p-2 rounded-full mr-3">
                                <span className="text-purple-600 text-sm">📅</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-purple-800">
                                    📅 {formatDateTimeIndonesian(activity.scheduled_date, activity.scheduled_time)}
                                  </h5>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                  </span>
                                </div>
                                <p className="text-sm text-purple-600 mb-1">
                                  🏫 School: {activity.school_name}
                                </p>
                                <p className="text-sm text-purple-600 mb-1">
                                  ⏱️ Duration: {activity.duration_minutes} minutes
                                </p>
                                {activity.lesson_titles && activity.lesson_titles[0] && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {activity.lesson_titles.map((title, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                                        📚 {title}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {activity.notes && (
                                  <p className="text-sm text-purple-600 mt-1">
                                    📝 {activity.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  });
                })()}
              </div>
              {((profile.attendance_records?.length || 0) + (profile.recent_schedules?.length || 0)) > 8 && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  ... and {((profile.attendance_records?.length || 0) + (profile.recent_schedules?.length || 0)) - 8} more activities
                </p>
              )}
              {((profile.attendance_records?.length || 0) + (profile.recent_schedules?.length || 0)) === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <span className="text-4xl block mb-2">📚</span>
                  <p>No learning activities yet</p>
                </div>
              )}
            </div>

            {/* Assessment History */}
            {profile.assessments && profile.assessments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="text-indigo-600 mr-2">📊</span>
                  Assessment History
                </h4>
                <div className="space-y-4">
                  {profile.assessments.slice(0, 5).map((assessment) => (
                    <div key={assessment.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start">
                          <div className="bg-indigo-100 p-2 rounded-full mr-3">
                            <span className="text-indigo-600 text-sm">📊</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-indigo-800">
                              📅 {formatDateTimeIndonesian(assessment.scheduled_date, assessment.scheduled_time)}
                            </h5>
                            <p className="text-sm text-indigo-600">
                              School: {assessment.school_name}
                            </p>
                            {assessment.lesson_titles && assessment.lesson_titles[0] && (
                              <p className="text-sm text-indigo-600">
                                Lessons: {assessment.lesson_titles.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            assessment.attendance_status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {assessment.attendance_status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Traditional Scores */}
                        {(assessment.knowledge_score || assessment.participation_score) && (
                          <div className="bg-white p-3 rounded border">
                            <h6 className="font-medium text-gray-700 mb-2">📚 Academic Scores</h6>
                            {assessment.knowledge_score && (
                              <p className="text-sm">Knowledge: <span className="font-semibold text-blue-600">{assessment.knowledge_score}/10</span></p>
                            )}
                            {assessment.participation_score && (
                              <p className="text-sm">Participation: <span className="font-semibold text-purple-600">{assessment.participation_score}/10</span></p>
                            )}
                          </div>
                        )}
                        
                        {/* Developmental Levels */}
                        <div className="bg-white p-3 rounded border">
                          <h6 className="font-medium text-gray-700 mb-2">🌱 Development</h6>
                          {assessment.personal_development_level && (
                            <p className="text-sm">Personal: <span className="font-semibold text-green-600">Level {assessment.personal_development_level}</span></p>
                          )}
                          {assessment.team_work_level && (
                            <p className="text-sm">Team Work: <span className="font-semibold text-orange-600">Level {assessment.team_work_level}</span></p>
                          )}
                        </div>
                        
                        <div className="bg-white p-3 rounded border">
                          <h6 className="font-medium text-gray-700 mb-2">🧠 Skills</h6>
                          {assessment.critical_thinking_level && (
                            <p className="text-sm">Critical Think: <span className="font-semibold text-pink-600">Level {assessment.critical_thinking_level}</span></p>
                          )}
                          {assessment.academic_knowledge_level && (
                            <p className="text-sm">Academic: <span className="font-semibold text-indigo-600">Level {assessment.academic_knowledge_level}</span></p>
                          )}
                        </div>
                      </div>
                      
                      {assessment.notes && (
                        <div className="mt-3 bg-white p-3 rounded border">
                          <h6 className="font-medium text-gray-700 mb-1">📝 Notes</h6>
                          <p className="text-sm text-gray-600">{assessment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {profile.assessments.length > 5 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">... and {profile.assessments.length - 5} more assessments</p>
                )}
              </div>
            )}

            {/* Lessons Section */}
            {profile.lessons && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold mb-4">Lessons ({profile.lessons?.length || 0})</h4>
                {(profile.lessons?.length || 0) > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.lessons.slice(0, 4).map((lesson) => (
                      <div key={lesson.id} className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start">
                          <div className="bg-indigo-100 p-2 rounded-full mr-3">
                            <span className="text-indigo-600 text-sm font-semibold">📚</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-indigo-800">{lesson.title}</h5>
                            <p className="text-sm text-indigo-600">{lesson.description || 'No description'}</p>
                            <p className="text-sm text-indigo-600">Duration: {lesson.duration_minutes} minutes</p>
                            <p className="text-xs text-indigo-500">Target Grade: {lesson.target_grade || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <span className="text-4xl block mb-2">📚</span>
                    <p>No lessons assigned yet</p>
                  </div>
                )}
                {(profile.lessons?.length || 0) > 4 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">... and {(profile.lessons?.length || 0) - 4} more lessons</p>
                )}
              </div>
            )}

          </div>
        )}

        {/* Lesson Profile */}
        {entityType === 'lessons' && (
          <div>
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 text-orange-800">{profile.lesson.title}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Description:</strong> {profile.lesson.description || 'No description'}</p>
                    <p><strong>Duration:</strong> {profile.lesson.duration_minutes} minutes</p>
                    <p><strong>Target Grade:</strong> {profile.lesson.target_grade || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>Created:</strong> {formatDateIndonesian(profile.lesson.created_at)}</p>
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
            </div>

            {/* Performance Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Lesson Statistics</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-blue-800 font-semibold">Teachers</h4>
                  <p className="text-2xl font-bold text-blue-600">{profile.statistics.total_teachers}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-green-800 font-semibold">Students Taught</h4>
                  <p className="text-2xl font-bold text-green-600">{profile.statistics.total_students_taught}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-purple-800 font-semibold">Avg Knowledge</h4>
                  <p className="text-2xl font-bold text-purple-600">{profile.statistics.avg_knowledge_score || 'N/A'}</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-orange-800 font-semibold">Avg Participation</h4>
                  <p className="text-2xl font-bold text-orange-600">{profile.statistics.avg_participation_score || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Teachers Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-semibold mb-4">Teachers ({profile.teachers.length})</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <h5 className="font-semibold">{teacher.name}</h5>
                    <p className="text-sm text-gray-600">Subject: {teacher.subject || 'N/A'}</p>
                    {teacher.school_names && teacher.school_names[0] && (
                      <p className="text-sm text-gray-600">Schools: {teacher.school_names.join(', ')}</p>
                    )}
                    <p className="text-xs text-gray-500">Teaching since: {formatDateIndonesian(teacher.association_date)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance by School */}
            {profile.performance_by_school.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold mb-4">Performance by School</h4>
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

        {/* Schedule Profile */}
        {entityType === 'schedules' && (
          <div>
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 text-orange-800">
                  Schedule at {profile.data.school_name}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Date:</strong> {formatDateIndonesian(profile.data.scheduled_date)}</p>
                    <p><strong>Time:</strong> {profile.data.scheduled_time?.slice(0, 5) || 'N/A'}</p>
                    <p><strong>Duration:</strong> {profile.data.duration_minutes} minutes</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        profile.data.status === 'completed' ? 'bg-green-100 text-green-800' :
                        profile.data.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        profile.data.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {profile.data.status.charAt(0).toUpperCase() + profile.data.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p><strong>School:</strong> {profile.data.school_name}</p>
                    <p><strong>Address:</strong> {profile.data.school_address || 'N/A'}</p>
                    <p><strong>School Phone:</strong> {profile.data.school_phone || 'N/A'}</p>
                    <p><strong>School Email:</strong> {profile.data.school_email || 'N/A'}</p>
                  </div>
                </div>
                {profile.data.notes && (
                  <div className="mt-4">
                    <p><strong>Notes:</strong></p>
                    <p className="text-sm bg-white p-3 rounded mt-1">{profile.data.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Schedule Statistics</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-blue-800 font-semibold">Teachers</h4>
                  <p className="text-2xl font-bold text-blue-600">{profile.data.stats.total_teachers}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-green-800 font-semibold">Lessons</h4>
                  <p className="text-2xl font-bold text-green-600">{profile.data.stats.total_lessons}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-purple-800 font-semibold">Students</h4>
                  <p className="text-2xl font-bold text-purple-600">{profile.data.stats.total_students}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <h4 className="text-yellow-800 font-semibold">Attendance Rate</h4>
                  <p className="text-2xl font-bold text-yellow-600">{profile.data.stats.attendance_rate}%</p>
                </div>
              </div>
            </div>

            {/* Teachers Section */}
            {profile.data.teachers && profile.data.teachers.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Assigned Teachers</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.data.teachers.map(teacher => (
                    <div key={teacher.id} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900">{teacher.name}</h5>
                      <p className="text-sm text-gray-600">{teacher.subject}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Email: {teacher.email || 'N/A'}</p>
                        <p>Phone: {teacher.phone || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lessons Section */}
            {profile.data.lessons && profile.data.lessons.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Assigned Lessons</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.data.lessons.map(lesson => (
                    <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900">{lesson.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                      <p className="text-sm text-gray-500 mt-2">Duration: {lesson.duration} minutes</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students Section */}
            {profile.data.students && profile.data.students.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Enrolled Students</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {profile.data.students.map(student => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900">{student.name}</h5>
                      <p className="text-sm text-gray-600">Class: {student.class_level}</p>
                      <p className="text-sm text-gray-500">Age: {student.age}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Section */}
            {profile.data.attendance && profile.data.attendance.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Attendance Records</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {profile.data.attendance.slice(0, 10).map((record, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              record.attendance_status === 'present' ? 'bg-green-100 text-green-800' :
                              record.attendance_status === 'absent' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.attendance_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateIndonesian(record.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.notes || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Assessments Section */}
            {profile.data.assessments && profile.data.assessments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Student Assessments</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Knowledge Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participation Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {profile.data.assessments.slice(0, 10).map((assessment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {assessment.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assessment.knowledge_score}/10
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assessment.participation_score}/10
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateIndonesian(assessment.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {assessment.notes || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default ProfileView;
