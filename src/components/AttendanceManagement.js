import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from './Modal';

const AttendanceManagement = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    attendance_status: 'present',
    knowledge_score: '',
    participation_score: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [scheduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch schedule details
      const schedules = await window.electronAPI.getSchedules({ schedule_id: parseInt(scheduleId) });
      if (schedules.length > 0) {
        setSchedule(schedules[0]);
      }

      // Fetch students for this schedule
      const studentsData = await window.electronAPI.getStudentsForSchedule(parseInt(scheduleId));
      setStudents(studentsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setFormData({
      attendance_status: student.attendance_status || 'present',
      knowledge_score: student.knowledge_score || '',
      participation_score: student.participation_score || '',
      notes: student.attendance_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setSaving(true);
      
      const attendanceData = {
        schedule_id: parseInt(scheduleId),
        student_id: selectedStudent.id,
        attendance_status: formData.attendance_status,
        knowledge_score: formData.knowledge_score ? parseInt(formData.knowledge_score) : null,
        participation_score: formData.participation_score ? parseInt(formData.participation_score) : null,
        notes: formData.notes
      };

      if (selectedStudent.attendance_id) {
        // Update existing attendance
        await window.electronAPI.updateStudentAttendance(selectedStudent.attendance_id, attendanceData);
      } else {
        // Add new attendance
        await window.electronAPI.addStudentAttendance(attendanceData);
      }

      setIsModalOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTeacherNames = (teacherNames) => {
    if (!teacherNames) return 'Not assigned';
    
    // Jika sudah berupa array, join dengan koma
    if (Array.isArray(teacherNames)) {
      return teacherNames.join(', ');
    }
    
    if (typeof teacherNames !== 'string') {
      return teacherNames;
    }
    
    // Coba split dengan koma dulu
    if (teacherNames.includes(',')) {
      return teacherNames.split(',').map(name => name.trim()).join(', ');
    }
    
    // Jika tidak ada koma, coba split berdasarkan huruf kapital
    const splitByCapital = teacherNames.split(/(?=[A-Z])/).filter(name => name.trim());
    if (splitByCapital.length > 1) {
      return splitByCapital.join(', ');
    }
    
    // Jika tidak bisa split, return as is
    return teacherNames;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-6">
        <div className="text-red-500">Schedule not found</div>
        <button 
          onClick={() => navigate('/schedules')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Schedules
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/schedules')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Schedules
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
      </div>

      {/* Schedule Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {schedule.lesson_titles || 'No lesson assigned'}
            </h2>
            <p className="text-gray-600">{schedule.school_name}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <p className="mt-1 text-gray-900">
              {new Date(schedule.scheduled_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <p className="mt-1 text-gray-900">{schedule.scheduled_time}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration</label>
            <p className="mt-1 text-gray-900">{schedule.duration_minutes} minutes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teachers</label>
            <p className="mt-1 text-gray-900">
              {formatTeacherNames(schedule.teacher_names)}
            </p>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👨‍🎓</span>
            Students ({students.length})
          </h3>
        </div>
        <div className="p-6">
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Knowledge Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participation Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                            <span className="text-sm">👤</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.grade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.attendance_status ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(student.attendance_status)}`}>
                            {student.attendance_status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(student.knowledge_score)}`}>
                          {student.knowledge_score || '-'}
                        </span>
                        {student.knowledge_score && <span className="text-gray-400">/100</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(student.participation_score)}`}>
                          {student.participation_score || '-'}
                        </span>
                        {student.participation_score && <span className="text-gray-400">/100</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleStudentClick(student)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {student.attendance_id ? 'Edit' : 'Mark'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No students found for this schedule.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Mark Attendance - ${selectedStudent?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Attendance Status</label>
            <select
              name="attendance_status"
              value={formData.attendance_status}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Knowledge Score (0-100)</label>
              <input
                type="number"
                name="knowledge_score"
                value={formData.knowledge_score}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter score"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Participation Score (0-100)</label>
              <input
                type="number"
                name="participation_score"
                value={formData.participation_score}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter score"
              />
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
              placeholder="Additional notes about the student's performance"
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
              disabled={saving}
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;
