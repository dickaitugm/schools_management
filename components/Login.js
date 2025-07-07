'use client';

import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock users untuk demo (nanti bisa diganti dengan API)
  const mockUsers = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
    { id: 2, username: 'teacher1', password: 'teacher123', role: 'teachers', name: 'John Teacher' },
    { id: 3, username: 'student1', password: 'student123', role: 'student', name: 'Jane Student' },
    { id: 4, username: 'parent1', password: 'parent123', role: 'parents', name: 'Bob Parent' },
    { id: 5, username: 'guest1', password: 'guest123', role: 'guest', name: 'Guest User' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication
      const user = mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (user) {
        // Save to localStorage (dalam implementasi nyata, gunakan token)
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('Login successful, calling onLogin with:', user);
        onLogin(user);
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Schools Management</h2>
            <p className="text-gray-600 mt-2">Silakan login untuk melanjutkan</p>
          </div>

          {/* Demo Accounts Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Accounts (Click to use):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="text-xs font-medium">Admin</div>
                <div className="text-xs text-gray-500">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('teachers')}
                className="text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="text-xs font-medium">Teacher</div>
                <div className="text-xs text-gray-500">teacher1 / teacher123</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="text-xs font-medium">Student</div>
                <div className="text-xs text-gray-500">student1 / student123</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('parents')}
                className="text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="text-xs font-medium">Parent</div>
                <div className="text-xs text-gray-500">parent1 / parent123</div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleDemoLogin('guest')}
              className="w-full mt-2 text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs font-medium">Guest</div>
              <div className="text-xs text-gray-500">guest1 / guest123</div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Schools Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
