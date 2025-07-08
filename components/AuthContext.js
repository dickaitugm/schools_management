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
      'read_cash_flow', 'create_cash_flow', 'update_cash_flow', 'delete_cash_flow',
      'view_reports', 'view_assessments', 'create_assessments'
    ],
    parents: ['read_students', 'update_students', 'read_schedules', 'read_lessons', 'read_cash_flow', 'view_assessments'],
    student: ['read_students', 'update_students', 'read_schedules', 'read_lessons', 'read_cash_flow', 'view_assessments'],
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

  // Activity Logger - Database version (no guest logging)
  const logActivity = async (action, description, metadata = {}) => {
    // Skip logging for guest users
    if (!user || user.role === 'guest' || user.id === 'guest') {
      console.log('Guest activity not logged:', { action, description });
      return;
    }

    const activity = {
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action,
      description,
      metadata,
      session_id: isGuest ? 'guest' : 'authenticated',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
    };

    try {
      // Save to database via API
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity)
      });

      if (response.ok) {
        console.log('Activity logged to database:', activity);
      } else {
        console.error('Failed to log activity to database:', await response.text());
      }
    } catch (error) {
      console.error('Error logging activity to database:', error);
    }

    // Also keep in localStorage for quick access (but not for guest)
    const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    existingLogs.push({
      ...activity,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 100 logs in localStorage to prevent overflow
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('activityLogs', JSON.stringify(existingLogs));
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

  const getActivityLogs = async (limit = 100) => {
    // For guest users, return empty array
    if (!user || user.role === 'guest' || user.id === 'guest') {
      return [];
    }

    try {
      // Fetch from database
      const response = await fetch(`/api/activity-logs?limit=${limit}&page=1`);
      
      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : [];
      } else {
        console.error('Failed to fetch activity logs from database');
        // Fallback to localStorage
        const localLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        return localLogs.slice(-limit).reverse();
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      // Fallback to localStorage
      const localLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      return localLogs.slice(-limit).reverse();
    }
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
