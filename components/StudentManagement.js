'use client';

import React from 'react';

const StudentManagement = ({ selectedSchoolId }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Students</h1>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Add New Student
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-4">👨‍🎓</span>
          <h3 className="text-lg font-semibold mb-2">Students Management</h3>
          <p className="mb-4">This feature is coming soon!</p>
          <p className="text-sm">
            {selectedSchoolId 
              ? `Currently filtering for School ID: ${selectedSchoolId}` 
              : 'Select a school from the Schools page to filter students'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
