import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    students: 0,
    lessons: 0,
    schedules: 0,
    upcomingSchedules: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const schools = await window.electronAPI.getSchools();
        const teachers = await window.electronAPI.getTeachers();
        const students = await window.electronAPI.getStudents();
        const lessons = await window.electronAPI.getLessons();
        const schedules = await window.electronAPI.getSchedules();
        
        // Count upcoming schedules
        const today = new Date().toISOString().split('T')[0];
        const upcomingSchedules = schedules.filter(s => 
          s.scheduled_date >= today && s.status === 'scheduled'
        );
        
        setStats({
          schools: schools.length,
          teachers: teachers.length,
          students: students.length,
          lessons: lessons.length,
          schedules: schedules.length,
          upcomingSchedules: upcomingSchedules.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <span className="text-2xl">🏫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schools</p>
              <p className="text-2xl font-bold text-gray-900">{stats.schools}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.teachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.schedules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingSchedules}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to School Management System</h2>
        <p className="text-gray-600 mb-4">
          This application helps you manage schools, teachers, and students efficiently. 
          Use the sidebar navigation to access different sections:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li><strong>Schools:</strong> Add, edit, and manage school information</li>
          <li><strong>Teachers:</strong> Manage teacher profiles and assignments</li>
          <li><strong>Students:</strong> Handle student records and enrollment</li>
          <li><strong>Lessons:</strong> Create and manage lesson content and materials</li>
          <li><strong>Schedules:</strong> Plan and track lesson schedules at different schools</li>
          <li><strong>Calendar:</strong> View all scheduled visits in calendar format</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
