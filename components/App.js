'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import ActivityLogs from './ActivityLogs';
import Dashboard from './Dashboard';
import SchoolManagement from './SchoolManagement';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import LessonManagement from './LessonManagement';
import ScheduleManagement from './ScheduleManagement';
import CashFlowManagement from './CashFlowManagement';
import RoleManagement from './RoleManagement';
import ProfileView from './ProfileView';
import StudentAssessmentView from './StudentAssessmentView';
import Sidebar from './Sidebar';
import Footer from './Footer';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [currentView, setCurrentView] = useState({
    type: 'main', // 'main', 'profile', 'assessment', 'login'
    data: null
  });
  const { user, loading, isGuest, logActivity } = useAuth();

  console.log('App state - user:', user, 'loading:', loading, 'isGuest:', isGuest);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleViewProfile = (entityType, id) => {
    setCurrentView({
      type: 'profile',
      data: { entityType, id }
    });
    logActivity('view', `Viewed profile: ${entityType} ID ${id}`);
  };

  const handleViewAssessment = (scheduleId) => {
    setCurrentView({
      type: 'assessment', 
      data: { scheduleId }
    });
    logActivity('view', `Viewed assessment for schedule ID ${scheduleId}`);
  };

  const handleBackToMain = () => {
    setCurrentView({
      type: 'main',
      data: null
    });
  };

  const handlePageChange = (page) => {
    if (page === 'login') {
      setCurrentView({
        type: 'login',
        data: null
      });
      return;
    }
    
    setCurrentPage(page);
    logActivity('page_access', `Navigated to ${page} page`);
    // Reset view to main when changing pages
    setCurrentView({
      type: 'main',
      data: null
    });
  };

  const handleLoginCancel = () => {
    setCurrentView({
      type: 'main',
      data: null
    });
    setCurrentPage('dashboard');
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
      case 'cash-flow':
        return <CashFlowManagement />;
      case 'user-roles':
        return <RoleManagement />;
      case 'activity-logs':
        return <ActivityLogs />;
      default:
        return <Dashboard />;
    }
  };

  const renderPage = () => {
    switch (currentView.type) {
      case 'login':
        return <Login onLogin={(userData) => {
          handleLoginCancel();
          // Refresh halaman setelah login berhasil
          window.location.reload();
        }} />;
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
      <div className="flex-1 overflow-auto relative min-w-0 md:static flex flex-col">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden fixed top-4 left-4 z-20 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Guest Banner */}
        {isGuest && currentView.type !== 'login' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 md:mx-0 mx-4 mt-4 md:mt-0">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Guest Mode:</strong> You can view all content, but editing features are disabled. 
                  <button 
                    onClick={() => handlePageChange('login')}
                    className="font-medium underline hover:text-yellow-800 ml-1"
                  >
                    Login here
                  </button> to access full features.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="md:p-0 pt-16 md:pt-0 w-full flex-1 flex flex-col">
          <div className="flex-1">
            {renderPage()}
          </div>
          <Footer />
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
