import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

const TeacherManagement = ({ selectedSchoolId }) => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    phone: '',
    email: '',
    hire_date: '',
    school_ids: []
  });

  useEffect(() => {
    fetchTeachers();
    fetchSchools();
  }, [selectedSchoolId]);

  const fetchTeachers = async () => {
    try {
      const teacherList = await window.electronAPI.getTeachers(selectedSchoolId);
      setTeachers(teacherList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolList = await window.electronAPI.getSchools();
      setSchools(schoolList);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one school is selected
    if (formData.school_ids.length === 0) {
      alert('Please select at least one school');
      return;
    }
    
    try {
      if (editingTeacher) {
        await window.electronAPI.updateTeacher(editingTeacher.id, formData);
      } else {
        await window.electronAPI.addTeacher(formData);
      }
      setIsModalOpen(false);
      setEditingTeacher(null);
      setFormData({
        name: '',
        subject: '',
        phone: '',
        email: '',
        hire_date: '',
        school_ids: []
      });
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    // Convert school_ids string to array of integers
    let schoolIds = [];
    if (teacher.school_ids && typeof teacher.school_ids === 'string') {
      schoolIds = teacher.school_ids.split(',').map(id => parseInt(id.trim()));
    } else if (Array.isArray(teacher.school_ids)) {
      schoolIds = teacher.school_ids.map(id => parseInt(id));
    }
    
    setFormData({
      name: teacher.name,
      subject: teacher.subject || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      hire_date: teacher.hire_date || '',
      school_ids: schoolIds
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await window.electronAPI.deleteTeacher(id);
        fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      subject: '',
      phone: '',
      email: '',
      hire_date: '',
      school_ids: selectedSchoolId ? [parseInt(selectedSchoolId)] : []
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSchoolChange = (schoolId) => {
    // Ensure both schoolId and formData.school_ids are integers
    const id = parseInt(schoolId);
    const currentIds = formData.school_ids.map(existingId => parseInt(existingId));
    
    const updatedSchoolIds = currentIds.includes(id)
      ? currentIds.filter(existingId => existingId !== id)
      : [...currentIds, id];
    
    setFormData({ ...formData, school_ids: updatedSchoolIds });
  };

  const getSchoolName = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'Unknown School';
  };

  const getSchoolNames = (schoolIdsString) => {
    if (!schoolIdsString) return 'No Schools';
    const schoolIds = schoolIdsString.split(',').map(id => parseInt(id.trim()));
    const names = schoolIds.map(id => {
      const school = schools.find(s => s.id === id);
      return school ? school.name : 'Unknown';
    });
    return names.join(', ');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          BB Society - Teachers {selectedSchoolId && `- ${getSchoolName(selectedSchoolId)}`}
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add New Teacher
        </button>
      </div>

      {!selectedSchoolId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            💡 Select a school from the Schools page to filter teachers, or view all teachers below.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schools
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hire Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <button
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {teacher.name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getSchoolNames(teacher.school_ids)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teacher.subject || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teacher.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teacher.email || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                    className="text-green-600 hover:text-green-900 mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schools</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {schools.map((school) => (
                <label key={school.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.school_ids.map(id => parseInt(id)).includes(parseInt(school.id))}
                    onChange={() => handleSchoolChange(school.id)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{school.name}</span>
                </label>
              ))}
            </div>
            {formData.school_ids.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Please select at least one school</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hire Date</label>
            <input
              type="date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              {editingTeacher ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherManagement;
