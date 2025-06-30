import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch student details
      const allStudents = await window.electronAPI.getStudents();
      const studentData = allStudents.find(s => s.id === parseInt(id));
      setStudent(studentData);

      if (studentData) {
        // Fetch related school
        const allSchools = await window.electronAPI.getSchools();
        const schoolData = allSchools.find(s => s.id === studentData.school_id);
        setSchool(schoolData);

        // Fetch teachers from the same school
        const teacherData = await window.electronAPI.getTeachers(studentData.school_id);
        setTeachers(teacherData);

        // Fetch classmates (students from same school, excluding current student)
        const classmateData = await window.electronAPI.getStudents(studentData.school_id);
        setClassmates(classmateData.filter(s => s.id !== parseInt(id)));

        // Fetch schedules from the same school
        const scheduleData = await window.electronAPI.getSchedules({ school_id: studentData.school_id });
        setSchedules(scheduleData);

        // Get unique lessons from schedules
        const allLessons = await window.electronAPI.getLessons();
        const lessonIds = new Set();
        scheduleData.forEach(schedule => {
          if (schedule.lesson_ids) {
            // Handle both string and array formats
            if (typeof schedule.lesson_ids === 'string') {
              schedule.lesson_ids.split(',').forEach(id => lessonIds.add(parseInt(id)));
            } else if (Array.isArray(schedule.lesson_ids)) {
              schedule.lesson_ids.forEach(id => lessonIds.add(parseInt(id)));
            }
          }
        });
        const schoolLessons = allLessons.filter(lesson => lessonIds.has(lesson.id));
        setLessons(schoolLessons);

        // Fetch attendance history for this student
        const attendanceData = await window.electronAPI.getStudentAttendance(null, parseInt(id));
        setAttendanceHistory(attendanceData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
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

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTeacherNames = (teacherNames) => {
    if (!teacherNames) return 'Not assigned';
    
    if (Array.isArray(teacherNames)) {
      return teacherNames.join(', ');
    }
    
    if (typeof teacherNames !== 'string') {
      return teacherNames;
    }
    
    if (teacherNames.includes(',')) {
      return teacherNames.split(',').map(name => name.trim()).join(', ');
    }
    
    const splitByCapital = teacherNames.split(/(?=[A-Z])/).filter(name => name.trim());
    if (splitByCapital.length > 1) {
      return splitByCapital.join(', ');
    }
    
    return teacherNames;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-red-500">Student not found</div>
        <button 
          onClick={() => navigate('/students')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/students')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Students
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Student Profile</h1>
      </div>

      {/* Student Details Card - Simplified */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
              <span className="text-xl">👨‍🎓</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-600">{student.grade || 'Grade not specified'} • {student.age ? `${student.age} years old` : 'Age not specified'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{student.email || 'No email'}</p>
            <p className="text-xs text-gray-500">
              {school ? (
                <button
                  onClick={() => navigate(`/schools/${school.id}`)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {school.name}
                </button>
              ) : 'No school assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance History and Performance - Moved Up */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">📊</span>
            Attendance & Performance History ({attendanceHistory.length})
          </h3>
        </div>
        <div className="p-6">
          {attendanceHistory.length > 0 ? (
            <>
              {/* Performance Summary with Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Attendance Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📊</span>
                    Attendance Overview
                  </h4>
                  
                  {(() => {
                    const totalSessions = attendanceHistory.length;
                    const presentCount = attendanceHistory.filter(a => a.attendance_status === 'present').length;
                    const lateCount = attendanceHistory.filter(a => a.attendance_status === 'late').length;
                    const absentCount = attendanceHistory.filter(a => a.attendance_status === 'absent').length;
                    
                    const presentPercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
                    const latePercentage = totalSessions > 0 ? (lateCount / totalSessions) * 100 : 0;
                    const absentPercentage = totalSessions > 0 ? (absentCount / totalSessions) * 100 : 0;
                    
                    return (
                      <div className="space-y-4">
                        {/* Present Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                            <span className="text-sm font-medium">Present ({presentCount})</span>
                          </div>
                          <span className="text-sm text-gray-600">{presentPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${presentPercentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Late Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                            <span className="text-sm font-medium">Late ({lateCount})</span>
                          </div>
                          <span className="text-sm text-gray-600">{latePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${latePercentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Absent Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                            <span className="text-sm font-medium">Absent ({absentCount})</span>
                          </div>
                          <span className="text-sm text-gray-600">{absentPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${absentPercentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-center pt-2 border-t">
                          <span className="text-lg font-bold text-gray-900">Total Sessions: {totalSessions}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Performance Progress Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📈</span>
                    Performance Progress
                  </h4>
                  
                  {(() => {
                    // Sort attendance by date to show progress over time
                    const sortedAttendance = attendanceHistory
                      .filter(a => a.knowledge_score || a.participation_score)
                      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
                    
                    if (sortedAttendance.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          <p>No score data available yet</p>
                        </div>
                      );
                    }
                    
                    // Create chart container
                    const chartHeight = 200;
                    const chartWidth = 300;
                    const maxScore = 100;
                    const padding = 30;
                    
                    // Calculate points for line chart
                    const knowledgePoints = [];
                    const participationPoints = [];
                    
                    sortedAttendance.forEach((record, index) => {
                      const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                      
                      if (record.knowledge_score) {
                        const y = chartHeight - padding - (record.knowledge_score / maxScore) * (chartHeight - 2 * padding);
                        knowledgePoints.push(`${x},${y}`);
                      }
                      
                      if (record.participation_score) {
                        const y = chartHeight - padding - (record.participation_score / maxScore) * (chartHeight - 2 * padding);
                        participationPoints.push(`${x},${y}`);
                      }
                    });
                    
                    return (
                      <div className="space-y-4">
                        {/* SVG Line Chart */}
                        <div className="bg-white rounded-lg p-4 border">
                          <svg width="100%" height="250" viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}>
                            {/* Grid lines */}
                            {[0, 25, 50, 75, 100].map(score => {
                              const y = chartHeight - padding - (score / maxScore) * (chartHeight - 2 * padding);
                              return (
                                <g key={score}>
                                  <line 
                                    x1={padding} 
                                    y1={y} 
                                    x2={chartWidth - padding} 
                                    y2={y} 
                                    stroke="#e5e7eb" 
                                    strokeWidth="1"
                                  />
                                  <text 
                                    x={padding - 10} 
                                    y={y + 4} 
                                    fontSize="10" 
                                    fill="#6b7280" 
                                    textAnchor="end"
                                  >
                                    {score}
                                  </text>
                                </g>
                              );
                            })}
                            
                            {/* Knowledge Score Line */}
                            {knowledgePoints.length > 1 && (
                              <polyline
                                points={knowledgePoints.join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            
                            {/* Participation Score Line */}
                            {participationPoints.length > 1 && (
                              <polyline
                                points={participationPoints.join(' ')}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            
                            {/* Knowledge Score Points */}
                            {sortedAttendance.map((record, index) => {
                              if (!record.knowledge_score) return null;
                              const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                              const y = chartHeight - padding - (record.knowledge_score / maxScore) * (chartHeight - 2 * padding);
                              return (
                                <circle
                                  key={`k-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            })}
                            
                            {/* Participation Score Points */}
                            {sortedAttendance.map((record, index) => {
                              if (!record.participation_score) return null;
                              const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                              const y = chartHeight - padding - (record.participation_score / maxScore) * (chartHeight - 2 * padding);
                              return (
                                <circle
                                  key={`p-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#8b5cf6"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            })}
                            
                            {/* X-axis labels */}
                            {sortedAttendance.map((record, index) => {
                              const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                              return (
                                <text
                                  key={`date-${index}`}
                                  x={x}
                                  y={chartHeight + 20}
                                  fontSize="8"
                                  fill="#6b7280"
                                  textAnchor="middle"
                                  transform={`rotate(-45, ${x}, ${chartHeight + 20})`}
                                >
                                  {new Date(record.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </text>
                              );
                            })}
                          </svg>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex justify-center space-x-6">
                          <div className="flex items-center">
                            <div className="w-4 h-1 bg-blue-500 rounded mr-2"></div>
                            <span className="text-xs text-gray-600">Knowledge Score</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-1 bg-purple-500 rounded mr-2"></div>
                            <span className="text-xs text-gray-600">Participation Score</span>
                          </div>
                        </div>
                        
                        {/* Current Averages */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {sortedAttendance.filter(a => a.knowledge_score).length > 0 
                                ? (sortedAttendance.reduce((sum, a) => sum + (a.knowledge_score || 0), 0) / sortedAttendance.filter(a => a.knowledge_score).length).toFixed(1)
                                : '0'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Avg Knowledge</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {sortedAttendance.filter(a => a.participation_score).length > 0 
                                ? (sortedAttendance.reduce((sum, a) => sum + (a.participation_score || 0), 0) / sortedAttendance.filter(a => a.participation_score).length).toFixed(1)
                                : '0'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Avg Participation</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Detailed History */}
              <div className="space-y-4">
                {attendanceHistory
                  .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
                  .map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {record.lesson_titles || 'No lesson assigned'}
                          </h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(record.attendance_status)}`}>
                            {record.attendance_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <strong>School:</strong> {record.school_name || 'Not assigned'}
                          </div>
                          <div>
                            <strong>Date:</strong> {new Date(record.scheduled_date).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Time:</strong> {record.scheduled_time}
                          </div>
                          <div>
                            <strong>Status:</strong> {record.schedule_status}
                          </div>
                        </div>
                        {(record.knowledge_score || record.participation_score) && (
                          <div className="flex items-center space-x-4 mb-2">
                            {record.knowledge_score && (
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-600 mr-1">Knowledge:</span>
                                <span className={`text-sm font-bold ${getScoreColor(record.knowledge_score)}`}>
                                  {record.knowledge_score}/100
                                </span>
                              </div>
                            )}
                            {record.participation_score && (
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-600 mr-1">Participation:</span>
                                <span className={`text-sm font-bold ${getScoreColor(record.participation_score)}`}>
                                  {record.participation_score}/100
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {record.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            <strong>Notes:</strong> {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No attendance records found for this student yet.</p>
              <p className="text-sm mt-2">Attendance will be recorded after lessons are completed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Classmates</p>
              <p className="text-2xl font-bold text-gray-900">{classmates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* School Information */}
      {school && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-xl mr-2">🏫</span>
            School Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">School Name</label>
              <button
                onClick={() => navigate(`/schools/${school.id}`)}
                className="mt-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                {school.name}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-gray-900">{school.address || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-gray-900">{school.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{school.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Teachers Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👨‍🏫</span>
            Teachers at {school ? school.name : 'School'} ({teachers.length})
          </h3>
        </div>
        <div className="p-6">
          {teachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <div 
                  key={teacher.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/teachers/${teacher.id}`)}
                >
                  <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                  <p className="text-sm text-gray-600">{teacher.subject || 'Subject not specified'}</p>
                  <p className="text-sm text-gray-500">{teacher.email || 'No email'}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {teacher.hire_date ? `Hired: ${new Date(teacher.hire_date).toLocaleDateString()}` : 'Hire date not set'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No teachers found at this school.</p>
              <button 
                onClick={() => navigate('/teachers')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                View All Teachers →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History and Performance */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">📊</span>
            Attendance & Performance History ({attendanceHistory.length})
          </h3>
        </div>
        <div className="p-6">
          {attendanceHistory.length > 0 ? (
            <>
              {/* Performance Summary with Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Attendance Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📊</span>
                    Attendance Overview
                  </h4>
                  
                  {(() => {
                    const totalSessions = attendanceHistory.length;
                    const presentCount = attendanceHistory.filter(a => a.attendance_status === 'present').length;
                    const lateCount = attendanceHistory.filter(a => a.attendance_status === 'late').length;
                    const absentCount = attendanceHistory.filter(a => a.attendance_status === 'absent').length;
                    
                    const presentPercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
                    const latePercentage = totalSessions > 0 ? (lateCount / totalSessions) * 100 : 0;
                    const absentPercentage = totalSessions > 0 ? (absentCount / totalSessions) * 100 : 0;
                    
                    return (
                      <div className="space-y-4">
                        {/* Present Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                            <span className="text-sm font-medium">Present ({presentCount})</span>
                          </div>
                          <span className="text-sm text-gray-600">{presentPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${presentPercentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Late Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                            <span className="text-sm font-medium">Late ({lateCount})</span>
                          </div>
                          <span className="text-sm text-gray-600">{latePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${latePercentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Absent Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                            <span className="text-sm font-medium">Absent ({absentCount})</span>
                          </div>
                          <span className="text-sm text-gray-600">{absentPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${absentPercentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-center pt-2 border-t">
                          <span className="text-lg font-bold text-gray-900">Total Sessions: {totalSessions}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Performance Progress Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📈</span>
                    Performance Progress
                  </h4>
                  
                  {(() => {
                    // Sort attendance by date to show progress over time
                    const sortedAttendance = attendanceHistory
                      .filter(a => a.knowledge_score || a.participation_score)
                      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
                    
                    if (sortedAttendance.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          <p>No score data available yet</p>
                        </div>
                      );
                    }
                    
                    // Create chart container
                    const chartHeight = 200;
                    const chartWidth = 300;
                    const maxScore = 100;
                    const padding = 30;
                    
                    // Calculate points for line chart
                    const knowledgePoints = [];
                    const participationPoints = [];
                    
                    sortedAttendance.forEach((record, index) => {
                      const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                      
                      if (record.knowledge_score) {
                        const y = chartHeight - padding - (record.knowledge_score / maxScore) * (chartHeight - 2 * padding);
                        knowledgePoints.push(`${x},${y}`);
                      }
                      
                      if (record.participation_score) {
                        const y = chartHeight - padding - (record.participation_score / maxScore) * (chartHeight - 2 * padding);
                        participationPoints.push(`${x},${y}`);
                      }
                    });
                    
                    return (
                      <div className="space-y-4">
                        {/* SVG Line Chart */}
                        <div className="bg-white rounded-lg p-4 border">
                          <svg width="100%" height="250" viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}>
                            {/* Grid lines */}
                            {[0, 25, 50, 75, 100].map(score => {
                              const y = chartHeight - padding - (score / maxScore) * (chartHeight - 2 * padding);
                              return (
                                <g key={score}>
                                  <line 
                                    x1={padding} 
                                    y1={y} 
                                    x2={chartWidth - padding} 
                                    y2={y} 
                                    stroke="#e5e7eb" 
                                    strokeWidth="1"
                                  />
                                  <text 
                                    x={padding - 10} 
                                    y={y + 4} 
                                    fontSize="10" 
                                    fill="#6b7280" 
                                    textAnchor="end"
                                  >
                                    {score}
                                  </text>
                                </g>
                              );
                            })}
                            
                            {/* Knowledge Score Line */}
                            {knowledgePoints.length > 1 && (
                              <polyline
                                points={knowledgePoints.join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            
                            {/* Participation Score Line */}
                            {participationPoints.length > 1 && (
                              <polyline
                                points={participationPoints.join(' ')}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            
                            {/* Knowledge Score Points */}
                            {sortedAttendance.map((record, index) => {
                              if (!record.knowledge_score) return null;
                              const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                              const y = chartHeight - padding - (record.knowledge_score / maxScore) * (chartHeight - 2 * padding);
                              return (
                                <circle
                                  key={`k-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            })}
                            
                            {/* Participation Score Points */}
                            {sortedAttendance.map((record, index) => {
                              if (!record.participation_score) return null;
                              const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                              const y = chartHeight - padding - (record.participation_score / maxScore) * (chartHeight - 2 * padding);
                              return (
                                <circle
                                  key={`p-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#8b5cf6"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            })}
                            
                            {/* X-axis labels */}
                            {sortedAttendance.map((record, index) => {
                              const x = padding + (index / (sortedAttendance.length - 1 || 1)) * (chartWidth - 2 * padding);
                              return (
                                <text
                                  key={`date-${index}`}
                                  x={x}
                                  y={chartHeight + 20}
                                  fontSize="8"
                                  fill="#6b7280"
                                  textAnchor="middle"
                                  transform={`rotate(-45, ${x}, ${chartHeight + 20})`}
                                >
                                  {new Date(record.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </text>
                              );
                            })}
                          </svg>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex justify-center space-x-6">
                          <div className="flex items-center">
                            <div className="w-4 h-1 bg-blue-500 rounded mr-2"></div>
                            <span className="text-xs text-gray-600">Knowledge Score</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-1 bg-purple-500 rounded mr-2"></div>
                            <span className="text-xs text-gray-600">Participation Score</span>
                          </div>
                        </div>
                        
                        {/* Current Averages */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {sortedAttendance.filter(a => a.knowledge_score).length > 0 
                                ? (sortedAttendance.reduce((sum, a) => sum + (a.knowledge_score || 0), 0) / sortedAttendance.filter(a => a.knowledge_score).length).toFixed(1)
                                : '0'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Avg Knowledge</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {sortedAttendance.filter(a => a.participation_score).length > 0 
                                ? (sortedAttendance.reduce((sum, a) => sum + (a.participation_score || 0), 0) / sortedAttendance.filter(a => a.participation_score).length).toFixed(1)
                                : '0'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Avg Participation</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Detailed History */}
              <div className="space-y-4">
                {attendanceHistory
                  .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
                  .map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {record.lesson_titles || 'No lesson assigned'}
                          </h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(record.attendance_status)}`}>
                            {record.attendance_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <strong>School:</strong> {record.school_name || 'Not assigned'}
                          </div>
                          <div>
                            <strong>Date:</strong> {new Date(record.scheduled_date).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Time:</strong> {record.scheduled_time}
                          </div>
                          <div>
                            <strong>Status:</strong> {record.schedule_status}
                          </div>
                        </div>
                        {(record.knowledge_score || record.participation_score) && (
                          <div className="flex items-center space-x-4 mb-2">
                            {record.knowledge_score && (
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-600 mr-1">Knowledge:</span>
                                <span className={`text-sm font-bold ${getScoreColor(record.knowledge_score)}`}>
                                  {record.knowledge_score}/100
                                </span>
                              </div>
                            )}
                            {record.participation_score && (
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-600 mr-1">Participation:</span>
                                <span className={`text-sm font-bold ${getScoreColor(record.participation_score)}`}>
                                  {record.participation_score}/100
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {record.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            <strong>Notes:</strong> {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No attendance records found for this student yet.</p>
              <p className="text-sm mt-2">Attendance will be recorded after lessons are completed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule History */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="text-xl mr-2">📅</span>
              Schedule History ({schedules.length})
            </h3>
            {schedules.length > 0 && (
              <button 
                onClick={() => navigate('/schedules')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All →
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          {schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules
                .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
                .slice(0, 10)
                .map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {schedule.lesson_titles || 'No lesson assigned'}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Date:</strong> {new Date(schedule.scheduled_date).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Time:</strong> {schedule.scheduled_time} ({schedule.duration_minutes} min)
                        </div>
                        <div>
                          <strong>Teachers:</strong> {formatTeacherNames(schedule.teacher_names)}
                        </div>
                      </div>
                      {schedule.notes && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Notes:</strong> {schedule.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No schedules found for this student's school yet.</p>
              <button 
                onClick={() => navigate('/schedules')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Create Schedule →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Classmates Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👥</span>
            Classmates at {school ? school.name : 'School'} ({classmates.length})
          </h3>
        </div>
        <div className="p-6">
          {classmates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classmates.map((classmate) => (
                <div 
                  key={classmate.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/students/${classmate.id}`)}
                >
                  <h4 className="font-semibold text-gray-900">{classmate.name}</h4>
                  <p className="text-sm text-gray-600">{classmate.grade || 'Grade not specified'}</p>
                  <p className="text-sm text-gray-500">Age: {classmate.age || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{classmate.email || 'No email'}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {classmate.enrollment_date ? `Enrolled: ${new Date(classmate.enrollment_date).toLocaleDateString()}` : 'Enrollment date not set'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No other students found at this school.</p>
              <button 
                onClick={() => navigate('/students')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                View All Students →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
