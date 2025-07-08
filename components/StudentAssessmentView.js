'use client';

import React, { useState, useEffect } from 'react';
import MultilineSelect from './MultilineSelect';
import { formatDateTimeIndonesian } from '../utils/dateUtils';
import { conditionallyMaskStudentName } from '../utils/privacyUtils';
import { useAuth } from './AuthContext';

const StudentAssessmentView = ({ scheduleId, onBack }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const assessmentCategories = {
    personal_development: {
      name: "Personal Development",
      description: "To build respectful, kind, and emotionally aware individuals",
      levels: {
        1: 'Says "please," "thank you," and "sorry" in daily interactions. Waits patiently and takes turns.',
        2: "Shows care for belongings and shared materials. Expresses feelings appropriately using words.",
        3: "Greets others politely and respectfully. Listens when others are speaking.",
        4: "Accepts feedback and corrections with a positive attitude. Helps friends or adults when someone is in need."
      }
    },
    critical_thinking: {
      name: "Critical Thinking", 
      description: "To develop curiosity, reasoning, and problem-solving skills",
      levels: {
        1: "Asks questions to learn more or clarify. Makes predictions and checks outcomes.",
        2: "Identifies simple problems and suggests solutions. Sorts and classifies objects or ideas based on features.",
        3: "Gives reasons for choices or actions. Connects new information to previous experiences.",
        4: "Participates in exploration or simple investigations. Thinks creatively in tasks or storytelling."
      }
    },
    team_work: {
      name: "Team Work",
      description: "To promote cooperation, communication, and mutual respect",
      levels: {
        1: "Works well with others in pairs or groups. Shares materials and takes turns during activities.",
        2: "Listens and responds respectfully to teammates' ideas. Helps solve group conflicts in a kind way.",
        3: "Encourages others and celebrates group success. Follows group roles or responsibilities.",
        4: "Waits for their turn to speak in discussions. Shows leadership by helping guide peers when needed."
      }
    },
    academic_knowledge: {
      name: "Academic Knowledge",
      description: "To help children enjoy learning and understand basic school subjects", 
      levels: {
        1: "Reads and understands simple to longer texts. Writes to share thoughts or tell stories.",
        2: "Follows instructions during learning activities. Asks questions to learn more.",
        3: "Shares ideas with teachers and friends. Finishes schoolwork with care.",
        4: "Enjoys learning new things. Tries their best, even when it's hard."
      }
    }
  };

  useEffect(() => {
    if (scheduleId) {
      fetchStudentsForAssessment();
    }
  }, [scheduleId]);

  const fetchStudentsForAssessment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching students for schedule:', scheduleId);
      const response = await fetch(`/api/schedules/${scheduleId}/assessment`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Assessment API response:', data);
      console.log('Raw students data:', data.data?.students);
      
      if (data.success) {
        // Transform API data to match component structure
        const transformedStudents = (data.data.students || []).map(student => {
          console.log('Processing student:', student.name, {
            personal_development_level: student.personal_development_level,
            critical_thinking_level: student.critical_thinking_level,
            team_work_level: student.team_work_level,
            academic_knowledge_level: student.academic_knowledge_level,
            attendance_status: student.attendance_status
          });
          
          return {
            ...student,
            assessment: {
              attendance_status: student.attendance_status || 'present',
              personal_development_level: student.personal_development_level,
              critical_thinking_level: student.critical_thinking_level,
              team_work_level: student.team_work_level,
              academic_knowledge_level: student.academic_knowledge_level,
              knowledge_score: student.knowledge_score,
              participation_score: student.participation_score,
              notes: student.assessment_notes || ''
            }
          };
        });
        
        console.log('Transformed students:', transformedStudents);
        setStudents(transformedStudents);
        setSchedule(data.data.schedule);
      } else {
        setError(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students for assessment:', error);
      setError(`Failed to fetch students for assessment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentChange = (studentId, category, level) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          assessment: {
            ...student.assessment,
            [`${category}_level`]: level
          }
        };
      }
      return student;
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          assessment: {
            ...student.assessment,
            notes
          }
        };
      }
      return student;
    }));
  };

  const handleAttendanceChange = (studentId, status) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          assessment: {
            ...student.assessment,
            attendance_status: status
          }
        };
      }
      return student;
    }));
  };

  const saveAssessments = async () => {
    setSaving(true);
    setError(null);
    console.log('Starting to save assessments...');
    
    try {
      // Add minimum delay to ensure loading indicator is visible
      const startTime = Date.now();

      const assessments = students.map(student => ({
        student_id: student.id,
        attendance_status: student.assessment?.attendance_status || 'present',
        knowledge_score: student.assessment?.knowledge_score || null,
        participation_score: student.assessment?.participation_score || null,
        personal_development_level: student.assessment?.personal_development_level || null,
        critical_thinking_level: student.assessment?.critical_thinking_level || null,
        team_work_level: student.assessment?.team_work_level || null,
        academic_knowledge_level: student.assessment?.academic_knowledge_level || null,
        notes: student.assessment?.notes || ''
      }));

      const response = await fetch(`/api/schedules/${scheduleId}/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessments),
      });

      const data = await response.json();
      
      // Ensure minimum loading time of 1 second to show spinner
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`Adding ${remainingTime}ms delay to show loading indicator`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      if (data.success) {
        setSuccess('Assessments saved successfully!');
        console.log('Assessments saved successfully');
        // Redirect back to schedule management after a short delay
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setError(data.error || 'Failed to save assessments');
        console.error('Failed to save assessments:', data.error);
      }
    } catch (error) {
      console.error('Error saving assessments:', error);
      setError('Failed to save assessments');
    } finally {
      console.log('Saving completed, setting saving to false');
      setSaving(false);
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
            Back to Schedules
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Student Assessment</h1>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-gray-500 text-xl">Loading students...</div>
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
            Back to Schedules
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Student Assessment</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchStudentsForAssessment}
                  className="bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-2 px-4 rounded"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Schedules
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Assessment</h1>
        {schedule && (
          <div className="text-gray-600">
            <p className="font-medium">{schedule.school_name}</p>
            <p>{formatDateTimeIndonesian(schedule.scheduled_date, schedule.scheduled_time)}</p>
            {schedule.teachers && schedule.teachers.length > 0 && (
              <p>Teachers: {schedule.teachers.map(t => t.name).join(', ')}</p>
            )}
            {schedule.lessons && schedule.lessons.length > 0 && (
              <p>Lessons: {schedule.lessons.map(l => l.title).join(', ')}</p>
            )}
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Assessment Categories Guide */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Assessment Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(assessmentCategories).map(([key, category]) => (
            <div key={key} className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">{category.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{category.description}</p>
              <div className="space-y-2">
                {Object.entries(category.levels).map(([level, description]) => (
                  <div key={level} className="text-xs">
                    <span className="font-medium text-blue-700">Level {level}:</span>
                    <span className="text-gray-600 ml-1">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Students Assessment */}
      {students.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">No students found for this schedule.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{conditionallyMaskStudentName(student.name, user, { preserveFirstName: true })}</h3>
                  <p className="text-gray-600">Grade: {student.grade}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendance
                    </label>
                    <select
                      value={student.assessment?.attendance_status || 'present'}
                      onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Assessment Categories */}
              <div className="space-y-4 mb-4">
                {Object.entries(assessmentCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                    <p className="text-xs text-gray-600 mb-3 italic">{category.description}</p>
                    
                    <MultilineSelect
                      value={student.assessment?.[`${categoryKey}_level`] || ''}
                      onChange={(value) => handleAssessmentChange(student.id, categoryKey, parseInt(value) || '')}
                      options={Object.entries(category.levels).map(([level, description]) => ({
                        value: level,
                        description: description
                      }))}
                      placeholder="Select Level"
                      className="w-full"
                    />
                    
                    {/* Show selected level description */}
                    {student.assessment?.[`${categoryKey}_level`] && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                        <strong>Level {student.assessment[`${categoryKey}_level`]}:</strong>{' '}
                        {category.levels[student.assessment[`${categoryKey}_level`]]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={student.assessment?.notes || ''}
                  onChange={(e) => handleNotesChange(student.id, e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this student's performance..."
                />
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveAssessments}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? 'Saving Assessments...' : 'Save Assessments'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentView;
