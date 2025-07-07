'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const InlineLogin = ({ onCancel }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logActivity } = useAuth();

  // Mock users untuk demo (4 roles sesuai permintaan)
  const mockUsers = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
    { id: 2, username: 'teacher1', password: 'teacher123', role: 'teachers', name: 'John Teacher' },
    { id: 3, username: 'parent1', password: 'parent123', role: 'parents', name: 'Bob Parent' },
    { id: 4, username: 'student1', password: 'student123', role: 'student', name: 'Jane Student' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulasi delay login
      await new Promise(resolve => setTimeout(resolve, 500));

      // Cek kredensial
      const user = mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (user) {
        // Login berhasil
        const userSession = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          loginTime: new Date().toISOString()
        };
        
        login(userSession);
        
        // Auto redirect ke dashboard after login
        if (onCancel) onCancel(); // Close login form
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoUser = mockUsers.find(u => u.role === role);
    if (demoUser) {
      setCredentials({
        username: demoUser.username,
        password: demoUser.password
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Login to Your Account
            </h2>
            <p className="text-gray-600">
              Sign in to access all features
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">Quick Login (Demo Accounts):</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="text-left p-3 bg-white rounded border hover:bg-gray-50 text-xs"
              >
                <strong className="text-red-600">Admin</strong><br/>
                admin / admin123<br/>
                <span className="text-gray-500">Full access</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('teachers')}
                className="text-left p-3 bg-white rounded border hover:bg-gray-50 text-xs"
              >
                <strong className="text-blue-600">Teacher</strong><br/>
                teacher1 / teacher123<br/>
                <span className="text-gray-500">All except roles</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('parents')}
                className="text-left p-3 bg-white rounded border hover:bg-gray-50 text-xs"
              >
                <strong className="text-green-600">Parent</strong><br/>
                parent1 / parent123<br/>
                <span className="text-gray-500">Student view & edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="text-left p-3 bg-white rounded border hover:bg-gray-50 text-xs"
              >
                <strong className="text-purple-600">Student</strong><br/>
                student1 / student123<br/>
                <span className="text-gray-500">Profile view & edit</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>School Management System v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineLogin;
