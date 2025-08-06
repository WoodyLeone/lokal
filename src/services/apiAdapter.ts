/**
 * API Adapter for Gradual Migration to Robust API Service
 * 
 * This adapter provides a unified interface for API calls while gradually
 * migrating from the basic ApiService to the RobustApiService.
 */

import { ApiService } from './api';
import { robustApiService } from './robustApiService';
import { ObjectDetectionResponse, ProductMatchResponse, VideoUploadResponse } from '../types';

interface AdapterConfig {
  useRobustService: boolean;
  fallbackToBasic: boolean;
  debugMode: boolean;
}

class ApiAdapter {
  private robustService: typeof robustApiService;
  private config: AdapterConfig;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.robustService = robustApiService;
    this.config = {
      useRobustService: true,
      fallbackToBasic: true,
      debugMode: false,
      ...config
    };
  }

  /**
   * Upload video with circuit breaker and retry logic
   */
  async uploadVideo(
    videoUrl: string, 
    title: string, 
    description?: string, 
    manualProductName?: string, 
    affiliateLink?: string
  ): Promise<VideoUploadResponse> {
    if (this.config.debugMode) {
      console.log('🔄 ApiAdapter: uploadVideo request');
    }

    if (this.config.useRobustService) {
      try {
        return await this.robustService.uploadVideo(videoUrl, title, description, manualProductName, affiliateLink);
      } catch (error) {
        if (this.config.fallbackToBasic) {
          console.warn('⚠️ Robust API failed, falling back to basic API:', error);
          return await ApiService.uploadVideo(videoUrl, title, description, manualProductName, affiliateLink);
        }
        throw error;
      }
    } else {
      return await ApiService.uploadVideo(videoUrl, title, description, manualProductName, affiliateLink);
    }
  }

  /**
   * Upload video file with circuit breaker and retry logic
   */
  async uploadVideoFile(
    videoUri: string, 
    title: string, 
    description?: string, 
    manualProductName?: string
  ): Promise<VideoUploadResponse> {
    if (this.config.debugMode) {
      console.log('🔄 ApiAdapter: uploadVideoFile request');
    }

    if (this.config.useRobustService) {
      try {
        return await this.robustService.uploadVideoFile(videoUri, title, description, manualProductName);
      } catch (error) {
        if (this.config.fallbackToBasic) {
          console.warn('⚠️ Robust API failed, falling back to basic API:', error);
          return await ApiService.uploadVideoFile(videoUri, title, description, manualProductName);
        }
        throw error;
      }
    } else {
      return await ApiService.uploadVideoFile(videoUri, title, description, manualProductName);
    }
  }

  /**
   * Detect objects with circuit breaker and retry logic
   */
  async detectObjects(videoId: string): Promise<ObjectDetectionResponse> {
    if (this.config.debugMode) {
      console.log('🔄 ApiAdapter: detectObjects request');
    }

    if (this.config.useRobustService) {
      try {
        return await this.robustService.detectObjects(videoId);
      } catch (error) {
        if (this.config.fallbackToBasic) {
          console.warn('⚠️ Robust API failed, falling back to basic API:', error);
          return await ApiService.detectObjects(videoId);
        }
        throw error;
      }
    } else {
      return await ApiService.detectObjects(videoId);
    }
  }

  /**
   * Match products with circuit breaker and retry logic
   */
  async matchProducts(objects: string[]): Promise<ProductMatchResponse> {
    if (this.config.debugMode) {
      console.log('🔄 ApiAdapter: matchProducts request');
    }

    if (this.config.useRobustService) {
      try {
        return await this.robustService.matchProducts(objects);
      } catch (error) {
        if (this.config.fallbackToBasic) {
          console.warn('⚠️ Robust API failed, falling back to basic API:', error);
          return await ApiService.matchProducts(objects);
        }
        throw error;
      }
    } else {
      return await ApiService.matchProducts(objects);
    }
  }

  /**
   * Get video status with circuit breaker and retry logic
   */
  async getVideoStatus(videoId: string): Promise<{ status: string; progress?: number; detectedObjects?: string[]; matchedProducts?: any[] }> {
    if (this.config.debugMode) {
      console.log('🔄 ApiAdapter: getVideoStatus request');
    }

    if (this.config.useRobustService) {
      try {
        return await this.robustService.getVideoStatus(videoId);
      } catch (error) {
        if (this.config.fallbackToBasic) {
          console.warn('⚠️ Robust API failed, falling back to basic API:', error);
          return await ApiService.getVideoStatus(videoId);
        }
        throw error;
      }
    } else {
      return await ApiService.getVideoStatus(videoId);
    }
  }

  /**
   * Get all videos with circuit breaker and retry logic
   */
  async getAllVideos(): Promise<any[]> {
    if (this.config.debugMode) {
      console.log('🔄 ApiAdapter: getAllVideos request');
    }

    if (this.config.useRobustService) {
      try {
        return await this.robustService.getAllVideos();
      } catch (error) {
        if (this.config.fallbackToBasic) {
          console.warn('⚠️ Robust API failed, falling back to basic API:', error);
          return await ApiService.getAllVideos();
        }
        throw error;
      }
    } else {
      return await ApiService.getAllVideos();
    }
  }

  /**
   * Update adapter configuration
   */
  updateConfig(newConfig: Partial<AdapterConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.config.debugMode) {
      console.log('🔧 ApiAdapter config updated:', this.config);
    }
  }

  /**
   * Get network and service health status
   */
  getHealthStatus() {
    return this.robustService.getHealthStatus();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.robustService.getPerformanceMetrics();
  }
}

// Create and export singleton instance
export const apiAdapter = new ApiAdapter({
  useRobustService: true,
  fallbackToBasic: true,
  debugMode: typeof __DEV__ !== 'undefined' ? __DEV__ : false
});

// Export class for custom instances
export { ApiAdapter };

// Legacy exports for backward compatibility
export const checkNetworkStatus = async () => {
  const health = apiAdapter.getHealthStatus();
  return {
    connected: health.networkState?.isConnected || false,
    latency: health.activeBackendLatency || 0
  };
};