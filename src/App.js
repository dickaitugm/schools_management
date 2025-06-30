import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SchoolManagement from './components/SchoolManagement';
import TeacherManagement from './components/TeacherManagement';
import StudentManagement from './components/StudentManagement';
import LessonManagement from './components/LessonManagement';
import ScheduleManagement from './components/ScheduleManagement';
import AttendanceManagement from './components/AttendanceManagement';
import SchoolProfile from './components/SchoolProfile';
import TeacherProfile from './components/TeacherProfile';
import StudentProfile from './components/StudentProfile';
import LessonProfile from './components/LessonProfile';
import Dashboard from './components/Dashboard';

function App() {
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/schools" 
              element={
                <SchoolManagement 
                  onSchoolSelect={setSelectedSchoolId}
                  selectedSchoolId={selectedSchoolId}
                />
              } 
            />
            <Route path="/schools/:id" element={<SchoolProfile />} />
            <Route 
              path="/teachers" 
              element={
                <TeacherManagement 
                  selectedSchoolId={selectedSchoolId}
                />
              } 
            />
            <Route path="/teachers/:id" element={<TeacherProfile />} />
            <Route 
              path="/students" 
              element={
                <StudentManagement 
                  selectedSchoolId={selectedSchoolId}
                />
              } 
            />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/lessons" element={<LessonManagement />} />
            <Route path="/lessons/:id" element={<LessonProfile />} />
            <Route path="/schedules" element={<ScheduleManagement />} />
            <Route path="/attendance/:scheduleId" element={<AttendanceManagement />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
