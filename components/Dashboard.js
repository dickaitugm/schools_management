'use client';

import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    students: 0,
    lessons: 0,
    schedules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch schools count
      const schoolsResponse = await fetch('/api/schools');
      const schools = schoolsResponse.ok ? await schoolsResponse.json() : [];
      
      // TODO: Add other API calls when they're ready
      setStats({
        schools: schools.length,
        teachers: 0, // Will be updated when teachers API is ready
        students: 0, // Will be updated when students API is ready
        lessons: 0,  // Will be updated when lessons API is ready
        schedules: 0, // Will be updated when schedules API is ready
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">BB Society Dashboard</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-3">
              <span className="text-xl">🏫</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Schools</p>
              <p className="text-xl font-bold text-gray-900">{stats.schools}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-3">
              <span className="text-xl">👨‍🏫</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Teachers</p>
              <p className="text-xl font-bold text-gray-900">{stats.teachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-3">
              <span className="text-xl">👨‍🎓</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Students</p>
              <p className="text-xl font-bold text-gray-900">{stats.students}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-3">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Lessons</p>
              <p className="text-xl font-bold text-gray-900">{stats.lessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-3">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Schedules</p>
              <p className="text-xl font-bold text-gray-900">{stats.schedules}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to BB Society Information System</h2>
        <p className="text-gray-600 mb-4">
          Manage your schools, teachers, students, lessons, and schedules all in one place.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-2">🏫 Schools</h3>
            <p className="text-sm text-gray-600">Add and manage school information, contact details, and locations.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-2">👨‍🏫 Teachers</h3>
            <p className="text-sm text-gray-600">Manage teacher profiles and assign them to multiple schools.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-2">👨‍🎓 Students</h3>
            <p className="text-sm text-gray-600">Track student enrollment and manage their information.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-2">📚 Lessons</h3>
            <p className="text-sm text-gray-600">Create lesson content that can be taught at multiple schools.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-2">📅 Schedules</h3>
            <p className="text-sm text-gray-600">Plan and track when lessons are taught at different schools.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Analytics</h3>
            <p className="text-sm text-gray-600">Monitor attendance and performance across all schools.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
