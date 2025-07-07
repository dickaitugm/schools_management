'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import SchoolManagement from './SchoolManagement';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import LessonManagement from './LessonManagement';
import ScheduleManagement from './ScheduleManagement';
import RoleManagement from './RoleManagement';
import ProfileView from './ProfileView';
import StudentAssessmentView from './StudentAssessmentView';
import Sidebar from './Sidebar';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [currentView, setCurrentView] = useState({
    type: 'main', // 'main', 'profile', 'assessment'
    data: null
  });
  const { user, loading, login } = useAuth();

  console.log('App state - user:', user, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  const handleViewProfile = (entityType, id) => {
    setCurrentView({
      type: 'profile',
      data: { entityType, id }
    });
  };

  const handleViewAssessment = (scheduleId) => {
    setCurrentView({
      type: 'assessment', 
      data: { scheduleId }
    });
  };

  const handleBackToMain = () => {
    setCurrentView({
      type: 'main',
      data: null
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Reset view to main when changing pages
    setCurrentView({
      type: 'main',
      data: null
    });
  };

  const renderMainPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'schools':
        return (
          <SchoolManagement 
            onSchoolSelect={setSelectedSchoolId}
            selectedSchoolId={selectedSchoolId}
            onViewProfile={handleViewProfile}
          />
        );
      case 'teachers':
        return (
          <TeacherManagement 
            selectedSchoolId={selectedSchoolId}
            onViewProfile={handleViewProfile}
          />
        );
      case 'students':
        return (
          <StudentManagement 
            selectedSchoolId={selectedSchoolId}
            onViewProfile={handleViewProfile}
          />
        );
      case 'lessons':
        return (
          <LessonManagement 
            onViewProfile={handleViewProfile}
          />
        );
      case 'schedules':
        return (
          <ScheduleManagement 
            selectedSchoolId={selectedSchoolId}
            onViewProfile={handleViewProfile}
            onViewAssessment={handleViewAssessment}
          />
        );
      case 'roles':
        return <RoleManagement />;
      default:
        return <Dashboard />;
    }
  };

  const renderPage = () => {
    switch (currentView.type) {
      case 'profile':
        return (
          <ProfileView 
            entityType={currentView.data.entityType}
            id={currentView.data.id}
            onBack={handleBackToMain}
          />
        );
      case 'assessment':
        return (
          <StudentAssessmentView 
            scheduleId={currentView.data.scheduleId}
            onBack={handleBackToMain}
          />
        );
      default:
        return renderMainPage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        collapsed={sidebarCollapsed}
        onToggle={setSidebarCollapsed}
      />
      <div className="flex-1 overflow-auto relative min-w-0 md:static">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden fixed top-4 left-4 z-20 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Main Content */}
        <div className="md:p-0 pt-16 md:pt-0 w-full">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
