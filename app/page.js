'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import SchoolManagement from '../components/SchoolManagement';
import TeacherManagement from '../components/TeacherManagement';
import StudentManagement from '../components/StudentManagement';
import LessonManagement from '../components/LessonManagement';
import ScheduleManagement from '../components/ScheduleManagement';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'schools':
        return (
          <SchoolManagement 
            onSchoolSelect={setSelectedSchoolId}
            selectedSchoolId={selectedSchoolId}
          />
        );
      case 'teachers':
        return <TeacherManagement selectedSchoolId={selectedSchoolId} />;
      case 'students':
        return <StudentManagement selectedSchoolId={selectedSchoolId} />;
      case 'lessons':
        return <LessonManagement />;
      case 'schedules':
        return <ScheduleManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 overflow-auto">
        {renderPage()}
      </div>
    </div>
  );
}
