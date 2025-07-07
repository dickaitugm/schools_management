// utils/assessmentUtils.js
// Utility functions for assessment management

export const assessmentCategories = {
  personal_development: {
    title: 'Personal Development',
    goal: 'To build respectful, kind, and emotionally aware individuals.',
    levels: {
      1: 'Says "please," "thank you," and "sorry" in daily interactions. Waits patiently and takes turns.',
      2: 'Shows care for belongings and shared materials. Expresses feelings appropriately using words.',
      3: 'Greets others politely and respectfully. Listens when others are speaking.',
      4: 'Accepts feedback and corrections with a positive attitude. Helps friends or adults when someone is in need.'
    }
  },
  critical_thinking: {
    title: 'Critical Thinking',
    goal: 'To develop curiosity, reasoning, and problem-solving skills.',
    levels: {
      1: 'Asks questions to learn more or clarify. Makes predictions and checks outcomes.',
      2: 'Identifies simple problems and suggests solutions. Sorts and classifies objects or ideas based on features.',
      3: 'Gives reasons for choices or actions. Connects new information to previous experiences.',
      4: 'Participates in exploration or simple investigations. Thinks creatively in tasks or storytelling.'
    }
  },
  team_work: {
    title: 'Team Work',
    goal: 'To promote cooperation, communication, and mutual respect.',
    levels: {
      1: 'Works well with others in pairs or groups. Shares materials and takes turns during activities.',
      2: 'Listens and responds respectfully to teammates\' ideas. Helps solve group conflicts in a kind way.',
      3: 'Encourages others and celebrates group success. Follows group roles or responsibilities.',
      4: 'Waits for their turn to speak in discussions. Shows leadership by helping guide peers when needed.'
    }
  },
  academic_knowledge: {
    title: 'Academic Knowledge',
    goal: 'To help children enjoy learning and understand basic school subjects.',
    levels: {
      1: 'Reads and understands simple to longer texts. Writes to share thoughts or tell stories.',
      2: 'Follows instructions during learning activities. Asks questions to learn more.',
      3: 'Shares ideas with teachers and friends. Finishes schoolwork with care.',
      4: 'Shows excitement about learning new things. Tries best effort in all activities.'
    }
  }
};

export const getLevelDescription = (category, level) => {
  return assessmentCategories[category]?.levels[level] || '';
};

export const getCategoryTitle = (category) => {
  return assessmentCategories[category]?.title || '';
};

export const getCategoryGoal = (category) => {
  return assessmentCategories[category]?.goal || '';
};

export const truncateDescription = (description, maxLength = 60) => {
  if (!description) return '';
  return description.length > maxLength 
    ? description.substring(0, maxLength) + '...'
    : description;
};

export const validateAssessmentLevel = (level) => {
  return level >= 1 && level <= 4;
};

export const getAssessmentLevelOptions = (category) => {
  if (!assessmentCategories[category]) return [];
  
  return Object.entries(assessmentCategories[category].levels).map(([level, description]) => ({
    value: level,
    label: `Level ${level}`,
    description: description,
    shortDescription: truncateDescription(description)
  }));
};
