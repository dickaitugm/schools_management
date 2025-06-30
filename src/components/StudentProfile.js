import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classmates, setClassmates] = useState([]);
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
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
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

      {/* Student Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <span className="text-2xl">👨‍🎓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-gray-600">{student.grade || 'Grade not specified'}</p>
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
            <label className="block text-sm font-medium text-gray-700">Grade</label>
            <p className="mt-1 text-gray-900">{student.grade || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <p className="mt-1 text-gray-900">{student.age || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-gray-900">{student.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{student.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
            <p className="mt-1 text-gray-900">
              {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <p className="mt-1 text-gray-900">
              {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
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
