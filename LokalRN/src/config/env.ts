// Environment configuration for Lokal React Native app
export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  
  // Backend API Configuration - Production Railway deployment
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lokal-production.up.railway.app/api',
  
  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Lokal',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_OBJECT_DETECTION: process.env.EXPO_PUBLIC_ENABLE_OBJECT_DETECTION === 'true',
  ENABLE_PRODUCT_MATCHING: process.env.EXPO_PUBLIC_ENABLE_PRODUCT_MATCHING === 'true',
  ENABLE_VIDEO_UPLOAD: process.env.EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD === 'true',
  ENABLE_FILE_UPLOAD: process.env.EXPO_PUBLIC_ENABLE_FILE_UPLOAD === 'true',
  
  // Video Configuration
  MAX_VIDEO_DURATION: parseInt(process.env.EXPO_PUBLIC_MAX_VIDEO_DURATION || '180'), // 3 minutes in seconds
  MAX_VIDEO_SIZE: parseInt(process.env.EXPO_PUBLIC_MAX_VIDEO_SIZE || '524288000'), // 500MB in bytes
  SUPPORTED_VIDEO_FORMATS: (process.env.EXPO_PUBLIC_SUPPORTED_VIDEO_FORMATS || 'mp4,mov,avi,mkv').split(','),
  
  // Object Detection Configuration
  CONFIDENCE_THRESHOLD: parseFloat(process.env.EXPO_PUBLIC_CONFIDENCE_THRESHOLD || '0.5'),
  MAX_DETECTED_OBJECTS: parseInt(process.env.EXPO_PUBLIC_MAX_DETECTED_OBJECTS || '10'),
  
  // Product Matching Configuration
  MAX_MATCHED_PRODUCTS: parseInt(process.env.EXPO_PUBLIC_MAX_MATCHED_PRODUCTS || '6'),
  PRODUCT_MATCH_THRESHOLD: parseFloat(process.env.EXPO_PUBLIC_PRODUCT_MATCH_THRESHOLD || '0.3'),
  
  // Upload Configuration
  UPLOAD_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_UPLOAD_TIMEOUT || '120000'), // 2 minutes for large file uploads
  DETECTION_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_DETECTION_TIMEOUT || '300000'), // 5 minutes for object detection
  
  // Debug Configuration
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true',
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
};

// Validation function to check if required environment variables are set
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Only validate Supabase if we're not in demo mode
  // For demo mode, we allow the app to run without Supabase configuration
  const isDemoMode = ENV.SUPABASE_URL === 'YOUR_SUPABASE_URL' || 
                    ENV.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';
  
  if (!isDemoMode) {
    if (ENV.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      errors.push('SUPABASE_URL is not configured');
    }
    
    if (ENV.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
      errors.push('SUPABASE_ANON_KEY is not configured');
    }
  }
  
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
  return ENV.SUPABASE_URL === 'YOUR_SUPABASE_URL' || 
         ENV.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';
}; 