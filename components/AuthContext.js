'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  // Role permissions mapping
  const rolePermissions = {
    admin: ['*', 'manage_roles'], // Admin has all permissions including role management
    teachers: [
      'create_students', 'read_students', 'update_students', 'delete_students',
      'create_teachers', 'read_teachers', 'update_teachers', 'delete_teachers',
      'create_schools', 'read_schools', 'update_schools', 'delete_schools',
      'create_schedules', 'read_schedules', 'update_schedules', 'delete_schedules',
      'create_lessons', 'read_lessons', 'update_lessons', 'delete_lessons',
      'view_reports', 'view_assessments', 'create_assessments'
    ],
    parents: ['read_students', 'update_students', 'read_schedules', 'read_lessons', 'view_assessments'],
    student: ['read_students', 'update_students', 'read_schedules', 'read_lessons', 'view_assessments'],
    guest: ['read_students', 'read_teachers', 'read_schools', 'read_schedules', 'read_lessons']
  };

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsGuest(false);
    } else {
      // Default guest user
      setUser({ role: 'guest', name: 'Guest User', id: 'guest' });
      setIsGuest(true);
    }
    setLoading(false);
  }, []);

  // Activity Logger
  const logActivity = (action, description, metadata = {}) => {
    const activity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        name: user.name,
        role: user.role
      } : { id: 'guest', name: 'Guest User', role: 'guest' },
      action,
      description,
      metadata,
      session: isGuest ? 'guest' : 'authenticated'
    };

    // Get existing logs
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    // Add new log
    existingLogs.push(activity);
    
    // Keep only last 1000 logs to prevent localStorage overflow
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    // Save to localStorage
    localStorage.setItem('activityLogs', JSON.stringify(existingLogs));
    
    console.log('Activity logged:', activity);
  };

  const login = (userData) => {
    setUser(userData);
    setIsGuest(false);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    logActivity('login', `User ${userData.name} logged in`);
  };

  const logout = () => {
    if (user && !isGuest) {
      logActivity('logout', `User ${user.name} logged out`);
    }
    setUser({ role: 'guest', name: 'Guest User', id: 'guest' });
    setIsGuest(true);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSession');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check if user's role has the specific permission
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const canAccess = (resource, action = 'read') => {
    const permission = `${action}_${resource}`;
    return hasPermission(permission);
  };

  const getActivityLogs = (limit = 100) => {
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    return logs.slice(-limit).reverse(); // Return latest first
  };

  const value = {
    user,
    isGuest,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    canAccess,
    loading,
    logActivity,
    getActivityLogs
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
