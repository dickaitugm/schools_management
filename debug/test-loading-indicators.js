/**
 * Debug script to test loading indicators
 * Run this in browser console to test loading states
 */

// Test loading indicator visibility
const testLoadingIndicator = () => {
  console.log('🔄 Testing Loading Indicators...');
  
  // Create test button with loading state
  const testButton = document.createElement('button');
  testButton.innerHTML = `
    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Testing Loading...
  `;
  testButton.className = 'px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 flex items-center';
  testButton.disabled = true;
  
  // Append to body temporarily
  document.body.appendChild(testButton);
  
  // Remove after 3 seconds
  setTimeout(() => {
    document.body.removeChild(testButton);
    console.log('✅ Loading indicator test completed');
  }, 3000);
  
  console.log('⏱️ Loading indicator should be visible for 3 seconds');
};

// Test loading states in forms
const testFormLoadingStates = () => {
  console.log('🧪 Testing form loading states...');
  
  // Find all forms in the page
  const forms = document.querySelectorAll('form');
  console.log(`Found ${forms.length} forms`);
  
  // Find all submit buttons
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  console.log(`Found ${submitButtons.length} submit buttons`);
  
  submitButtons.forEach((button, index) => {
    console.log(`Button ${index + 1}:`, {
      text: button.textContent,
      disabled: button.disabled,
      hasSpinner: button.querySelector('.animate-spin') !== null,
      className: button.className
    });
  });
};

// Monitor loading states
const monitorLoadingStates = () => {
  console.log('👀 Monitoring loading states...');
  
  // Observer for button text changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const target = mutation.target;
        if (target.tagName === 'BUTTON' || target.closest('button')) {
          const button = target.tagName === 'BUTTON' ? target : target.closest('button');
          if (button.textContent.includes('Saving') || button.textContent.includes('Loading')) {
            console.log('🔄 Loading state detected:', {
              text: button.textContent,
              disabled: button.disabled,
              hasSpinner: button.querySelector('.animate-spin') !== null
            });
          }
        }
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  console.log('✅ Loading state monitor started');
  
  // Stop monitoring after 30 seconds
  setTimeout(() => {
    observer.disconnect();
    console.log('⏹️ Loading state monitor stopped');
  }, 30000);
};

// Check if Tailwind CSS is loaded (required for spinner animation)
const checkTailwindCSS = () => {
  const testElement = document.createElement('div');
  testElement.className = 'animate-spin';
  document.body.appendChild(testElement);
  
  const styles = window.getComputedStyle(testElement);
  const hasAnimation = styles.animation !== 'none' && styles.animation !== '';
  
  document.body.removeChild(testElement);
  
  console.log(hasAnimation ? '✅ Tailwind CSS animations working' : '❌ Tailwind CSS animations not working');
  return hasAnimation;
};

// Export functions for manual testing
window.debugLoadingIndicators = {
  testLoadingIndicator,
  testFormLoadingStates,
  monitorLoadingStates,
  checkTailwindCSS,
  
  // Quick test all
  runAllTests: () => {
    console.clear();
    console.log('🚀 Running all loading indicator tests...');
    checkTailwindCSS();
    testFormLoadingStates();
    testLoadingIndicator();
    monitorLoadingStates();
  }
};

console.log('🛠️ Loading indicator debug tools loaded!');
console.log('Run debugLoadingIndicators.runAllTests() to test everything');
console.log('Available methods:', Object.keys(window.debugLoadingIndicators));
