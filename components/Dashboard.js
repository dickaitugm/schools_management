'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    students: 0,
    lessons: 0,
    schedules: 0,
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive dashboard data
      const response = await fetch('/api/dashboard');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats({
            schools: result.data.schools,
            teachers: result.data.teachers,
            students: result.data.students,
            lessons: result.data.lessons,
            schedules: result.data.schedules,
          });
          setDashboardData(result.data);
        } else {
          console.error('Failed to fetch dashboard data:', result.error);
          // Fallback to stats endpoint
          await fetchStatsOnly();
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to stats endpoint
      await fetchStatsOnly();
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsOnly = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        schools: 0,
        teachers: 0,
        students: 0,
        lessons: 0,
        schedules: 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-500 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  // Prepare chart data
  const studentsPerSchoolData = dashboardData?.studentsPerSchool || [];
  
  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  // Prepare stacked bar chart data for schedules
  const prepareScheduleStackedData = (scheduleData) => {
    if (!scheduleData || scheduleData.length === 0) return [];
    
    // Group schedules by date and aggregate students by school
    const dateGroups = {};
    
    scheduleData.forEach(schedule => {
      const date = new Date(schedule.scheduled_date).toLocaleDateString('en-GB');
      const schoolName = schedule.school_name;
      const studentCount = parseInt(schedule.student_count) || 0;
      
      if (!dateGroups[date]) {
        dateGroups[date] = {
          date,
          totalStudents: 0,
          schools: {}
        };
      }
      
      // Accumulate students for each school on this date
      if (!dateGroups[date].schools[schoolName]) {
        dateGroups[date].schools[schoolName] = 0;
      }
      dateGroups[date].schools[schoolName] += studentCount;
      dateGroups[date].totalStudents += studentCount;
    });
    
    // Convert to chart format
    return Object.values(dateGroups)
      .sort((a, b) => new Date(a.date.split('/').reverse().join('/')) - new Date(b.date.split('/').reverse().join('/')))
      .map(group => ({
        date: group.date,
        totalStudents: group.totalStudents,
        ...group.schools
      }));
  };
  
  const scheduleStackedData = prepareScheduleStackedData(dashboardData?.scheduleData);
  
  // Get unique school names for the stacked bars
  const uniqueSchools = [...new Set(dashboardData?.scheduleData?.map(s => s.school_name) || [])];
  
  // School colors mapping
  const schoolColors = {
    'SD Harapan Bangsa': '#3B82F6',      // Blue
    'SMP Tunas Muda': '#10B981',         // Green
    'SMA Cerdas Berkarya': '#F59E0B',    // Yellow/Orange
    'Rusunawa Cibuluh': '#EF4444',       // Red
  };
  
  // Get color for school, with fallback
  const getSchoolColor = (schoolName, index) => {
    return schoolColors[schoolName] || COLORS[index % COLORS.length];
  };

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

      {/* Analytics Cards */}
      {dashboardData?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Schedules</p>
                <p className="text-lg font-bold text-green-600">{dashboardData.analytics.totalActiveSchedules}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <span className="text-green-600">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed Schedules</p>
                <p className="text-lg font-bold text-blue-600">{dashboardData.analytics.totalCompletedSchedules}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <span className="text-blue-600">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Students in Schedules</p>
                <p className="text-lg font-bold text-purple-600">{dashboardData.analytics.totalStudentsInSchedules}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <span className="text-purple-600">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Avg Students/Schedule</p>
                <p className="text-lg font-bold text-orange-600">{dashboardData.analytics.averageStudentsPerSchedule}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <span className="text-orange-600">📊</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students per School Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Students per School</h3>
            {studentsPerSchoolData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentsPerSchoolData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="school_name" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Students']} />
                  <Bar dataKey="student_count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No school data available
              </div>
            )}
          </div>

          {/* Stacked Bar Chart - Students per Schedule by School */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Students per Schedule by School</h3>
            <p className="text-sm text-gray-600 mb-4">Shows student attendance distribution across schools by schedule dates</p>
            {scheduleStackedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scheduleStackedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, `${name} Students`]}
                    labelFormatter={(label) => `Schedule Date: ${label}`}
                    contentStyle={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="rect"
                  />
                  {uniqueSchools.map((school, index) => (
                    <Bar 
                      key={school}
                      dataKey={school}
                      stackId="students"
                      fill={getSchoolColor(school, index)}
                      name={school}
                      radius={index === uniqueSchools.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-2">No schedule data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Schedules Table */}
      {dashboardData?.scheduleData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Schedules</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total School Students</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.scheduleData.slice(0, 5).map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {schedule.school_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(schedule.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        schedule.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : schedule.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.student_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.total_school_students}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
