import { ObjectDetectionResponse, ProductMatchResponse, VideoUploadResponse } from '../types';
import { getApiEndpoint, ENV } from '../config/env';

// Helper function to create a fetch request with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 10000) => {
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
    throw error;
  }
};

export class ApiService {
  static async uploadVideo(videoUrl: string, title: string, description?: string): Promise<VideoUploadResponse> {
    try {
      const response = await fetchWithTimeout(getApiEndpoint('/videos/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          title,
          description,
        }),
      }, 30000); // 30 second timeout for upload

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload video error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async uploadVideoFile(videoUri: string, title: string, description?: string): Promise<VideoUploadResponse> {
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Get file info
      const fileInfo = await this.getFileInfo(videoUri);
      
      // Append file to form data
      formData.append('video', {
        uri: videoUri,
        type: fileInfo.mimeType,
        name: fileInfo.name,
      } as any);
      
      // Append other data
      formData.append('title', title);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetchWithTimeout(getApiEndpoint('/videos/upload-file'), {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }, ENV.UPLOAD_TIMEOUT); // Use configured timeout for file upload

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload video file error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  private static async getFileInfo(uri: string): Promise<{ name: string; mimeType: string }> {
    // Extract filename from URI
    const filename = uri.split('/').pop() || 'video.mp4';
    
    // Determine MIME type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
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
    }
    
    return { name: filename, mimeType };
  }

  static async detectObjects(videoId: string): Promise<ObjectDetectionResponse> {
    try {
      const endpoint = getApiEndpoint(`/videos/${videoId}/detect-objects`);
      console.log('🔍 Calling detect objects endpoint:', endpoint);
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, ENV.DETECTION_TIMEOUT); // Use configured timeout for object detection

      console.log('🔍 Detect objects response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Detect objects response data:', data);
      return data;
    } catch (error) {
      console.error('Detect objects error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async matchProducts(objects: string[]): Promise<ProductMatchResponse> {
    try {
      const endpoint = getApiEndpoint('/products/match');
      console.log('🛍️ Calling match products endpoint:', endpoint);
      console.log('🛍️ Objects to match:', objects);
      
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objects }),
      }, 15000); // 15 second timeout for product matching

      console.log('🛍️ Match products response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🛍️ Match products response data:', data);
      return data;
    } catch (error) {
      console.error('Match products error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getVideoStatus(videoId: string): Promise<{ status: string; progress?: number }> {
    try {
      const response = await fetchWithTimeout(getApiEndpoint(`/videos/${videoId}/status`), {}, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get video status error:', error);
      return { status: 'error' };
    }
  }

  static async getAllVideos(): Promise<{ success: boolean; videos?: any[]; error?: string }> {
    try {
      const response = await fetchWithTimeout(getApiEndpoint('/videos'), {}, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get all videos error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getVideoById(videoId: string): Promise<{ success: boolean; video?: any; error?: string }> {
    try {
      const response = await fetchWithTimeout(getApiEndpoint(`/videos/${videoId}`), {}, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get video by ID error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getAllProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      const response = await fetchWithTimeout(getApiEndpoint('/products'), {}, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get all products error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  static async getProductsByCategory(category: string): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      const response = await fetchWithTimeout(getApiEndpoint(`/products/category/${encodeURIComponent(category)}`), {}, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get products by category error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
} 