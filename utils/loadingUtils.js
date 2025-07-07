/**
 * Utility to ensure minimum loading time for better UX
 * @param {Function} asyncOperation - The async operation to perform
 * @param {number} minLoadingTime - Minimum loading time in milliseconds (default: 800ms)
 * @returns {Promise} - Promise that resolves after both operation and minimum time
 */
export const withMinimumLoadingTime = async (asyncOperation, minLoadingTime = 800) => {
  const startTime = Date.now();
  
  try {
    const result = await asyncOperation();
    
    // Ensure minimum loading time
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    
    if (remainingTime > 0) {
      console.log(`Adding ${remainingTime}ms delay to show loading indicator`);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    return result;
  } catch (error) {
    // Still apply minimum delay even on error to avoid flickering
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    throw error;
  }
};

/**
 * Simulate slow network for testing loading indicators
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise}
 */
export const simulateSlowNetwork = (delay = 2000) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Enhanced fetch with minimum loading time
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} minLoadingTime - Minimum loading time
 * @returns {Promise<Response>}
 */
export const fetchWithMinLoading = async (url, options = {}, minLoadingTime = 800) => {
  return withMinimumLoadingTime(
    () => fetch(url, options),
    minLoadingTime
  );
};
