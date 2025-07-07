// components/AssessmentLevelSelect.js
'use client';

import React from 'react';

const AssessmentLevelSelect = ({ 
  category, 
  value, 
  onChange, 
  categoryKey, 
  className = "",
  showDescription = true 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-2">{category.title || category.name}</h4>
      <p className="text-xs text-gray-600 mb-3 italic">
        {category.goal || category.description}
      </p>
      
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${className}`}
      >
        <option value="">Select Level</option>
        {Object.entries(category.levels).map(([level, description]) => (
          <option key={level} value={level}>
            Level {level}: {description.length > 60 ? description.substring(0, 60) + '...' : description}
          </option>
        ))}
      </select>
      
      {/* Show selected level description */}
      {showDescription && value && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Level {value}:</strong>{' '}
          {category.levels[value]}
        </div>
      )}
    </div>
  );
};

export default AssessmentLevelSelect;
