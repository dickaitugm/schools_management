'use client';

import React from 'react';

const LessonManagement = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Lessons</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Add New Lesson
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-4">📚</span>
          <h3 className="text-lg font-semibold mb-2">Lesson Management</h3>
          <p className="mb-4">This feature is coming soon!</p>
          <p className="text-sm">Create and manage lesson content that can be taught at multiple schools.</p>
        </div>
      </div>
    </div>
  );
};

export default LessonManagement;
