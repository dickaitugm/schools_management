import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    students: 0,
    lessons: 0,
    schedules: 0,
    upcomingSchedules: 0
  });
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [topPerformers, setTopPerformers] = useState({ schools: [], teachers: [] });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [schools, teachers, students, lessons, schedules] = await Promise.all([
          window.electronAPI.getSchools(),
          window.electronAPI.getTeachers(),
          window.electronAPI.getStudents(),
          window.electronAPI.getLessons(),
          window.electronAPI.getSchedules()
        ]);
        
        // Count upcoming schedules
        const today = new Date().toISOString().split('T')[0];
        const upcoming = schedules.filter(s => 
          s.scheduled_date >= today && s.status === 'scheduled'
        ).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
        
        setStats({
          schools: schools.length,
          teachers: teachers.length,
          students: students.length,
          lessons: lessons.length,
          schedules: schedules.length,
          upcomingSchedules: upcoming.length
        });
        
        setUpcomingSchedules(upcoming.slice(0, 6)); // Show first 6 upcoming
        
        // Fetch performance data for charts
        await fetchPerformanceData(schedules);
        
        // Generate recent activity
        generateRecentActivity(schedules, schools, teachers, students);
        
        // Generate alerts
        generateAlerts(upcoming, schedules);
        
        // Calculate top performers
        await calculateTopPerformers(schools, teachers);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchPerformanceData = async (schedules) => {
    try {
      const completedSchedules = schedules.filter(s => s.status === 'completed');
      const performancePromises = completedSchedules.slice(0, 10).map(async (schedule) => {
        try {
          const attendanceData = await window.electronAPI.getStudentAttendance(schedule.id);
          if (attendanceData && attendanceData.length > 0) {
            const studentCount = attendanceData.length;
            const knowledgeScores = attendanceData
              .filter(record => record.knowledge_score !== null && record.knowledge_score !== undefined)
              .map(record => record.knowledge_score);
            const participationScores = attendanceData
              .filter(record => record.participation_score !== null && record.participation_score !== undefined)
              .map(record => record.participation_score);
            
            const avgKnowledge = knowledgeScores.length > 0 
              ? knowledgeScores.reduce((sum, score) => sum + score, 0) / knowledgeScores.length
              : 0;
            const avgParticipation = participationScores.length > 0 
              ? participationScores.reduce((sum, score) => sum + score, 0) / participationScores.length
              : 0;
            
            return {
              id: schedule.id,
              name: schedule.lesson_titles ? schedule.lesson_titles.join(', ') : 'Unknown',
              school: schedule.school_name,
              date: schedule.scheduled_date,
              studentCount,
              avgKnowledge: Math.round(avgKnowledge),
              avgParticipation: Math.round(avgParticipation),
              avgOverall: Math.round((avgKnowledge + avgParticipation) / 2)
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching attendance for schedule ${schedule.id}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(performancePromises);
      const validResults = results.filter(result => result !== null);
      setPerformanceData(validResults);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const generateRecentActivity = (schedules, schools, teachers, students) => {
    const activities = [];
    
    // Recent completed schedules
    const recentCompleted = schedules
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
      .slice(0, 3);
    
    recentCompleted.forEach(schedule => {
      activities.push({
        type: 'schedule_completed',
        title: 'Schedule Completed',
        description: `${schedule.lesson_titles ? schedule.lesson_titles.join(', ') : 'Lesson'} at ${schedule.school_name}`,
        time: schedule.scheduled_date,
        icon: '✅',
        color: 'text-green-600'
      });
    });
    
    // Recent upcoming schedules
    const recentUpcoming = schedules
      .filter(s => s.status === 'scheduled' && new Date(s.scheduled_date) >= new Date())
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .slice(0, 2);
    
    recentUpcoming.forEach(schedule => {
      activities.push({
        type: 'schedule_upcoming',
        title: 'Upcoming Schedule',
        description: `${schedule.lesson_titles ? schedule.lesson_titles.join(', ') : 'Lesson'} at ${schedule.school_name}`,
        time: schedule.scheduled_date,
        icon: '📅',
        color: 'text-blue-600'
      });
    });
    
    // Sort by date and take latest 5
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    setRecentActivity(activities.slice(0, 5));
  };

  const generateAlerts = (upcoming, allSchedules) => {
    const alertList = [];
    
    // Upcoming schedules today
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = upcoming.filter(s => s.scheduled_date === today);
    if (todaySchedules.length > 0) {
      alertList.push({
        type: 'info',
        title: 'Today\'s Schedules',
        message: `You have ${todaySchedules.length} schedule${todaySchedules.length > 1 ? 's' : ''} today`,
        icon: '📅',
        color: 'text-blue-600 border-blue-200 bg-blue-50'
      });
    }
    
    // Overdue schedules
    const overdue = allSchedules.filter(s => 
      new Date(s.scheduled_date) < new Date() && s.status === 'scheduled'
    );
    if (overdue.length > 0) {
      alertList.push({
        type: 'warning',
        title: 'Overdue Schedules',
        message: `${overdue.length} schedule${overdue.length > 1 ? 's' : ''} need attention`,
        icon: '⚠️',
        color: 'text-yellow-600 border-yellow-200 bg-yellow-50'
      });
    }
    
    // No upcoming schedules
    if (upcoming.length === 0) {
      alertList.push({
        type: 'info',
        title: 'No Upcoming Schedules',
        message: 'Consider adding new schedules to keep the learning active',
        icon: '📋',
        color: 'text-gray-600 border-gray-200 bg-gray-50'
      });
    }
    
    setAlerts(alertList);
  };

  const calculateTopPerformers = async (schools, teachers) => {
    // For now, just show random top performers
    // In a real app, you'd calculate based on actual performance metrics
    const topSchools = schools
      .sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      .slice(0, 3)
      .map((school, index) => ({
        ...school,
        score: Math.floor(Math.random() * 20) + 80, // Random score 80-100
        rank: index + 1
      }));
    
    const topTeachers = teachers
      .sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      .slice(0, 3)
      .map((teacher, index) => ({
        ...teacher,
        score: Math.floor(Math.random() * 20) + 80, // Random score 80-100
        rank: index + 1
      }));
    
    setTopPerformers({ schools: topSchools, teachers: topTeachers });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const formatTeacherNames = (teacherNames) => {
    if (!teacherNames) return 'No teachers assigned';
    
    if (Array.isArray(teacherNames)) {
      return teacherNames.join(', ');
    }
    
    if (typeof teacherNames !== 'string') {
      return teacherNames;
    }
    
    if (teacherNames.includes(',')) {
      return teacherNames.split(',').map(name => name.trim()).join(', ');
    }
    
    const splitByCapital = teacherNames.split(/(?=[A-Z])/).filter(name => name.trim());
    if (splitByCapital.length > 1) {
      return splitByCapital.join(', ');
    }
    
    return teacherNames;
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
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/schedules')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            + New Schedule
          </button>
          <button
            onClick={() => navigate('/students')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Student
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-3">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Upcoming</p>
              <p className="text-xl font-bold text-gray-900">{stats.upcomingSchedules}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className={`border rounded-lg p-4 ${alert.color}`}>
              <div className="flex items-center">
                <span className="text-2xl mr-3">{alert.icon}</span>
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Upcoming Schedules */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Schedules Cards */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="text-2xl mr-2">📅</span>
                Upcoming Schedules
              </h2>
              <button
                onClick={() => navigate('/schedules')}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            
            {upcomingSchedules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingSchedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate('/schedules')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {schedule.lesson_titles ? schedule.lesson_titles.join(', ') : 'No lessons'}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {schedule.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p className="flex items-center">
                        <span className="mr-1">🏫</span>
                        {schedule.school_name}
                      </p>
                      <p className="flex items-center">
                        <span className="mr-1">📅</span>
                        {formatDate(schedule.scheduled_date)}
                      </p>
                      <p className="flex items-center">
                        <span className="mr-1">⏰</span>
                        {schedule.scheduled_time} ({schedule.duration_minutes} min)
                      </p>
                      <p className="flex items-center">
                        <span className="mr-1">👨‍🏫</span>
                        {formatTeacherNames(schedule.teacher_names)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">📋</span>
                <p>No upcoming schedules</p>
                <button
                  onClick={() => navigate('/schedules')}
                  className="mt-2 text-orange-600 hover:text-orange-800 text-sm"
                >
                  Create your first schedule →
                </button>
              </div>
            )}
          </div>

          {/* Performance Analytics Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span>
              Performance Analytics
            </h2>
            
            {performanceData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                    <span>Student Count</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span>Avg Knowledge</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                    <span>Avg Participation</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {performanceData.map((data, index) => (
                    <div key={data.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{data.name}</h4>
                        <span className="text-xs text-gray-500">{data.school}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        {/* Student Count */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{data.studentCount}</div>
                          <div className="text-gray-500">Students</div>
                        </div>
                        
                        {/* Knowledge Score */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{data.avgKnowledge || 'N/A'}</div>
                          <div className="text-gray-500">Knowledge</div>
                          {data.avgKnowledge && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-green-500 h-1 rounded-full"
                                style={{ width: `${data.avgKnowledge}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Participation Score */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{data.avgParticipation || 'N/A'}</div>
                          <div className="text-gray-500">Participation</div>
                          {data.avgParticipation && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-purple-500 h-1 rounded-full"
                                style={{ width: `${data.avgParticipation}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">📊</span>
                <p>No performance data available</p>
                <p className="text-sm mt-1">Complete some schedules to see analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="space-y-6">
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-xl mr-2">🔔</span>
              Recent Activity
            </h3>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-lg">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400">{getTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <span className="text-2xl block mb-1">📝</span>
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-xl mr-2">🏆</span>
              Top Performers
            </h3>
            
            <div className="space-y-4">
              {/* Top Schools */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Schools</h4>
                <div className="space-y-2">
                  {topPerformers.schools.map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">#{school.rank}</span>
                        <span className="text-sm text-gray-900 truncate">{school.name}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{school.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Teachers */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Teachers</h4>
                <div className="space-y-2">
                  {topPerformers.teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">#{teacher.rank}</span>
                        <span className="text-sm text-gray-900 truncate">{teacher.name}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{teacher.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-xl mr-2">⚡</span>
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => navigate('/schools')}
                className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏫</span>
                  <div>
                    <p className="font-medium text-gray-900">Manage Schools</p>
                    <p className="text-xs text-gray-600">Add or edit school information</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/teachers')}
                className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👨‍🏫</span>
                  <div>
                    <p className="font-medium text-gray-900">Manage Teachers</p>
                    <p className="text-xs text-gray-600">Add or assign teachers</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/lessons')}
                className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-medium text-gray-900">Create Lessons</p>
                    <p className="text-xs text-gray-600">Design learning content</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/attendance')}
                className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-medium text-gray-900">Track Attendance</p>
                    <p className="text-xs text-gray-600">Monitor student progress</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
