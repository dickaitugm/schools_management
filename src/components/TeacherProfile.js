import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
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
        // Fetch related school
        const allSchools = await window.electronAPI.getSchools();
        const schoolData = allSchools.find(s => s.id === teacherData.school_id);
        setSchool(schoolData);

        // Fetch students from the same school
        const studentData = await window.electronAPI.getStudents(teacherData.school_id);
        setStudents(studentData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setLoading(false);
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

      {/* Teacher Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <span className="text-2xl">👨‍🏫</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{teacher.name}</h2>
            <p className="text-gray-600">{teacher.subject || 'Subject not specified'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">School</label>
            <p className="mt-1 text-gray-900">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <p className="mt-1 text-gray-900">{teacher.subject || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-gray-900">{teacher.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{teacher.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hire Date</label>
            <p className="mt-1 text-gray-900">
              {teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <p className="mt-1 text-gray-900">
              {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : 'N/A'}
            </p>
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

      {/* Students in Same School */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-xl mr-2">👨‍🎓</span>
            Students in {school ? school.name : 'School'} ({students.length})
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
              <p>No students found in this school.</p>
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

export default TeacherProfile;
