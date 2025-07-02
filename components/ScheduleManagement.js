'use client';

import React from 'react';

const ScheduleManagement = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">BB Society - Schedules</h1>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
          Add New Schedule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-4">📅</span>
          <h3 className="text-lg font-semibold mb-2">Schedule Management</h3>
          <p className="mb-4">This feature is coming soon!</p>
          <p className="text-sm">Plan and track when lessons are taught at different schools.</p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;
