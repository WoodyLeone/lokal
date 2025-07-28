import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { ENV } from '../config/env';

// Generate thumbnail from video URI
export const generateThumbnail = async (videoUri: string): Promise<string | null> => {
  try {
    // For now, we'll return null and handle thumbnail generation on the backend
    // In a production app, you might use a native module or backend service
    console.log('Thumbnail generation would happen here for:', videoUri);
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};

// Validate video file
export const validateVideo = (uri: string, size?: number, duration?: number): { isValid: boolean; error?: string } => {
  // Check file extension
  const supportedFormats = ['mp4', 'mov', 'avi', 'mkv'];
  const fileExtension = uri.split('.').pop()?.toLowerCase();
  
  if (!fileExtension || !supportedFormats.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: `Unsupported video format. Supported formats: ${supportedFormats.join(', ')}` 
    };
  }

  // Check file size (if provided)
  if (size && size > ENV.MAX_VIDEO_SIZE) {
    return { 
      isValid: false, 
      error: `Video file is too large. Maximum size is ${formatFileSize(ENV.MAX_VIDEO_SIZE)}. Your file: ${formatFileSize(size)}` 
    };
  }

  // Check duration (if provided)
  if (duration !== undefined && duration !== null) {
    // Handle potential millisecond values
    let durationInSeconds = duration;
    if (duration > 1000) {
      durationInSeconds = duration / 1000;
      console.log(`Duration validation: converted ${duration} to ${durationInSeconds} seconds`);
    } else if (duration < 1) {
      // If duration is less than 1, it might be in minutes, convert to seconds
      durationInSeconds = duration * 60;
      console.log(`Duration validation: converted ${duration} minutes to ${durationInSeconds} seconds`);
    }
    
    if (durationInSeconds > ENV.MAX_VIDEO_DURATION) {
      const maxMinutes = Math.floor(ENV.MAX_VIDEO_DURATION / 60);
      const maxSeconds = ENV.MAX_VIDEO_DURATION % 60;
      const videoMinutes = Math.floor(durationInSeconds / 60);
      const videoSeconds = Math.floor(durationInSeconds % 60);
      return { 
        isValid: false, 
        error: `Video is too long. Maximum duration is ${maxMinutes}:${maxSeconds.toString().padStart(2, '0')}. Your video: ${videoMinutes}:${videoSeconds.toString().padStart(2, '0')}` 
      };
    }

    // Check minimum duration
    if (durationInSeconds < 15) {
      return { 
        isValid: false, 
        error: `Video is too short. Minimum duration is 15 seconds. Your video: ${durationInSeconds.toFixed(1)} seconds` 
      };
    }
  }

  return { isValid: true };
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Generate unique filename
export const generateUniqueFilename = (prefix: string = 'video', extension: string = 'mp4'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

// Check if running in demo mode
export const isDemoMode = (): boolean => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  return supabaseUrl === 'YOUR_SUPABASE_URL' || 
         supabaseKey === 'YOUR_SUPABASE_ANON_KEY' ||
         !supabaseUrl || 
         !supabaseKey;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Retry function with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries <= 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, maxRetries - 1, delay * 2);
  }
};

// Format date
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Truncate text to specified length
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// Format price with currency
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}; 