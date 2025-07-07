'use client';

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          <div className="text-sm text-gray-500 mb-2 md:mb-0">
            © {currentYear} BB for Society Management System. All rights reserved.
          </div>
          
          {/* Attribution */}
          <div className="text-sm text-gray-600 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end space-x-1">
              <span>Fueled by kindness. Developed with</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>by</span>
              <span className="font-semibold text-blue-600">Dicka Ariptian Rahayu</span>
              <span>&</span>
              <span className="font-semibold text-purple-600">Team BB for Society</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
