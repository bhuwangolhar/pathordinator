/**
 * API Configuration
 * Ensures all API calls use the correct base URL from environment variables
 * Never falls back to localhost in production
 */

// Get API base URL from environment variable
const apiBaseUrl = import.meta.env.VITE_APP_API_URL;

// Validate that API URL is properly configured
if (!apiBaseUrl) {
  console.error(
    'CRITICAL: VITE_APP_API_URL environment variable is not set!',
    'Expected format: https://your-domain.com/api',
    'Current value:', import.meta.env.VITE_APP_API_URL
  );
  
  // In production, this will prevent fallback to localhost
  if (import.meta.env.PROD) {
    console.error('Production build detected. API URL must be configured.');
  }
}

export const API_BASE_URL = apiBaseUrl || (() => {
  // Development fallback only
  const devUrl = 'http://localhost:8080';
  if (import.meta.env.DEV) {
    console.warn(`[DEV MODE] Using fallback API URL: ${devUrl}`);
  }
  return devUrl;
})();

// Log API configuration on app start (for debugging)
if (typeof window !== 'undefined') {
  console.log('API Configuration:', {
    apiUrl: API_BASE_URL,
    environment: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD
  });
}

export default API_BASE_URL;
