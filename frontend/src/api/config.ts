/**
 * API Configuration - CRITICAL
 * Ensures ALL API calls use VITE_API_URL from environment
 * NO fallback to localhost under ANY condition in production
 */

// REQUIRED: API base URL must come from environment variable
const apiBaseUrl = import.meta.env.VITE_API_URL;

/**
 * VALIDATE: Environment variable is properly set
 * This will fail loudly if VITE_API_URL is not configured
 */
if (!apiBaseUrl || apiBaseUrl === 'undefined') {
  const errorMsg = `
  🚨 CRITICAL ERROR 🚨
  VITE_API_URL environment variable is NOT SET!
  
  Required format: https://your-domain.com/api
  Current value: ${import.meta.env.VITE_API_URL}
  Environment: ${import.meta.env.MODE}
  `;
  console.error(errorMsg);
  
  if (import.meta.env.PROD) {
    // HARD STOP: Production builds MUST have proper config
    throw new Error('VITE_API_URL is required for production builds');
  }
}

/**
 * API_BASE_URL - This is THE ONLY endpoint configuration
 * All fetch/axios calls MUST use this
 * NO other hardcoded URLs are allowed
 */
export const API_BASE_URL = apiBaseUrl;

// DEBUG: Log configuration on startup
console.log('🔗 API BASE URL:', API_BASE_URL);

export default API_BASE_URL;
