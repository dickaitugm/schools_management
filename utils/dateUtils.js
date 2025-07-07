/**
 * Utility functions for date formatting across the application
 */

// Indonesian day names
const dayNames = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

// Indonesian month names (abbreviated)
const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format date to Indonesian format: "Hari, DD MMM YYYY"
 * Example: "Senin, 15 Jan 2024"
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${monthName} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

// Alias for backward compatibility
export const formatDateIndonesian = formatDate;

/**
 * Format date and time to Indonesian format: "Hari, DD MMM YYYY HH:MM"
 * Example: "Senin, 15 Jan 2024 14:30"
 * @param {string|Date} dateString - Date string or Date object
 * @param {string} timeString - Time string in HH:MM format (optional)
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (dateString, timeString = null) => {
  const dateFormatted = formatDate(dateString);
  if (dateFormatted === 'N/A') return 'N/A';
  
  if (timeString) {
    const time = timeString.slice(0, 5); // Get HH:MM format
    return `${dateFormatted} ${time}`;
  }
  
  return dateFormatted;
};

// Alias for backward compatibility
export const formatDateTimeIndonesian = formatDateTime;

/**
 * Format time to HH:MM format
 * @param {string} timeString - Time string
 * @returns {string} Formatted time string
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  return timeString.slice(0, 5);
};

// Alias for backward compatibility
export const formatTimeIndonesian = formatTime;

/**
 * Get current date in Indonesian format
 * @returns {string} Current date formatted
 */
export const getCurrentDate = () => {
  return formatDate(new Date());
};

/**
 * Get current date and time in Indonesian format
 * @returns {string} Current datetime formatted
 */
export const getCurrentDateTime = () => {
  const now = new Date();
  const timeString = now.toTimeString().slice(0, 5);
  return formatDateTime(now, timeString);
};

/**
 * Check if a date is today
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
};

/**
 * Get relative date description
 * @param {string|Date} dateString - Date to describe
 * @returns {string} Relative description like "Hari ini", "Kemarin", etc.
 */
export const getRelativeDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Besok';
    } else {
      return formatDate(dateString);
    }
  } catch {
    return formatDate(dateString);
  }
};

// CommonJS exports for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatDate,
    formatDateTime,
    formatTime,
    formatDateIndonesian,
    formatDateTimeIndonesian,
    formatTimeIndonesian,
    getCurrentDate,
    getCurrentDateTime,
    isToday,
    getRelativeDate
  };
}
