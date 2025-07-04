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
      
      // Fetch all data concurrently
      const [schoolsResponse, teachersResponse, studentsResponse, lessonsResponse, schedulesResponse] = await Promise.all([
        fetch('/api/schools'),
        fetch('/api/teachers'),
        fetch('/api/students'),
        fetch('/api/lessons'),
        fetch('/api/schedules?limit=1000') // Get all schedules for count
      ]);

      const schools = schoolsResponse.ok ? await schoolsResponse.json() : [];
      const teachers = teachersResponse.ok ? await teachersResponse.json() : [];
      const students = studentsResponse.ok ? await studentsResponse.json() : [];
      const lessons = lessonsResponse.ok ? await lessonsResponse.json() : [];
      const schedulesData = schedulesResponse.ok ? await schedulesResponse.json() : { data: [] };
      
      setStats({
        schools: Array.isArray(schools) ? schools.length : 0,
        teachers: Array.isArray(teachers) ? teachers.length : 0,
        students: Array.isArray(students) ? students.length : 0,
        lessons: Array.isArray(lessons) ? lessons.length : 0,
        schedules: schedulesData.data ? schedulesData.data.length : 0,
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
        <h1 className="text-3xl font-bold text-gray-800">BB for Society Dashboard</h1>
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to BB for Society Information System</h2>
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
