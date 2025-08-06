import { ObjectDetectionResponse, ProductMatchResponse, VideoUploadResponse } from '../types';
import { getApiEndpoint, ENV, getBackendUrls, getPrimaryBackendUrl } from '../config/env';
import { errorRecovery, NetworkError, ErrorRecoveryOptions } from './errorRecovery';
import { DatabaseService } from './databaseService';

// Network connectivity testing
const testBackendConnectivity = async (): Promise<{ url: string; latency: number } | null> => {
  const possibleUrls = getBackendUrls();

  console.log('🌐 Testing backend connectivity...');

  for (const baseUrl of possibleUrls) {
    try {
      console.log(`🔍 Testing connection to: ${baseUrl}`);
      const startTime = Date.now();
      
      // Use AbortController for timeout with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout
      
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend reachable at: ${baseUrl} (${latency}ms)`);
        console.log(`📊 Backend status: ${data.status}`);
        return { url: baseUrl, latency };
      } else {
        console.log(`❌ HTTP ${response.status} from: ${baseUrl}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏰ Timeout connecting to: ${baseUrl}`);
      } else {
        console.log(`❌ Failed to connect to: ${baseUrl} - ${error}`);
      }
    }
  }

  console.log('❌ No backend servers reachable');
  return null;
};

// Global backend URL cache
let cachedBackendUrl: string | null = null;

const getBackendUrl = async (): Promise<string> => {
  if (cachedBackendUrl) {
    return cachedBackendUrl;
  }

  const connectivity = await testBackendConnectivity();
  if (connectivity) {
    cachedBackendUrl = connectivity.url;
    return connectivity.url;
  }

  // Fallback to configured URL
  const fallbackUrl = getPrimaryBackendUrl();
  console.log(`⚠️ Using fallback URL: ${fallbackUrl}`);
  
  // Test the fallback URL before returning it
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${fallbackUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Fallback URL is working: ${fallbackUrl}`);
      cachedBackendUrl = fallbackUrl;
      return fallbackUrl;
    } else {
      console.log(`❌ Fallback URL failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Fallback URL error: ${error.message}`);
  }
  
  // If all else fails, return the fallback URL anyway
  console.log(`🚨 All backend URLs failed, using fallback: ${fallbackUrl}`);
  return fallbackUrl;
};

