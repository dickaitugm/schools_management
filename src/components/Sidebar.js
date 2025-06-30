import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: '📊' },
    { path: '/schools', name: 'Schools', icon: '🏫' },
    { path: '/teachers', name: 'Teachers', icon: '👨‍🏫' },
    { path: '/students', name: 'Students', icon: '👨‍🎓' },
    { path: '/lessons', name: 'Lessons', icon: '📚' },
    { path: '/schedules', name: 'Schedules', icon: '📅' }
  ];

  return (
    <div className="w-64 bg-blue-800 text-white h-full">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">BB Society Information System</h1>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
