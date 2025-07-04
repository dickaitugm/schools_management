'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import SchoolManagement from '../components/SchoolManagement';
import TeacherManagement from '../components/TeacherManagement';
import StudentManagement from '../components/StudentManagement';
import LessonManagement from '../components/LessonManagement';
import ScheduleManagement from '../components/ScheduleManagement';
import ProfileView from '../components/ProfileView';
import StudentAssessmentView from '../components/StudentAssessmentView';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed by default
  const [currentView, setCurrentView] = useState({
    type: 'main', // 'main', 'profile', 'assessment'
    data: null
  });

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
          onClick={toggleSidebar}
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
}
