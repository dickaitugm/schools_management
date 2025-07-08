/**
 * Utility functions for handling privacy and data masking
 */

// Daftar nama depan acak untuk penyamaran
const randomFirstNames = [
  'Alex', 'Bailey', 'Casey', 'Dana', 'Ellis', 'Francis', 
  'Gale', 'Harper', 'Indra', 'Jordan', 'Kai', 'Logan', 
  'Morgan', 'Noel', 'Ollie', 'Parker', 'Quinn', 'Riley', 
  'Sam', 'Taylor', 'Umi', 'Val', 'Winter', 'Yael', 'Zen'
];

// Daftar nama belakang acak untuk penyamaran
const randomLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 
  'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Anderson', 'Thomas', 
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 
  'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Young'
];

/**
 * Generates a consistent random name based on original name
 * @param {string} originalName - Original name to create a hash from
 * @returns {string} - Random but consistent name
 */
const generateConsistentRandomName = (originalName) => {
  if (!originalName) return "Anonymous Student";
  
  // Create a simple hash from the original name
  let hash = 0;
  for (let i = 0; i < originalName.length; i++) {
    hash = ((hash << 5) - hash) + originalName.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the hash to select consistent random names
  const firstNameIndex = Math.abs(hash) % randomFirstNames.length;
  const lastNameIndex = Math.abs(hash >> 8) % randomLastNames.length; // Bit shift for different index
  
  return `${randomFirstNames[firstNameIndex]} ${randomLastNames[lastNameIndex]}`;
};

/**
 * Masks a student name for privacy when viewed by guests or non-logged in users
 * @param {string} name - The student's full name
 * @param {object} options - Masking options
 * @param {boolean} options.preserveFirstName - If true, keeps first name visible
 * @param {boolean} options.preserveInitials - If true, keeps initials visible
 * @param {boolean} options.useRandomNames - If true, replaces with random names instead of masking
 * @returns {string} - The masked name
 */
export const maskStudentName = (name, { preserveFirstName = false, preserveInitials = true, useRandomNames = true } = {}) => {
  if (!name) return "Anonymous Student";
  
  // Use random name generation if specified
  if (useRandomNames) {
    return generateConsistentRandomName(name);
  }
  
  // Otherwise use the initial-based masking
  const nameParts = name.split(" ");
  
  if (preserveFirstName && nameParts.length > 0) {
    // Keep first name, mask last name(s)
    return nameParts[0] + " " + nameParts.slice(1).map(part => 
      preserveInitials ? `${part[0]}.` : "***"
    ).join(" ");
  } else {
    // Mask all parts, potentially keeping initials
    return nameParts.map(part => 
      preserveInitials ? `${part[0]}.` : "***"
    ).join(" ");
  }
};

/**
 * Conditionally masks a student name based on user authentication and permissions
 * @param {string} name - The student's name
 * @param {object} user - Current user object
 * @param {object} options - Masking options
 * @returns {string} - Either the original name or masked name
 */
export const conditionallyMaskStudentName = (name, user, options = {}) => {
  // Return unmasked name if user is logged in and not a guest
  if (user && user.id !== 'guest' && user.role !== 'guest') {
    return name;
  }
  
  // Mask the name for guests or non-logged in users
  // By default, use random name generation
  const defaultOptions = { 
    useRandomNames: true,
    preserveFirstName: false,
    preserveInitials: false,
    ...options
  };
  
  return maskStudentName(name, defaultOptions);
};
