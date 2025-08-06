/**
 * Health Service for Backend Monitoring
 * Fetches health data from enhanced health endpoints
 */

import { getBackendUrls, getPrimaryBackendUrl } from '../config/env';

interface HealthEndpointResponse {
  success: boolean;
  health?: any;
  error?: string;
}

interface BackendHealthStatus {
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  data?: any;
  error?: string;
}

class HealthService {
  private activeBackendUrl: string | null = null;
  private healthCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10000; // 10 seconds

  /**
   * Test backend connectivity and get health data
   */
  async testBackendHealth(baseUrl: string): Promise<BackendHealthStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          url: baseUrl,
          status: 'healthy',
          responseTime,
          data
        };
      } else {
        return {
          url: baseUrl,
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        url: baseUrl,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed health information from the active backend
   */
  async getDetailedHealth(): Promise<HealthEndpointResponse> {
    const backendUrl = await this.getActiveBackend();
    
    if (!backendUrl) {
      return {
        success: false,
        error: 'No healthy backend available'
      };
    }

    // Check cache first
    const cacheKey = `detailed-${backendUrl}`;
    const cached = this.healthCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        success: true,
        health: cached.data
      };
    }

    try {
      const response = await fetch(`${backendUrl}/api/health/detailed`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the result
        this.healthCache.set(cacheKey, {
          data: data.health || data,
          timestamp: Date.now()
        });
        
        return {
          success: true,
          health: data.health || data
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }

  /**
   * Get database health information
   */
  async getDatabaseHealth(): Promise<HealthEndpointResponse> {
    const backendUrl = await this.getActiveBackend();
    
    if (!backendUrl) {
      return {
        success: false,
        error: 'No healthy backend available'
      };
    }

    try {
      const response = await fetch(`${backendUrl}/api/health/database`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          health: data.health || data
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }

  /**
   * Get connection status and performance metrics
   */
  async getConnectionHealth(): Promise<HealthEndpointResponse> {
    const backendUrl = await this.getActiveBackend();
    
    if (!backendUrl) {
      return {
        success: false,
        error: 'No healthy backend available'
      };
    }

    try {
      const response = await fetch(`${backendUrl}/api/health/connection`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          health: data
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }

  /**
   * Get memory usage and monitoring status
   */
  async getMemoryHealth(): Promise<HealthEndpointResponse> {
    const backendUrl = await this.getActiveBackend();
    
    if (!backendUrl) {
      return {
        success: false,
        error: 'No healthy backend available'
      };
    }

    try {
      const response = await fetch(`${backendUrl}/api/health/memory`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          health: data
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }

  /**
   * Test all available backends and find the fastest healthy one
   */
  async getActiveBackend(): Promise<string | null> {
    if (this.activeBackendUrl) {
      // Test if cached backend is still healthy
      const health = await this.testBackendHealth(this.activeBackendUrl);
      if (health.status === 'healthy') {
        return this.activeBackendUrl;
      }
    }

    // Test all available backends
    const backends = getBackendUrls();
    const healthTests = await Promise.all(
      backends.map(url => this.testBackendHealth(url))
    );

    // Find the fastest healthy backend
    const healthyBackends = healthTests
      .filter(result => result.status === 'healthy')
      .sort((a, b) => a.responseTime - b.responseTime);

    if (healthyBackends.length > 0) {
      this.activeBackendUrl = healthyBackends[0].url;
      return this.activeBackendUrl;
    }

    // Fallback to primary backend
    const fallback = getPrimaryBackendUrl();
    this.activeBackendUrl = fallback;
    return fallback;
  }

  /**
   * Get comprehensive health status from all available endpoints
   */
  async getComprehensiveHealth() {
    const [basic, detailed, database, connection, memory] = await Promise.allSettled([
      this.getActiveBackend().then(url => url ? this.testBackendHealth(url) : null),
      this.getDetailedHealth(),
      this.getDatabaseHealth(),
      this.getConnectionHealth(),
      this.getMemoryHealth()
    ]);

    return {
      basic: basic.status === 'fulfilled' ? basic.value : null,
      detailed: detailed.status === 'fulfilled' ? detailed.value : null,
      database: database.status === 'fulfilled' ? database.value : null,
      connection: connection.status === 'fulfilled' ? connection.value : null,
      memory: memory.status === 'fulfilled' ? memory.value : null,
      activeBackend: this.activeBackendUrl,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear health cache
   */
  clearCache() {
    this.healthCache.clear();
    this.activeBackendUrl = null;
  }
}

// Export singleton instance
export const healthService = new HealthService();

// Export class for custom instances
export { HealthService };