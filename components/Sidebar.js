'use client';

import React, { useState, useEffect } from 'react';

const Sidebar = ({ currentPage, onPageChange, collapsed, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed || false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (collapsed !== undefined) {
      setIsCollapsed(collapsed);
    }
  }, [collapsed]);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    { path: 'dashboard', name: 'Dashboard', icon: '📊' },
    { path: 'schools', name: 'Schools', icon: '🏫' },
    { path: 'teachers', name: 'Teachers', icon: '👨‍🏫' },
    { path: 'students', name: 'Students', icon: '👨‍🎓' },
    { path: 'lessons', name: 'Lessons', icon: '📚' },
    { path: 'schedules', name: 'Schedules', icon: '📅' }
  ];

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onToggle) {
      onToggle(newCollapsed);
    }
  };

  const handleMenuClick = (path) => {
    onPageChange(path);
    // Auto-close sidebar on mobile after selecting menu
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar - Hide completely on mobile when collapsed */}
      {(!isMobile || !isCollapsed) && (
        <div className={`
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobile ? 'fixed z-50 h-full' : 'relative'}
          bg-blue-800 text-white transition-all duration-300 ease-in-out
          ${isMobile ? 'shadow-lg' : ''}
        `}>
        {/* Header */}
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h1 className="text-lg font-bold">BB Society</h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`
                    flex items-center p-3 rounded-lg transition-colors w-full text-left group
                    ${currentPage === item.path ? 'bg-blue-600' : 'hover:bg-blue-700'}
                    ${isCollapsed ? 'justify-center' : 'space-x-3'}
                  `}
                  title={isCollapsed ? item.name : ''}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        </div>
      )}
    </>
  );
};

export default Sidebar;
