import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, [id]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher details
      const allTeachers = await window.electronAPI.getTeachers();
      const teacherData = allTeachers.find(t => t.id === parseInt(id));
      setTeacher(teacherData);

      if (teacherData) {
        // Parse associated schools from the teacher data
        const schoolIds = teacherData.school_ids ? teacherData.school_ids.split(',').map(id => parseInt(id)) : [];
        const allSchools = await window.electronAPI.getSchools();
        const teacherSchools = allSchools.filter(school => schoolIds.includes(school.id));
        setSchools(teacherSchools);

        // Fetch students from associated schools
        const allStudentsPromises = schoolIds.map(schoolId => window.electronAPI.getStudents(schoolId));
        const allStudentsResults = await Promise.all(allStudentsPromises);
        const allStudents = allStudentsResults.flat().filter((student, index, self) => 
          index === self.findIndex(s => s.id === student.id)
        );
        setStudents(allStudents);

        // Fetch schedules for this teacher
        const scheduleData = await window.electronAPI.getSchedules({ teacher_id: parseInt(id) });
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
        const teacherLessons = allLessons.filter(lesson => lessonIds.has(lesson.id));
        setLessons(teacherLessons);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
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

  if (!teacher) {
    return (
      <div className="p-6">
        <div className="text-red-500">Teacher not found</div>
        <button 
          onClick={() => navigate('/teachers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Teachers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/teachers')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Teachers
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Teacher Profile</h1>
      </div>

      {/* Teacher Details Card - Simplified */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <span className="text-xl">👨‍🏫</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{teacher.name}</h2>
              <p className="text-sm text-gray-600">{teacher.subject || 'Subject not specified'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{teacher.phone || 'No phone'}</p>
            <p className="text-xs text-gray-500">{teacher.email || 'No email'}</p>
            <p className="text-xs text-gray-400">
              {schools.length > 0 ? (
                schools.map((school, index) => (
                  <span key={school.id}>
                    <button
                      onClick={() => navigate(`/schools/${school.id}`)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {school.name}
                    </button>
                    {index < schools.length - 1 && ', '}
                  </span>
                ))
              ) : 'No schools assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <span className="text-2xl">🏫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Schools</p>
              <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
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
              <p className="text-sm font-medium text-gray-600">Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schools Information */}
      {schools.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-xl mr-2">🏫</span>
            Associated Schools ({schools.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schools.map((school) => (
              <div key={school.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => navigate(`/schools/${school.id}`)}>
                <h4 className="font-semibold text-gray-900">{school.name}</h4>
                <p className="text-sm text-gray-600">{school.address || 'No address'}</p>
                <p className="text-sm text-gray-500">{school.phone || 'No phone'}</p>
                <p className="text-sm text-gray-500">{school.email || 'No email'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">📚</span>
            Lessons Taught ({lessons.length})
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
              <p>No lessons assigned to this teacher yet.</p>
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

      {/* Students in Associated Schools */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👨‍🎓</span>
            Students in Associated Schools ({students.length})
          </h3>
        </div>
        <div className="p-6">
          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.slice(0, 6).map((student) => (
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
              <p>No students found in associated schools.</p>
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
                          <strong>School:</strong> {schedule.school_name || 'Not assigned'}
                        </div>
                        <div>
                          <strong>Date:</strong> {new Date(schedule.scheduled_date).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Time:</strong> {schedule.scheduled_time} ({schedule.duration_minutes} min)
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
              <p>No schedules found for this teacher yet.</p>
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

export default TeacherProfile;
