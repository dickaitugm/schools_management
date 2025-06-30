import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SchoolProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchoolData();
  }, [id]);

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      
      // Fetch school details
      const allSchools = await window.electronAPI.getSchools();
      const schoolData = allSchools.find(s => s.id === parseInt(id));
      setSchool(schoolData);

      // Fetch related teachers
      const teacherData = await window.electronAPI.getTeachers(parseInt(id));
      setTeachers(teacherData);

      // Fetch related students
      const studentData = await window.electronAPI.getStudents(parseInt(id));
      setStudents(studentData);

      // Fetch schedules for this school
      const scheduleData = await window.electronAPI.getSchedules({ school_id: parseInt(id) });
      setSchedules(scheduleData);

      // Get unique lessons from schedules
      const allLessons = await window.electronAPI.getLessons();
      const lessonIds = new Set();
      scheduleData.forEach(schedule => {
        if (schedule.lesson_ids) {
          schedule.lesson_ids.split(',').forEach(id => lessonIds.add(parseInt(id)));
        }
      });
      const schoolLessons = allLessons.filter(lesson => lessonIds.has(lesson.id));
      setLessons(schoolLessons);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching school data:', error);
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-6">
        <div className="text-red-500">School not found</div>
        <button 
          onClick={() => navigate('/schools')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Schools
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/schools')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Schools
        </button>
        <h1 className="text-3xl font-bold text-gray-800">School Profile</h1>
      </div>

      {/* School Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <span className="text-2xl">🏫</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{school.name}</h2>
            <p className="text-gray-600">School Information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <p className="mt-1 text-gray-900">
              {school.created_at ? new Date(school.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
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
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Lessons Taught</p>
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
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👨‍🏫</span>
            Teachers ({teachers.length})
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
              <p>No teachers assigned to this school yet.</p>
              <button 
                onClick={() => navigate('/teachers')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add Teachers →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👨‍🎓</span>
            Students ({students.length})
          </h3>
        </div>
        <div className="p-6">
          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div 
                  key={student.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <h4 className="font-semibold text-gray-900">{student.name}</h4>
                  <p className="text-sm text-gray-600">{student.grade || 'Grade not specified'}</p>
                  <p className="text-sm text-gray-500">Age: {student.age || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{student.email || 'No email'}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {student.enrollment_date ? `Enrolled: ${new Date(student.enrollment_date).toLocaleDateString()}` : 'Enrollment date not set'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No students enrolled in this school yet.</p>
              <button 
                onClick={() => navigate('/students')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add Students →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lessons Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">📚</span>
            Lessons ({lessons.length})
          </h3>
        </div>
        <div className="p-6">
          {lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                >
                  <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                  <p className="text-sm text-gray-600">{lesson.target_grade || 'All grades'}</p>
                  <p className="text-sm text-gray-500">{lesson.duration_minutes} minutes</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {lesson.description ? lesson.description.substring(0, 60) + '...' : 'No description'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No lessons scheduled for this school yet.</p>
              <button 
                onClick={() => navigate('/lessons')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                View All Lessons →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Schedules */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="text-xl mr-2">📅</span>
              Recent Schedules ({schedules.length})
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
                .slice(0, 5)
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
                          <strong>Teachers:</strong> {schedule.teacher_names || 'Not assigned'}
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
              <p>No schedules found for this school yet.</p>
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

export default SchoolProfile;
