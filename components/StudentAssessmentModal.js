'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import MultilineSelect from './MultilineSelect';
import { formatDateIndonesian, formatDateTimeIndonesian } from '../utils/dateUtils';
import { conditionallyMaskStudentName } from '../utils/privacyUtils';
import { useAuth } from './AuthContext';

const StudentAssessmentModal = ({ scheduleId, onClose }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const assessmentCategories = {
    personal_development: {
      title: 'Personal Development',
      goal: 'To build respectful, kind, and emotionally aware individuals.',
      levels: {
        1: 'Says "please," "thank you," and "sorry" in daily interactions. Waits patiently and takes turns.',
        2: 'Shows care for belongings and shared materials. Expresses feelings appropriately using words.',
        3: 'Greets others politely and respectfully. Listens when others are speaking.',
        4: 'Accepts feedback and corrections with a positive attitude. Helps friends or adults when someone is in need.'
      }
    },
    critical_thinking: {
      title: 'Critical Thinking',
      goal: 'To develop curiosity, reasoning, and problem-solving skills.',
      levels: {
        1: 'Asks questions to learn more or clarify. Makes predictions and checks outcomes.',
        2: 'Identifies simple problems and suggests solutions. Sorts and classifies objects or ideas based on features.',
        3: 'Gives reasons for choices or actions. Connects new information to previous experiences.',
        4: 'Participates in exploration or simple investigations. Thinks creatively in tasks or storytelling.'
      }
    },
    team_work: {
      title: 'Team Work',
      goal: 'To promote cooperation, communication, and mutual respect.',
      levels: {
        1: 'Works well with others in pairs or groups. Shares materials and takes turns during activities.',
        2: 'Listens and responds respectfully to teammates\' ideas. Helps solve group conflicts in a kind way.',
        3: 'Encourages others and celebrates group success. Follows group roles or responsibilities.',
        4: 'Waits for their turn to speak in discussions. Shows leadership by helping guide peers when needed.'
      }
    },
    academic_knowledge: {
      title: 'Academic Knowledge',
      goal: 'To help children enjoy learning and understand basic school subjects.',
      levels: {
        1: 'Reads and understands simple to longer texts. Writes to share thoughts or tell stories.',
        2: 'Follows instructions during learning activities. Asks questions to learn more.',
        3: 'Shares ideas with teachers and friends. Finishes schoolwork with care.',
        4: 'Enjoys learning new things. Tries their best, even when it\'s hard.'
      }
    }
  };

  useEffect(() => {
    if (scheduleId) {
      fetchStudentsForAssessment();
    }
  }, [scheduleId]);

  const fetchStudentsForAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/schedules/${scheduleId}/assessment`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setSchedule(data.data.schedule);
        // Transform API data to match component structure with assessment object
        const transformedStudents = data.data.students.map(student => ({
          ...student,
          // Keep original fields for backward compatibility
          attendance_status: student.attendance_status || 'present',
          knowledge_score: student.knowledge_score || '',
          participation_score: student.participation_score || '',
          personal_development_level: student.personal_development_level || '',
          critical_thinking_level: student.critical_thinking_level || '',
          team_work_level: student.team_work_level || '',
          academic_knowledge_level: student.academic_knowledge_level || '',
          assessment_notes: student.assessment_notes || '',
          // Also create assessment object for consistency
          assessment: {
            attendance_status: student.attendance_status || 'present',
            knowledge_score: student.knowledge_score || '',
            participation_score: student.participation_score || '',
            personal_development_level: student.personal_development_level || '',
            critical_thinking_level: student.critical_thinking_level || '',
            team_work_level: student.team_work_level || '',
            academic_knowledge_level: student.academic_knowledge_level || '',
            notes: student.assessment_notes || ''
          }
        }));
        
        setStudents(transformedStudents);
      } else {
        console.error('API Error:', data.error);
        setError(data.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(`Failed to fetch students for assessment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId, field, value) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const updatedStudent = { ...student, [field]: value };
        
        // Sync with assessment object if it exists
        if (student.assessment) {
          updatedStudent.assessment = {
            ...student.assessment,
            [field]: value
          };
          
          // Map field names for assessment object
          if (field === 'assessment_notes') {
            updatedStudent.assessment.notes = value;
          }
        }
        
        return updatedStudent;
      }
      return student;
    }));
  };

  const handleSaveAssessments = async () => {
    try {
      setSaving(true);
      
      // Add minimum delay to ensure loading indicator is visible
      const startTime = Date.now();
      
      const assessments = students.map(student => ({
        student_id: student.id,
        attendance_status: student.attendance_status,
        knowledge_score: student.knowledge_score ? parseInt(student.knowledge_score) : null,
        participation_score: student.participation_score ? parseInt(student.participation_score) : null,
        personal_development_level: student.personal_development_level ? parseInt(student.personal_development_level) : null,
        critical_thinking_level: student.critical_thinking_level ? parseInt(student.critical_thinking_level) : null,
        team_work_level: student.team_work_level ? parseInt(student.team_work_level) : null,
        academic_knowledge_level: student.academic_knowledge_level ? parseInt(student.academic_knowledge_level) : null,
        notes: student.assessment_notes
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
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      if (data.success) {
        setSuccess('Student assessments saved successfully!');
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      } else {
        setError(data.error);
        console.error('Failed to save assessments:', data.error);
      }
    } catch (error) {
      console.error('Error saving assessments:', error);
      setError('Failed to save assessments');
    } finally {
      setSaving(false);
    }
  };



  const formatTime = (timeString) => {
    return timeString ? timeString.slice(0, 5) : '';
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <span className="ml-4 text-lg">Loading assessment...</span>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="4xl">
      <div className="max-h-[80vh] overflow-y-auto">
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Assessment</h2>
          {schedule && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Schedule:</strong> {formatDateTimeIndonesian(schedule.scheduled_date, schedule.scheduled_time)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>School:</strong> {schedule.school_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Duration:</strong> {schedule.duration_minutes} minutes
              </p>
            </div>
          )}
        </div>

        {/* Assessment Categories Legend */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Assessment Categories</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {Object.entries(assessmentCategories).map(([key, category]) => (
              <div key={key} className="bg-white p-3 rounded border">
                <h4 className="font-semibold text-blue-700 mb-1">{category.title}</h4>
                <p className="text-gray-600 text-xs mb-2">{category.goal}</p>
                <div className="space-y-1">
                  {Object.entries(category.levels).map(([level, description]) => (
                    <div key={level} className="text-xs">
                      <span className="font-medium">Level {level}:</span> {description}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Assessment Form */}
        <div className="space-y-6">
          {students.map((student) => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{conditionallyMaskStudentName(student.name, user, { preserveFirstName: true })}</h3>
                  <p className="text-sm text-gray-600">Grade: {student.grade} | Age: {student.age || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
                  <select
                    value={student.attendance_status}
                    onChange={(e) => handleStudentChange(student.id, 'attendance_status', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>

              {student.attendance_status !== 'absent' && (
                <>
                  {/* Traditional Scores */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Knowledge Score (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={student.knowledge_score}
                        onChange={(e) => handleStudentChange(student.id, 'knowledge_score', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Enter score"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Participation Score (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={student.participation_score}
                        onChange={(e) => handleStudentChange(student.id, 'participation_score', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Enter score"
                      />
                    </div>
                  </div>

                  {/* Assessment Categories */}
                  <div className="space-y-4 mb-4">
                    {Object.entries(assessmentCategories).map(([key, category]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {category.title}
                        </label>
                        <p className="text-xs text-gray-600 mb-3 italic">
                          {category.goal}
                        </p>
                        <MultilineSelect
                          value={student[`${key}_level`] || ''}
                          onChange={(value) => handleStudentChange(student.id, `${key}_level`, value)}
                          options={Object.entries(category.levels).map(([level, description]) => ({
                            value: level,
                            description: description
                          }))}
                          placeholder="Select Level"
                          className="w-full"
                        />
                        
                        {/* Show selected level description */}
                        {student[`${key}_level`] && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <strong>Level {student[`${key}_level`]}:</strong>{' '}
                            {category.levels[student[`${key}_level`]]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment Notes
                    </label>
                    <textarea
                      value={student.assessment_notes}
                      onChange={(e) => handleStudentChange(student.id, 'assessment_notes', e.target.value)}
                      rows="2"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Additional notes about student's performance..."
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAssessments}
            disabled={saving}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving Assessments...' : 'Save Assessments'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentAssessmentModal;
