// Environment configuration for Lokal React Native app
export const ENV = {
  // Database Configuration (Railway PostgreSQL) - Not required for frontend
  // The backend handles database connections internally
  DATABASE_URL: process.env.EXPO_PUBLIC_DATABASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Backend API Configuration - Railway Production
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lokal-dev-production.up.railway.app/api',
  
  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Lokal',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_OBJECT_DETECTION: process.env.EXPO_PUBLIC_ENABLE_OBJECT_DETECTION === 'true',
  ENABLE_PRODUCT_MATCHING: process.env.EXPO_PUBLIC_ENABLE_PRODUCT_MATCHING === 'true',
  ENABLE_VIDEO_UPLOAD: process.env.EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD === 'true',
  ENABLE_FILE_UPLOAD: process.env.EXPO_PUBLIC_ENABLE_FILE_UPLOAD === 'true',
  
  // NEW: Interactive Video Features
  ENABLE_INTERACTIVE_VIDEOS: process.env.EXPO_PUBLIC_ENABLE_INTERACTIVE_VIDEOS === 'true' || true,
  ENABLE_ITEM_TRACKING: process.env.EXPO_PUBLIC_ENABLE_ITEM_TRACKING === 'true' || true,
  ENABLE_HOTSPOTS: process.env.EXPO_PUBLIC_ENABLE_HOTSPOTS === 'true' || true,
  
  // Video Configuration
  MAX_VIDEO_DURATION: parseInt(process.env.EXPO_PUBLIC_MAX_VIDEO_DURATION || '180'), // 3 minutes in seconds
  MAX_VIDEO_SIZE: parseInt(process.env.EXPO_PUBLIC_MAX_VIDEO_SIZE || '524288000'), // 500MB in bytes
  SUPPORTED_VIDEO_FORMATS: (process.env.EXPO_PUBLIC_SUPPORTED_VIDEO_FORMATS || 'mp4,mov,avi,mkv').split(','),
  
  // Object Detection Configuration
  CONFIDENCE_THRESHOLD: parseFloat(process.env.EXPO_PUBLIC_CONFIDENCE_THRESHOLD || '0.5'),
  MAX_DETECTED_OBJECTS: parseInt(process.env.EXPO_PUBLIC_MAX_DETECTED_OBJECTS || '10'),
  
  // NEW: Tracking Configuration
  MAX_TRACKED_ITEMS: parseInt(process.env.EXPO_PUBLIC_MAX_TRACKED_ITEMS || '5'),
  TRACKING_CONFIDENCE_THRESHOLD: parseFloat(process.env.EXPO_PUBLIC_TRACKING_CONFIDENCE_THRESHOLD || '0.6'),
  HOTSPOT_VISIBILITY_DURATION: parseInt(process.env.EXPO_PUBLIC_HOTSPOT_VISIBILITY_DURATION || '60'), // seconds
  
  // Product Matching Configuration
  MAX_MATCHED_PRODUCTS: parseInt(process.env.EXPO_PUBLIC_MAX_MATCHED_PRODUCTS || '6'),
  PRODUCT_MATCH_THRESHOLD: parseFloat(process.env.EXPO_PUBLIC_PRODUCT_MATCH_THRESHOLD || '0.3'),
  
  // Upload Configuration
  UPLOAD_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_UPLOAD_TIMEOUT || '120000'), // 2 minutes for large file uploads
  DETECTION_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_DETECTION_TIMEOUT || '300000'), // 5 minutes for object detection
  
  // NEW: Interactive Video Configuration
  HOTSPOT_ANIMATION_DURATION: parseInt(process.env.EXPO_PUBLIC_HOTSPOT_ANIMATION_DURATION || '300'), // milliseconds
  HOTSPOT_PULSE_INTERVAL: parseInt(process.env.EXPO_PUBLIC_HOTSPOT_PULSE_INTERVAL || '2000'), // milliseconds
  
  // Debug Configuration
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true' || true, // Force debug mode for troubleshooting
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true' || true, // Force dev mode for troubleshooting
};

// Railway production URLs (prioritized by performance)
const RAILWAY_URLS = [
  'https://lokal-dev-production.up.railway.app',  // Primary - tested and working
  'https://lokal-backend-production.up.railway.app', // Fallback
  'https://lokal-backend.up.railway.app', // Additional fallback
];

// Local development URLs
const LOCAL_URLS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://10.0.2.2:3001', // Android emulator
  'http://192.168.1.207:3001', // Fallback for specific network configs
];

// Validation function to check if required environment variables are set
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for API configuration - this is the main requirement
  if (!ENV.API_BASE_URL || ENV.API_BASE_URL === '') {
    errors.push('Missing or invalid EXPO_PUBLIC_API_BASE_URL');
  } else if (ENV.API_BASE_URL.includes('railway.app')) {
    console.log('🚂 Using Railway production API URL');
  } else if (ENV.API_BASE_URL.includes('localhost') || ENV.API_BASE_URL.includes('192.168.1.207')) {
    console.log('🔧 Using local development API URL');
  } else {
    console.log('⚠️ Using custom API URL:', ENV.API_BASE_URL);
  }
  
  // DATABASE_URL is not required since we use the Railway backend API
  // The backend handles database connections internally
  console.log('🚂 Using Railway backend API - database connection handled by backend');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Helper function to get API endpoint with timeout
export const getApiEndpoint = (endpoint: string): string => {
  return `${ENV.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Helper function to check if we're in demo mode
export const isDemoMode = (): boolean => {
  // Force production mode - always use Railway backend
  // Demo mode is unstable and has many flaws
  return false;
};

// Helper function to check if we're using Railway
export const isRailwayMode = (): boolean => {
  // Force Railway mode - always use the backend
  return true;
};

// Helper function to get all possible backend URLs for testing
export const getBackendUrls = (): string[] => {
  if (isRailwayMode()) {
    return RAILWAY_URLS;
  } else {
    return LOCAL_URLS;
  }
};

// Helper function to get the primary backend URL
export const getPrimaryBackendUrl = (): string => {
  if (isRailwayMode()) {
    return RAILWAY_URLS[0];
  } else {
    return LOCAL_URLS[0];
  }
};

// Helper function to get fallback backend URLs
export const getFallbackBackendUrls = (): string[] => {
  if (isRailwayMode()) {
    return RAILWAY_URLS.slice(1);
  } else {
    return LOCAL_URLS.slice(1);
  }
}; 