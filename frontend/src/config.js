/**
 * Configuration module for the application
 * Centralizes all environment-specific configuration
 */

/**
 * Get the base API URL based on environment
 * @returns {string} The base API URL
 */
export const Config = () => {
  // For development with Create React App
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For Vite
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For Next.js
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default fallback - should be updated based on environment
  return window.location.origin;
};

/**
 * Extended API configuration
 */
export const ApiConfig = {
  get baseUrl() {
    return Config();
  },
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Environment-specific feature flags
 */
export const FeatureFlags = {
  enableDebugMode: process.env.NODE_ENV !== 'production',
  enableAnalytics: process.env.NODE_ENV === 'production'
};