/**
 * Robust API Service for Lokal Frontend
 * Implements circuit breaker, intelligent retry, and graceful degradation
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ObjectDetectionResponse, ProductMatchResponse, VideoUploadResponse } from '../types';
import { getBackendUrls, getPrimaryBackendUrl } from '../config/env';

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  nextAttempt: number;
  lastFailure: number | null;
}

interface RequestConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  useCircuitBreaker: boolean;
  cacheable: boolean;
  cacheTTL: number;
}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  lastChecked: number;
}

class RobustApiService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private cache: Map<string, CacheItem> = new Map();
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
    lastChecked: 0
  };
  private activeBackendUrl: string | null = null;
  private backendTestResults: Map<string, { latency: number; lastTested: number; failures: number }> = new Map();
  private requestQueue: Array<{ url: string; options: RequestInit; resolve: Function; reject: Function }> = [];
  private isProcessingQueue = false;

  // Configuration
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  private readonly BACKEND_TEST_INTERVAL = 60000; // 1 minute
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor() {
    this.initializeNetworkMonitoring();
    this.startCacheCleanup();
    this.startBackendHealthCheck();
  }

  private initializeNetworkMonitoring() {
    NetInfo.addEventListener((state: any) => {
      const wasConnected = this.networkState.isConnected;
      
      this.networkState = {
        isConnected: state.isConnected || false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        lastChecked: Date.now()
      };

      console.log('📡 Network state changed:', this.networkState);

      // If we just came back online, process queued requests
      if (!wasConnected && this.networkState.isConnected) {
        this.processRequestQueue();
        this.testBackendConnectivity();
      }
    });
  }

  private startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  private startBackendHealthCheck() {
    setInterval(() => {
      if (this.networkState.isConnected) {
        this.testBackendConnectivity();
      }
    }, this.BACKEND_TEST_INTERVAL);
  }

  private cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  private async testBackendConnectivity(): Promise<void> {
    const urls = getBackendUrls();
    const now = Date.now();

    for (const url of urls) {
      try {
        const startTime = Date.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}/api/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (response.ok) {
          this.backendTestResults.set(url, {
            latency,
            lastTested: now,
            failures: 0
          });
          
          // Update active backend if this is better
          if (!this.activeBackendUrl || latency < (this.backendTestResults.get(this.activeBackendUrl)?.latency || Infinity)) {
            this.activeBackendUrl = url;
            console.log(`🎯 Active backend updated to: ${url} (${latency}ms)`);
          }
        } else {
          this.handleBackendFailure(url);
        }
      } catch (error) {
        this.handleBackendFailure(url);
      }
    }
  }

  private handleBackendFailure(url: string) {
    const result = this.backendTestResults.get(url) || { latency: Infinity, lastTested: 0, failures: 0 };
    result.failures++;
    result.lastTested = Date.now();
    this.backendTestResults.set(url, result);

    if (this.activeBackendUrl === url) {
      // Find alternative backend
      const alternatives = Array.from(this.backendTestResults.entries())
        .filter(([altUrl, altResult]) => altUrl !== url && altResult.failures < 3)
        .sort(([, a], [, b]) => a.latency - b.latency);

      if (alternatives.length > 0) {
        this.activeBackendUrl = alternatives[0][0];
        console.log(`🔄 Switched to backup backend: ${this.activeBackendUrl}`);
      } else {
        this.activeBackendUrl = null;
        console.warn('⚠️ No healthy backends available');
      }
    }
  }

  private getCircuitBreakerState(endpoint: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, {
        state: 'CLOSED',
        failureCount: 0,
        nextAttempt: 0,
        lastFailure: null
      });
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  private updateCircuitBreaker(endpoint: string, success: boolean) {
    const breaker = this.getCircuitBreakerState(endpoint);
    
    if (success) {
      breaker.failureCount = 0;
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        console.log(`🔄 Circuit breaker for ${endpoint} reset to CLOSED`);
      }
    } else {
      breaker.failureCount++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
        breaker.state = 'OPEN';
        breaker.nextAttempt = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT;
        console.warn(`⚡ Circuit breaker for ${endpoint} OPENED until ${new Date(breaker.nextAttempt)}`);
      }
    }
  }

  private isCircuitBreakerOpen(endpoint: string): boolean {
    const breaker = this.getCircuitBreakerState(endpoint);
    
    if (breaker.state === 'OPEN') {
      if (Date.now() > breaker.nextAttempt) {
        breaker.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker for ${endpoint} transitioning to HALF_OPEN`);
        return false;
      }
      return true;
    }
    
    return false;
  }

  private generateCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';
    return `${method}:${url}:${body}`;
  }

  private getCachedData(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private setCachedData(key: string, data: any, ttl: number = 300000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async queueRequest(url: string, options: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
        reject(new Error('Request queue full'));
        return;
      }

      this.requestQueue.push({ url, options, resolve, reject });
      console.log(`📥 Request queued. Queue size: ${this.requestQueue.length}`);
    });
  }

  private async processRequestQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`📤 Processing ${this.requestQueue.length} queued requests`);

    while (this.requestQueue.length > 0 && this.networkState.isConnected) {
      const request = this.requestQueue.shift()!;
      
      try {
        const response = await this.executeRequest(request.url, request.options, {
          timeout: 30000,
          retries: 1,
          retryDelay: 1000,
          useCircuitBreaker: false,
          cacheable: false,
          cacheTTL: 0
        });
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  private async executeRequest(url: string, options: RequestInit, config: RequestConfig): Promise<any> {
    const endpoint = new URL(url).pathname;
    
    // Check circuit breaker
    if (config.useCircuitBreaker && this.isCircuitBreakerOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}`);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (config.useCircuitBreaker) {
          this.updateCircuitBreaker(endpoint, true);
        }
        
        return data;

      } catch (error) {
        lastError = error as Error;
        
        if (config.useCircuitBreaker) {
          this.updateCircuitBreaker(endpoint, false);
        }

        if (attempt < config.retries) {
          const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`🔄 Retrying request in ${delay}ms... (attempt ${attempt + 2}/${config.retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config: Partial<RequestConfig> = {}
  ): Promise<T> {
    const fullConfig: RequestConfig = {
      timeout: 30000,
      retries: 2,
      retryDelay: 1000,
      useCircuitBreaker: true,
      cacheable: false,
      cacheTTL: 300000,
      ...config
    };

    // Get best available backend
    if (!this.activeBackendUrl) {
      await this.testBackendConnectivity();
      if (!this.activeBackendUrl) {
        throw new Error('No backend servers available');
      }
    }

    const url = `${this.activeBackendUrl}${endpoint}`;
    const cacheKey = this.generateCacheKey(url, options);

    // Check cache for GET requests
    if (fullConfig.cacheable && (!options.method || options.method === 'GET')) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`💾 Cache hit for ${endpoint}`);
        return cachedData;
      }
    }

    // Check network connectivity
    if (!this.networkState.isConnected) {
      // Try to return cached data even if expired
      if (fullConfig.cacheable) {
        const item = this.cache.get(cacheKey);
        if (item) {
          console.log(`📴 Offline: returning stale cache for ${endpoint}`);
          return item.data;
        }
      }

      // Queue request for when network returns
      return this.queueRequest(url, options);
    }

    try {
      const data = await this.executeRequest(url, options, fullConfig);

      // Cache successful GET requests
      if (fullConfig.cacheable && (!options.method || options.method === 'GET')) {
        this.setCachedData(cacheKey, data, fullConfig.cacheTTL);
      }

      return data;

    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error);

      // Try fallback backend if available
      if (this.activeBackendUrl) {
        const fallbackUrls = getBackendUrls().filter(url => url !== this.activeBackendUrl);
        
        for (const fallbackUrl of fallbackUrls) {
          try {
            console.log(`🔄 Trying fallback backend: ${fallbackUrl}`);
            const fallbackResponse = await this.executeRequest(
              `${fallbackUrl}${endpoint}`,
              options,
              { ...fullConfig, retries: 1, useCircuitBreaker: false }
            );
            
            this.activeBackendUrl = fallbackUrl;
            console.log(`✅ Fallback successful, switched to: ${fallbackUrl}`);
            
            return fallbackResponse;
          } catch (fallbackError) {
            console.warn(`❌ Fallback failed for ${fallbackUrl}:`, fallbackError);
          }
        }
      }

      throw error;
    }
  }

  // Public API methods
  async uploadVideoFile(
    videoUri: string,
    title: string,
    description?: string,
    manualProductName?: string,
    affiliateLink?: string
  ): Promise<VideoUploadResponse> {
    try {
      const formData = new FormData();
      
      // Create file object
      const fileInfo = this.getFileInfo(videoUri);
      const fileData = {
        uri: videoUri,
        type: fileInfo.mimeType,
        name: fileInfo.name,
      };

      formData.append('video', fileData as any);
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (manualProductName) formData.append('manualProductName', manualProductName);
      if (affiliateLink) formData.append('affiliateLink', affiliateLink);

      return await this.makeRequest<VideoUploadResponse>('/api/videos/upload-file', {
        method: 'POST',
        body: formData,
      }, {
        timeout: 180000, // 3 minutes for uploads
        retries: 1,
        useCircuitBreaker: false // Uploads are special
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async detectObjects(videoId: string): Promise<ObjectDetectionResponse> {
    try {
      return await this.makeRequest<ObjectDetectionResponse>(`/api/videos/detect/${videoId}`, {
        method: 'GET',
      }, {
        timeout: 300000, // 5 minutes for detection
        retries: 2,
        cacheable: true,
        cacheTTL: 600000 // 10 minutes
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Detection failed',
        objects: [],
      };
    }
  }

  async matchProducts(objects: string[]): Promise<ProductMatchResponse> {
    try {
      return await this.makeRequest<ProductMatchResponse>('/api/products/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects }),
      }, {
        timeout: 60000, // 1 minute
        retries: 2,
        cacheable: true,
        cacheTTL: 1800000 // 30 minutes
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Product matching failed',
        products: [],
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<{
    status: string;
    progress?: number;
    detectedObjects?: string[];
    matchedProducts?: any[];
  }> {
    try {
      const response = await this.makeRequest(`/api/videos/status/${videoId}`, {
        method: 'GET',
      }, {
        timeout: 15000,
        retries: 3,
        cacheable: false // Status should be real-time
      });

      return {
        status: response.status || 'unknown',
        progress: response.progress || 0,
        detectedObjects: response.detectedObjects || response.objects || [],
        matchedProducts: response.matchedProducts || response.products || [],
      };
    } catch (error) {
      console.error('❌ Video status check failed:', error);
      return {
        status: 'error',
        progress: 0,
        detectedObjects: [],
        matchedProducts: [],
      };
    }
  }

  async checkNetworkStatus(): Promise<{
    connected: boolean;
    latency?: number;
    url?: string;
  }> {
    if (!this.networkState.isConnected) {
      return { connected: false };
    }

    if (this.activeBackendUrl) {
      const result = this.backendTestResults.get(this.activeBackendUrl);
      if (result && result.failures === 0) {
        return {
          connected: true,
          latency: result.latency,
          url: this.activeBackendUrl
        };
      }
    }

    await this.testBackendConnectivity();
    
    if (this.activeBackendUrl) {
      const result = this.backendTestResults.get(this.activeBackendUrl);
      return {
        connected: true,
        latency: result?.latency,
        url: this.activeBackendUrl
      };
    }

    return { connected: false };
  }

  private getFileInfo(uri: string): { name: string; mimeType: string } {
    const filename = uri.split('/').pop() || 'video.mp4';
    const extension = filename.split('.').pop()?.toLowerCase();
    
    let mimeType = 'video/mp4';
    switch (extension) {
      case 'mov': mimeType = 'video/quicktime'; break;
      case 'avi': mimeType = 'video/x-msvideo'; break;
      case 'mkv': mimeType = 'video/x-matroska'; break;
      case 'webm': mimeType = 'video/webm'; break;
    }
    
    return { name: filename, mimeType };
  }

  async uploadVideo(
    videoUrl: string,
    title: string,
    description?: string,
    manualProductName?: string,
    affiliateLink?: string
  ): Promise<VideoUploadResponse> {
    try {
      return await this.makeRequest<VideoUploadResponse>('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          title,
          description,
          manualProductName: manualProductName || '',
          affiliateLink: affiliateLink || '',
        }),
      }, {
        timeout: 180000, // 3 minutes for uploads
        retries: 1,
        useCircuitBreaker: false
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async getAllVideos(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/api/videos', {
        method: 'GET',
      }, {
        timeout: 30000,
        retries: 2,
        cacheable: true,
        cacheTTL: 300000 // 5 minutes
      });
      
      return response.videos || response || [];
    } catch (error) {
      console.error('❌ Get all videos error:', error);
      return [];
    }
  }

  // Status and debugging methods
  getHealthStatus() {
    return {
      networkState: this.networkState,
      activeBackendLatency: this.activeBackendUrl ? this.backendTestResults.get(this.activeBackendUrl)?.latency : null,
      isHealthy: this.activeBackendUrl !== null && this.networkState.isConnected
    };
  }

  getPerformanceMetrics() {
    return {
      cacheHitRate: this.cache.size > 0 ? 0.8 : 0, // Placeholder
      averageResponseTime: this.activeBackendUrl ? this.backendTestResults.get(this.activeBackendUrl)?.latency || 0 : 0,
      activeConnections: this.requestQueue.length,
      circuitBreakerStates: Object.fromEntries(this.circuitBreakers)
    };
  }

  getServiceStatus() {
    return {
      networkState: this.networkState,
      activeBackend: this.activeBackendUrl,
      backendHealth: Object.fromEntries(this.backendTestResults),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.length
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  resetCircuitBreakers() {
    this.circuitBreakers.clear();
    console.log('⚡ Circuit breakers reset');
  }
}

// Export singleton instance
export const robustApiService = new RobustApiService();
export default robustApiService;