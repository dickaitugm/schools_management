// components/AssessmentLevelSelect.js
'use client';

import React from 'react';
import MultilineSelect from './MultilineSelect';

const AssessmentLevelSelect = ({ 
  category, 
  value, 
  onChange, 
  categoryKey, 
  className = "",
  showDescription = true 
}) => {
  const options = Object.entries(category.levels).map(([level, description]) => ({
    value: level,
    description: description
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-2">{category.title || category.name}</h4>
      <p className="text-xs text-gray-600 mb-3 italic">
        {category.goal || category.description}
      </p>
      
      <MultilineSelect
        value={value || ''}
        onChange={onChange}
        options={options}
        placeholder="Select Level"
        className={`w-full ${className}`}
      />
      
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
