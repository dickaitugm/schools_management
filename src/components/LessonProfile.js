import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LessonProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessonData();
  }, [id]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch lesson details
      const allLessons = await window.electronAPI.getLessons();
      const lessonData = allLessons.find(l => l.id === parseInt(id));
      setLesson(lessonData);

      if (lessonData) {
        // Fetch schedules for this lesson
        const scheduleData = await window.electronAPI.getSchedules({ lesson_id: parseInt(id) });
        setSchedules(scheduleData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
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

  if (!lesson) {
    return (
      <div className="p-6">
        <div className="text-red-500">Lesson not found</div>
        <button 
          onClick={() => navigate('/lessons')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Lessons
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/lessons')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Lessons
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Lesson Profile</h1>
      </div>

      {/* Lesson Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <span className="text-2xl">📚</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
            <p className="text-gray-600">Lesson Details</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1 text-gray-900">{lesson.description || 'No description provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Grade</label>
            <p className="mt-1 text-gray-900">{lesson.target_grade || 'All grades'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration</label>
            <p className="mt-1 text-gray-900">{lesson.duration_minutes} minutes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <p className="mt-1 text-gray-900">
              {lesson.created_at ? new Date(lesson.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        
        {lesson.materials && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Materials Needed</label>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{lesson.materials}</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedules.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedules.filter(s => s.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <span className="text-xl">🏫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Schools</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(schedules.map(s => s.school_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">📅</span>
            Schedule History ({schedules.length})
          </h3>
        </div>
        <div className="p-6">
          {schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules
                .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
                .map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {schedule.school_name}
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
              <p>No schedules found for this lesson yet.</p>
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
    </div>
  );
};

export default LessonProfile;