const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = 10000,
  retries: number = 2
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && (error instanceof Error && error.name === 'AbortError')) {
      console.log(`Retrying request to ${url}, ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, timeout, retries - 1);
    }
    throw error;
  }
};

export const checkNetworkStatus = async (): Promise<{ connected: boolean; latency?: number; url?: string }> => {
  try {
    const connectivity = await testBackendConnectivity();
    if (connectivity) {
      return { connected: true, latency: connectivity.latency, url: connectivity.url };
    }
    return { connected: false };
  } catch (error) {
    console.log('Network check failed:', error);
    return { connected: false };
  }
};

export class ApiService {
  static async uploadVideo(videoUrl: string, title: string, description?: string, manualProductName?: string, affiliateLink?: string): Promise<VideoUploadResponse> {
    try {
      console.log('📤 Starting video upload (URL method)...');
      
      const backendUrl = await getBackendUrl();
      const endpoint = `${backendUrl}/api/videos/upload`;
      
      const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          title,
          description,
          manualProductName: manualProductName || '',
          affiliateLink: affiliateLink || '',
        }),
      }, ENV.UPLOAD_TIMEOUT);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Video upload successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Upload video error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async uploadVideoFile(videoUri: string, title: string, description?: string, manualProductName?: string, affiliateLink?: string): Promise<VideoUploadResponse> {
    try {
      console.log('📤 Starting video file upload process...');
      console.log('📤 Video URI:', videoUri);
      console.log('📤 Title:', title);
      console.log('📤 Description:', description);
      
      // Validate inputs
      if (!videoUri || !title.trim()) {
        throw new Error('Video URI and title are required');
      }

      // Test connectivity first
      const connectivity = await testBackendConnectivity();
      if (!connectivity) {
        throw new Error('No backend servers reachable');
      }

      console.log(`🌐 Using backend URL: ${connectivity.url}`);

      // Create form data for file upload
      const formData = new FormData();
      
      // Get file info with enhanced validation
      const fileInfo = await this.getFileInfo(videoUri);
      
      // Validate file info
      if (!fileInfo.mimeType || !fileInfo.name) {
        throw new Error('Invalid file information');
      }
      
      // Append file to form data with proper MIME type
      const fileData = {
        uri: videoUri,
        type: fileInfo.mimeType,
        name: fileInfo.name,
      };
      
      console.log('📤 File data for upload:', fileData);
      formData.append('video', fileData as any);
      
      // Append other data
      formData.append('title', title);
      if (description) {
        formData.append('description', description);
      }
      if (manualProductName) {
        formData.append('manualProductName', manualProductName);
      }
      if (affiliateLink) {
        formData.append('affiliateLink', affiliateLink);
      }
      
      // Add user email for demo authentication
      try {
        // Get current user from DatabaseService
        const currentUser = await DatabaseService.getCurrentUser();
        if (currentUser?.email) {
          formData.append('userEmail', currentUser.email);
          console.log('📤 Added user email to upload:', currentUser.email);
        }
      } catch (error) {
        console.log('📤 No authenticated user email available');
      }

      console.log('📤 FormData created successfully');
      console.log('📤 MIME type:', fileInfo.mimeType);
      console.log('📤 File name:', fileInfo.name);

      // Attempt upload with retry logic
      let response: Response | undefined;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`📤 Upload attempt ${attempts}/${maxAttempts}`);
        
        try {
          const endpoint = `${connectivity.url}/api/videos/upload-file`;
          console.log(`📤 Uploading to: ${endpoint}`);
          
          response = await fetchWithRetry(endpoint, {
            method: 'POST',
            // Don't set Content-Type for multipart/form-data - let the browser set it with boundary
            body: formData,
          }, ENV.UPLOAD_TIMEOUT);
          
          break; // Success, exit retry loop
        } catch (error) {
          console.error(`❌ Upload attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!response) {
        throw new Error('All upload attempts failed');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed with status:', response.status);
        console.error('❌ Error response:', errorText);
        
        // Handle specific error types
        if (errorText.includes('Invalid file type') || response.status === 400) {
          console.log('🔄 Retrying with alternative MIME type...');
          return this.uploadVideoFileWithFallback(videoUri, title, description, manualProductName, affiliateLink);
        }
        
        throw new Error(`Upload failed (HTTP ${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Video file upload successful:', data);
      
      // Validate response data
      if (!data.success) {
        throw new Error(data.error || 'Upload failed - no success response');
      }
      
      if (!data.videoId) {
        throw new Error('Upload succeeded but no video ID returned');
      }
      
      console.log('✅ Upload validation passed');
      return data;
    } catch (error) {
      console.error('❌ Upload video file error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  // Fallback upload method with different MIME type handling
  private static async uploadVideoFileWithFallback(videoUri: string, title: string, description?: string, manualProductName?: string, affiliateLink?: string): Promise<VideoUploadResponse> {
    try {
      console.log('🔄 Attempting fallback upload method...');
      
      const backendUrl = await getBackendUrl();
      const endpoint = `${backendUrl}/api/videos/upload-file`;
      
      const formData = new FormData();
      
      // Try with a more generic approach
      const filename = videoUri.split('/').pop() || 'video.mp4';
      const fileData = {
        uri: videoUri,
        type: 'video/mp4', // Force MP4 type
        name: filename,
      };
      
      console.log('🔄 Fallback file data:', fileData);
      formData.append('video', fileData as any);
      formData.append('title', title);
      if (description) {
        formData.append('description', description);
      }
      if (manualProductName) {
        formData.append('manualProductName', manualProductName);
      }
      if (affiliateLink) {
        formData.append('affiliateLink', affiliateLink);
      }

      const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }, ENV.UPLOAD_TIMEOUT);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Fallback upload also failed:', errorText);
        throw new Error(`Fallback upload failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fallback upload successful:', data);
      
      // Validate fallback response
      if (!data.success || !data.videoId) {
        throw new Error('Fallback upload succeeded but response is invalid');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Fallback upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fallback upload failed',
      };
    }
  }

  private static async getFileInfo(uri: string): Promise<{ name: string; mimeType: string }> {
    console.log('🔍 Getting file info for URI:', uri);
    
    // Extract filename from URI
    const filename = uri.split('/').pop() || 'video.mp4';
    console.log('🔍 Extracted filename:', filename);
    
    // Determine MIME type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    console.log('🔍 File extension:', extension);
    
    let mimeType = 'video/mp4'; // default
    
    switch (extension) {
      case 'mov':
        mimeType = 'video/quicktime';
        break;
      case 'avi':
        mimeType = 'video/x-msvideo';
        break;
      case 'mkv':
        mimeType = 'video/x-matroska';
        break;
      case 'webm':
        mimeType = 'video/webm';
        break;
      case 'mp4':
        mimeType = 'video/mp4';
        break;
      default:
        console.warn('⚠️ Unknown file extension, using default MIME type:', extension);
        mimeType = 'video/mp4';
    }
    
    console.log('🔍 Determined MIME type:', mimeType);
    
    return { name: filename, mimeType };
  }

  static async detectObjects(videoId: string): Promise<ObjectDetectionResponse> {
    try {
      console.log('🔍 Starting object detection for video:', videoId);
      
      if (!videoId) {
        throw new Error('Video ID is required for object detection');
      }
      
      const backendUrl = await getBackendUrl();
      const endpoint = `${backendUrl}/api/videos/detect/${videoId}`;
      console.log('🔍 Calling detect objects endpoint:', endpoint);
      
      // Add retry logic for detection
      let response: Response | undefined;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔍 Detection attempt ${attempts}/${maxAttempts}`);
        
        try {
          response = await fetchWithRetry(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }, ENV.DETECTION_TIMEOUT);
          
          break; // Success, exit retry loop
        } catch (error) {
          console.error(`❌ Detection attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }

      if (!response) {
        throw new Error('All detection attempts failed');
      }

      console.log('🔍 Detect objects response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Detection failed (HTTP ${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Detect objects response data:', data);
      
      // Validate detection response
      if (!data.success) {
        throw new Error(data.error || 'Detection failed - no success response');
      }
      
      // Ensure objects array exists (even if empty)
      if (!data.objects) {
        data.objects = [];
      }
      
      console.log('✅ Detection validation passed');
      return data;
    } catch (error) {
      console.error('❌ Detect objects error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
        objects: [], // Ensure objects array is always present
      };
    }
  }

  static async matchProducts(objects: string[]): Promise<ProductMatchResponse> {
    try {
      const backendUrl = await getBackendUrl();
      const endpoint = `${backendUrl}/api/products/match`;
      console.log('🛍️ Calling match products endpoint:', endpoint);
      console.log('🛍️ Objects to match:', objects);
      
      const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objects }),
      }, 30000); // 30 second timeout for product matching

      console.log('🛍️ Match products response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Match products response data:', data);
      return data;
    } catch (error) {
      console.error('❌ Match products error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
        products: [],
      };
    }
  }

  static async getVideoStatus(videoId: string): Promise<{ status: string; progress?: number; detectedObjects?: string[]; matchedProducts?: any[] }> {
    try {
      console.log('📊 Checking video status for:', videoId);
      
      const backendUrl = await getBackendUrl();
      const endpoint = `${backendUrl}/api/videos/status/${videoId}`;
      
      console.log('🔗 Status endpoint:', endpoint);
      
      // Use a more robust fetch with better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP ${response.status} from status endpoint:`, errorText);
          throw new Error(`Status check failed (HTTP ${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 Video status response:', data);
        
        // Handle different response formats
        if (data.success === false) {
          throw new Error(data.error || 'Status check failed');
        }
        
        // Return standardized response
        return {
          status: data.status || 'unknown',
          progress: data.progress || 0,
          detectedObjects: data.detectedObjects || data.objects || [],
          matchedProducts: data.matchedProducts || data.products || [],
        };
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Status check timeout - server took too long to respond');
        }
        
        throw fetchError;
      }
      
    } catch (error) {
      // Use error recovery system to analyze the error
      const networkError = errorRecovery.analyzeError(error);
      const operationId = `video-status-${videoId}`;
      
      // Log the error for debugging
      errorRecovery.logError(operationId, error, networkError);
      
      // Check if we should retry
      const retryOptions: ErrorRecoveryOptions = {
        maxRetries: 3,
        retryDelay: 2000,
        exponentialBackoff: true
      };
      
      if (errorRecovery.shouldRetry(operationId, networkError, retryOptions)) {
        errorRecovery.incrementRetryCount(operationId);
        const retryDelay = errorRecovery.getRetryDelay(operationId, retryOptions);
        
        console.log(`🔄 Retrying video status in ${retryDelay}ms...`);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.getVideoStatus(videoId);
      }
      
      // Reset retry count since we're giving up
      errorRecovery.resetRetryCount(operationId);
      
      // Return a more informative error status
      return {
        status: 'network_error',
        progress: 0,
        detectedObjects: [],
        matchedProducts: [],
      };
    }
  }

  // Wait for video processing to complete
  static async waitForVideoProcessing(
    videoId: string, 
    maxWaitTime: number = 300000,
    onProgress?: (progress: number, status: string) => void
  ): Promise<{ success: boolean; objects?: string[]; products?: any[]; error?: string }> {
    try {
      console.log('⏳ Waiting for video processing to complete...');
      
      const startTime = Date.now();
      const pollInterval = 3000; // Check every 3 seconds (increased for stability)
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;
      
      while (Date.now() - startTime < maxWaitTime) {
        try {
          const status = await this.getVideoStatus(videoId);
          console.log(`📊 Current status: ${status.status}, Progress: ${status.progress}%`);
          
          // Reset error counter on successful request
          consecutiveErrors = 0;
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(status.progress || 0, status.status);
          }
          
          if (status.status === 'completed') {
            console.log('✅ Video processing completed successfully');
            return {
              success: true,
              objects: status.detectedObjects,
              products: status.matchedProducts,
            };
          }
          
          if (status.status === 'error' || status.status === 'network_error') {
            console.log(`❌ Video processing failed with status: ${status.status}`);
            return {
              success: false,
              error: `Video processing failed: ${status.status}`,
            };
          }
          
          // Still processing, wait before next check
          console.log(`⏳ Still processing (${status.progress}%), waiting ${pollInterval}ms...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
        } catch (statusError) {
          consecutiveErrors++;
          console.error(`❌ Status check error (attempt ${consecutiveErrors}):`, statusError);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('❌ Too many consecutive errors, giving up');
            return {
              success: false,
              error: `Network error: ${statusError instanceof Error ? statusError.message : 'Unknown error'}`,
            };
          }
          
          // Wait longer on errors to avoid overwhelming the server
          const errorWaitTime = pollInterval * 2;
          console.log(`⏳ Waiting ${errorWaitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, errorWaitTime));
        }
      }
      
      console.log('⏰ Timeout waiting for video processing');
      return {
        success: false,
        error: 'Video processing timeout',
      };
    } catch (error) {
      console.error('❌ Wait for video processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get complete video analysis results
   */
  static async getVideoAnalysis(videoId: string): Promise<{ success: boolean; analysis?: VideoAnalysis; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/analysis/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          analysis: data.analysis
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error getting video analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get object detections for a video
   */
  static async getObjectDetections(videoId: string): Promise<{ success: boolean; detections?: ObjectDetection[]; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/detections/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          detections: data.detections
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error getting object detections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get product matches for a video
   */
  static async getProductMatches(videoId: string): Promise<{ success: boolean; matches?: ProductMatch[]; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/matches/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          matches: data.matches
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error getting product matches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get pipeline results for a video
   */
  static async getPipelineResults(videoId: string): Promise<{ success: boolean; results?: PipelineResult[]; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/pipeline/results/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          results: data.results
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error getting pipeline results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save user feedback for product matches
   */
  static async saveUserFeedback(
    videoId: string, 
    trackId: number, 
    feedbackType: string, 
    feedbackData?: any
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/user-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            videoId,
            trackId,
            feedbackType,
            feedbackData
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.message
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error saving user feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate user tags
   */
  static async validateUserTags(tags: string[]): Promise<{ success: boolean; validation?: any; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/tags/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ tags }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          validation: data.validation
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error validating user tags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get tag suggestions for a video
   */
  static async getTagSuggestions(videoId: string): Promise<{ success: boolean; suggestions?: any[]; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/tags/suggestions/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          suggestions: data.suggestions
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error getting tag suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced product matching with user tags
   */
  static async matchProductsWithUserTags(
    videoId: string, 
    userTags: string[], 
    options: any = {}
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/tags/match/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            userTags,
            options
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          result: data.result
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error matching products with user tags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update video with user tags
   */
  static async updateVideoTags(
    videoId: string, 
    tags: string[]
  ): Promise<{ success: boolean; tags?: string[]; validation?: any; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/tags/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ tags }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          tags: data.tags,
          validation: data.validation
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error updating video tags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get video tags
   */
  static async getVideoTags(videoId: string): Promise<{ success: boolean; tags?: string[]; error?: string }> {
    try {
      const backendUrl = await getBackendUrl();
      const response = await fetchWithRetry(
        `${backendUrl}/api/videos/tags/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          tags: data.tags
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error('Error getting video tags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getAllVideos(): Promise<{ success: boolean; videos?: any[]; error?: string }> {
    try {
      const response = await fetchWithRetry(getApiEndpoint('/videos'), {}, 10000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get all videos error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getVideoById(videoId: string): Promise<{ success: boolean; video?: any; error?: string }> {
    try {
      const response = await fetchWithRetry(getApiEndpoint(`/videos/${videoId}`), {}, 10000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get video by ID error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getAllProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      const response = await fetchWithRetry(getApiEndpoint('/products'), {}, 10000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get all products error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getProductsByCategory(category: string): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      const response = await fetchWithRetry(getApiEndpoint(`/products/category/${encodeURIComponent(category)}`), {}, 10000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get products by category error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
} 