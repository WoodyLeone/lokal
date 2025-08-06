/**
 * Connection Manager for Lokal React Native App
 * Handles API connections with caching, retry logic, and offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface ConnectionConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTTL: number;
  enableOfflineMode: boolean;
}

export interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isOnline: boolean;
  lastChecked: number;
}

class ConnectionManager {
  private config: ConnectionConfig;
  private cache: Map<string, CacheItem> = new Map();
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
    isOnline: false,
    lastChecked: 0
  };
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private retryQueue: Array<{ url: string; options: RequestOptions; attempts: number }> = [];
  private isProcessingRetryQueue = false;

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:3001/api',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour
      enableOfflineMode: config.enableOfflineMode !== false
    };

    this.initializeNetworkMonitoring();
    this.loadCacheFromStorage();
    this.startCacheCleanup();
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring() {
    NetInfo.addEventListener((state: any) => {
      const wasOnline = this.connectionStatus.isOnline;
      this.connectionStatus = {
        isConnected: state.isConnected || false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOnline: (state.isConnected && state.isInternetReachable) || false,
        lastChecked: Date.now()
      };

      // If we just came back online, process retry queue
      if (!wasOnline && this.connectionStatus.isOnline) {
        this.processRetryQueue();
      }

      console.log('Network status changed:', this.connectionStatus);
    });
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadCacheFromStorage() {
    try {
      const cachedData = await AsyncStorage.getItem('lokal_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(parsed));
        console.log(`Loaded ${this.cache.size} cached items`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  private async saveCacheToStorage() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('lokal_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up expired cache entries
   */
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
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Get cached data
   */
  private getCachedData(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any, ttl?: number) {
    const item: CacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL
    };

    this.cache.set(key, item);
    this.saveCacheToStorage();
  }

  /**
   * Generate cache key from URL and options
   */
  private generateCacheKey(url: string, options: RequestOptions): string {
    const method = options.method || 'GET';
    const bodyHash = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const cacheKey = this.generateCacheKey(url, options);
    const method = options.method || 'GET';
    const shouldCache = options.cache !== false && method === 'GET';
    const shouldRetry = options.retry !== false;
    const retryAttempts = options.retryAttempts || this.config.retryAttempts;
    const timeout = options.timeout || this.config.timeout;

    // Check cache first for GET requests
    if (shouldCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for ${url}`);
        return cachedData;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`Request already pending for ${url}`);
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check network connectivity
    if (!this.connectionStatus.isOnline) {
      if (this.config.enableOfflineMode) {
        // Return cached data if available, even if expired
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) {
          console.log(`Offline mode: returning cached data for ${url}`);
          return cachedData;
        }

        // Queue request for retry when online
        if (shouldRetry) {
          this.addToRetryQueue(url, options);
        }

        throw new Error('No internet connection and no cached data available');
      } else {
        throw new Error('No internet connection');
      }
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(url, options, timeout, retryAttempts);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache successful GET requests
      if (shouldCache && result) {
        this.setCachedData(cacheKey, result, options.cacheTTL);
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: RequestOptions,
    timeout: number,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, options, timeout);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Request attempt ${attempt + 1} failed for ${url}:`, error);

        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Make actual HTTP request
   */
  private async makeRequest<T>(url: string, options: RequestOptions, timeout: number): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers
    };

    if (options.body && options.method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Determine if request should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    // Don't retry on client errors (4xx) except 408, 429
    if (error.message.includes('HTTP 4')) {
      const statusCode = parseInt(error.message.match(/HTTP (\d+)/)?.[1] || '0');
      return ![408, 429].includes(statusCode);
    }

    // Don't retry on network errors that indicate client issues
    return error.name === 'AbortError' || error.message.includes('Network request failed');
  }

  /**
   * Add request to retry queue
   */
  private addToRetryQueue(url: string, options: RequestOptions) {
    this.retryQueue.push({
      url,
      options,
      attempts: 0
    });

    console.log(`Added ${url} to retry queue. Queue size: ${this.retryQueue.length}`);
  }

  /**
   * Process retry queue when back online
   */
  private async processRetryQueue() {
    if (this.isProcessingRetryQueue || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessingRetryQueue = true;
    console.log(`Processing retry queue with ${this.retryQueue.length} items`);

    const maxRetries = 3;
    const itemsToProcess = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of itemsToProcess) {
      try {
        if (item.attempts < maxRetries) {
          await this.request(item.url, {
            ...item.options,
            retry: false // Prevent infinite retry loops
          });
          console.log(`Successfully processed queued request: ${item.url}`);
        }
      } catch (error) {
        console.warn(`Failed to process queued request: ${item.url}`, error);
        item.attempts++;
        if (item.attempts < maxRetries) {
          this.retryQueue.push(item);
        }
      }
    }

    this.isProcessingRetryQueue = false;

    if (this.retryQueue.length > 0) {
      console.log(`${this.retryQueue.length} items remain in retry queue`);
    }
  }

  /**
   * Utility function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.connectionStatus.isOnline;
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('lokal_cache');
    console.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Convenience methods for common HTTP operations
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  async put<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

export default connectionManager; 