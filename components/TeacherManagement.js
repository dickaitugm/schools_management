'use client';

import React from 'react';

const TeacherManagement = ({ selectedSchoolId }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Teachers</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          Add New Teacher
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-4">👨‍🏫</span>
          <h3 className="text-lg font-semibold mb-2">Teachers Management</h3>
          <p className="mb-4">This feature is coming soon!</p>
          <p className="text-sm">
            {selectedSchoolId 
              ? `Currently filtering for School ID: ${selectedSchoolId}` 
              : 'Select a school from the Schools page to filter teachers'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;
