'use client';

import React from 'react';

const Sidebar = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { path: 'dashboard', name: 'Dashboard', icon: '📊' },
    { path: 'schools', name: 'Schools', icon: '🏫' },
    { path: 'teachers', name: 'Teachers', icon: '👨‍🏫' },
    { path: 'students', name: 'Students', icon: '👨‍🎓' },
    { path: 'lessons', name: 'Lessons', icon: '📚' },
    { path: 'schedules', name: 'Schedules', icon: '📅' }
  ];

  return (
    <div className="w-64 bg-blue-800 text-white h-full">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">BB Society Information System</h1>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => onPageChange(item.path)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-left ${
                    currentPage === item.path
                      ? 'bg-blue-600'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
