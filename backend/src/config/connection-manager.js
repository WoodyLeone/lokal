/**
 * Robust Connection Manager for Lokal Backend
 * Handles all connection types with circuit breaker, health monitoring, and graceful degradation
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const winston = require('winston');
const EventEmitter = require('events');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'connection-manager' },
  transports: [
    new winston.transports.File({ filename: './logs/connections.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Circuit Breaker for handling failing connections
 */
class CircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastFailure: null,
      lastSuccess: null
    };
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker OPEN for ${this.name}`);
      }
      this.state = 'HALF_OPEN';
    }

    this.stats.totalRequests++;
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.stats.successfulRequests++;
    this.stats.lastSuccess = new Date();
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info(`Circuit breaker ${this.name} reset to CLOSED`);
      this.emit('reset');
    }
  }

  onFailure(error) {
    this.stats.failedRequests++;
    this.stats.lastFailure = new Date();
    this.failureCount++;
    
    logger.warn(`Circuit breaker ${this.name} failure ${this.failureCount}/${this.failureThreshold}:`, error.message);
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(`Circuit breaker ${this.name} OPENED until ${new Date(this.nextAttempt)}`);
      this.emit('open', error);
    }
  }

  getStats() {
    return {
      ...this.stats,
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt
    };
  }
}

/**
 * Connection Health Monitor
 */
class HealthMonitor extends EventEmitter {
  constructor() {
    super();
    this.checks = new Map();
    this.healthStatus = new Map();
    this.checkInterval = 30000; // 30 seconds
    this.isMonitoring = false;
  }

  addHealthCheck(name, checkFunction, threshold = 3) {
    this.checks.set(name, {
      check: checkFunction,
      threshold,
      consecutive_failures: 0,
      last_check: null,
      last_success: null,
      last_failure: null
    });
    
    this.healthStatus.set(name, 'unknown');
  }

  async performHealthCheck(name) {
    const healthCheck = this.checks.get(name);
    if (!healthCheck) return false;

    try {
      const result = await healthCheck.check();
      healthCheck.consecutive_failures = 0;
      healthCheck.last_check = new Date();
      healthCheck.last_success = new Date();
      
      if (this.healthStatus.get(name) !== 'healthy') {
        this.healthStatus.set(name, 'healthy');
        this.emit('health_recovered', name);
        logger.info(`Health check ${name} recovered`);
      }
      
      return true;
    } catch (error) {
      healthCheck.consecutive_failures++;
      healthCheck.last_check = new Date();
      healthCheck.last_failure = new Date();
      
      logger.warn(`Health check ${name} failed (${healthCheck.consecutive_failures}/${healthCheck.threshold}):`, error.message);
      
      if (healthCheck.consecutive_failures >= healthCheck.threshold) {
        if (this.healthStatus.get(name) !== 'unhealthy') {
          this.healthStatus.set(name, 'unhealthy');
          this.emit('health_degraded', name, error);
          logger.error(`Health check ${name} marked as unhealthy`);
        }
      }
      
      return false;
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      for (const [name] of this.checks) {
        await this.performHealthCheck(name);
      }
    }, this.checkInterval);
    
    logger.info('Health monitoring started');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring = false;
      logger.info('Health monitoring stopped');
    }
  }

  getHealthStatus() {
    const status = {};
    for (const [name, health] of this.healthStatus) {
      const check = this.checks.get(name);
      status[name] = {
        status: health,
        consecutive_failures: check.consecutive_failures,
        last_check: check.last_check,
        last_success: check.last_success,
        last_failure: check.last_failure
      };
    }
    return status;
  }
}

/**
 * Robust Connection Manager
 */
class RobustConnectionManager extends EventEmitter {
  constructor() {
    super();
    
    // Connection instances
    this.pgPool = null;
    this.redis = null;
    this.cache = new Map();
    
    // Circuit breakers
    this.pgCircuitBreaker = new CircuitBreaker('PostgreSQL', {
      failureThreshold: 3,
      resetTimeout: 30000
    });
    
    this.redisCircuitBreaker = new CircuitBreaker('Redis', {
      failureThreshold: 5,
      resetTimeout: 15000
    });
    
    // Health monitor
    this.healthMonitor = new HealthMonitor();
    
    // Connection state
    this.isInitialized = false;
    this.connectionState = {
      postgresql: 'disconnected',
      redis: 'disconnected',
      overall: 'disconnected'
    };
    
    // Configuration
    this.config = {
      postgresql: {
        max: 15, // Reduced from 20 for stability
        idleTimeoutMillis: 60000, // Increased from 30s
        connectionTimeoutMillis: 10000, // Increased from 2s
        maxUses: 5000, // Reduced from 7500
        acquireTimeoutMillis: 30000, // New: timeout for acquiring connection
        createTimeoutMillis: 30000, // New: timeout for creating connection
        reapIntervalMillis: 1000, // New: how often to check for idle clients
        createRetryIntervalMillis: 2000 // New: retry interval for failed connections
      },
      redis: {
        connectTimeout: 15000, // Increased from default
        commandTimeout: 10000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4, // Force IPv4
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxLoadingTimeout: 5000
      }
    };
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Circuit breaker events
    this.pgCircuitBreaker.on('open', () => {
      this.connectionState.postgresql = 'circuit_open';
      this.updateOverallState();
      this.emit('postgresql_circuit_open');
    });
    
    this.pgCircuitBreaker.on('reset', () => {
      this.connectionState.postgresql = 'connected';
      this.updateOverallState();
      this.emit('postgresql_circuit_reset');
    });
    
    this.redisCircuitBreaker.on('open', () => {
      this.connectionState.redis = 'circuit_open';
      this.updateOverallState();
      this.emit('redis_circuit_open');
    });
    
    this.redisCircuitBreaker.on('reset', () => {
      this.connectionState.redis = 'connected';
      this.updateOverallState();
      this.emit('redis_circuit_reset');
    });
    
    // Health monitor events
    this.healthMonitor.on('health_degraded', (name, error) => {
      logger.error(`Service ${name} health degraded:`, error.message);
      this.emit('service_degraded', name, error);
    });
    
    this.healthMonitor.on('health_recovered', (name) => {
      logger.info(`Service ${name} health recovered`);
      this.emit('service_recovered', name);
    });
  }

  async initialize() {
    if (this.isInitialized) {
      logger.warn('Connection manager already initialized');
      return true;
    }

    logger.info('🚀 Initializing Robust Connection Manager...');
    
    try {
      // Initialize PostgreSQL
      const pgSuccess = await this.initializePostgreSQL();
      
      // Initialize Redis
      const redisSuccess = await this.initializeRedis();
      
      // Setup health checks
      this.setupHealthChecks();
      
      // Start health monitoring
      this.healthMonitor.startMonitoring();
      
      this.isInitialized = true;
      this.updateOverallState();
      
      logger.info('✅ Robust Connection Manager initialized');
      logger.info('📊 Connection Status:', this.getConnectionSummary());
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize connection manager:', error);
      return false;
    }
  }

  async initializePostgreSQL() {
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      if (!databaseUrl) {
        logger.warn('DATABASE_URL not configured, skipping PostgreSQL');
        this.connectionState.postgresql = 'not_configured';
        return false;
      }

      logger.info('🐘 Connecting to PostgreSQL...');
      
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        ...this.config.postgresql
      });

      // Enhanced event handling
      this.pgPool.on('connect', (client) => {
        logger.debug('PostgreSQL client connected');
        client.on('error', (err) => {
          logger.error('PostgreSQL client error:', err);
        });
      });

      this.pgPool.on('acquire', () => {
        logger.debug('PostgreSQL client acquired from pool');
      });

      this.pgPool.on('remove', () => {
        logger.debug('PostgreSQL client removed from pool');
      });

      this.pgPool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
        this.connectionState.postgresql = 'error';
        this.updateOverallState();
      });

      // Test connection
      await this.pgCircuitBreaker.execute(async () => {
        const client = await this.pgPool.connect();
        try {
          await client.query('SELECT NOW() as server_time, version() as server_version');
          logger.info('✅ PostgreSQL connection successful');
        } finally {
          client.release();
        }
      });
      
      this.connectionState.postgresql = 'connected';
      return true;

    } catch (error) {
      logger.error('❌ PostgreSQL initialization failed:', error);
      this.connectionState.postgresql = 'failed';
      return false;
    }
  }

  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        logger.warn('REDIS_URL not configured, skipping Redis');
        this.connectionState.redis = 'not_configured';
        return false;
      }

      logger.info('🔴 Connecting to Redis...');
      
      this.redis = new Redis(redisUrl, this.config.redis);

      // Enhanced event handling
      this.redis.on('connect', () => {
        logger.info('Redis connected');
        this.connectionState.redis = 'connected';
        this.updateOverallState();
      });

      this.redis.on('ready', () => {
        logger.info('Redis ready');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.connectionState.redis = 'error';
        this.updateOverallState();
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.connectionState.redis = 'disconnected';
        this.updateOverallState();
      });

      this.redis.on('reconnecting', (delay) => {
        logger.info(`Redis reconnecting in ${delay}ms`);
        this.connectionState.redis = 'reconnecting';
        this.updateOverallState();
      });

      this.redis.on('end', () => {
        logger.warn('Redis connection ended');
        this.connectionState.redis = 'disconnected';
        this.updateOverallState();
      });

      // Test connection
      await this.redisCircuitBreaker.execute(async () => {
        await this.redis.ping();
        logger.info('✅ Redis connection successful');
      });
      
      return true;

    } catch (error) {
      logger.error('❌ Redis initialization failed:', error);
      this.connectionState.redis = 'failed';
      return false;
    }
  }

  setupHealthChecks() {
    // PostgreSQL health check
    if (this.pgPool) {
      this.healthMonitor.addHealthCheck('postgresql', async () => {
        const client = await this.pgPool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      }, 3);
    }

    // Redis health check
    if (this.redis) {
      this.healthMonitor.addHealthCheck('redis', async () => {
        await this.redis.ping();
      }, 5);
    }
  }

  updateOverallState() {
    const states = Object.values(this.connectionState);
    
    if (states.includes('connected')) {
      this.connectionState.overall = 'connected';
    } else if (states.includes('circuit_open') || states.includes('error')) {
      this.connectionState.overall = 'degraded';
    } else {
      this.connectionState.overall = 'disconnected';
    }
    
    this.emit('connection_state_changed', this.connectionState);
  }

  // Enhanced query method with circuit breaker
  async query(text, params = []) {
    if (!this.pgPool || this.connectionState.postgresql !== 'connected') {
      logger.warn('PostgreSQL not available for query');
      throw new Error('Database not available');
    }

    return await this.pgCircuitBreaker.execute(async () => {
      const start = Date.now();
      const client = await this.pgPool.connect();
      
      try {
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        
        if (duration > 5000) {
          logger.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
        }
        
        return result;
      } finally {
        client.release();
      }
    });
  }

  // Enhanced Redis operations
  async redisGet(key) {
    if (!this.redis || this.connectionState.redis !== 'connected') {
      return null;
    }

    return await this.redisCircuitBreaker.execute(async () => {
      return await this.redis.get(key);
    });
  }

  async redisSet(key, value, ttl = null) {
    if (!this.redis || this.connectionState.redis !== 'connected') {
      return false;
    }

    return await this.redisCircuitBreaker.execute(async () => {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    });
  }

  // Graceful degradation for caching
  async cacheGet(key) {
    try {
      // Try Redis first
      const redisValue = await this.redisGet(key);
      if (redisValue !== null) {
        return JSON.parse(redisValue);
      }
    } catch (error) {
      logger.warn('Redis cache get failed, using memory cache:', error.message);
    }

    // Fallback to memory cache
    return this.cache.get(key) || null;
  }

  async cacheSet(key, value, ttl = 3600) {
    const serialized = JSON.stringify(value);
    
    try {
      // Try Redis first
      await this.redisSet(key, serialized, ttl);
    } catch (error) {
      logger.warn('Redis cache set failed, using memory cache:', error.message);
    }

    // Always set in memory cache as backup
    this.cache.set(key, value);
    
    // Memory cache cleanup (simple TTL)
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
  }

  // Connection status methods
  isPostgreSQLHealthy() {
    return this.connectionState.postgresql === 'connected';
  }

  isRedisHealthy() {
    return this.connectionState.redis === 'connected';
  }

  isOverallHealthy() {
    return this.connectionState.overall === 'connected';
  }

  getConnectionSummary() {
    return {
      state: this.connectionState,
      health: this.healthMonitor.getHealthStatus(),
      circuitBreakers: {
        postgresql: this.pgCircuitBreaker.getStats(),
        redis: this.redisCircuitBreaker.getStats()
      },
      poolStats: this.pgPool ? {
        totalCount: this.pgPool.totalCount,
        idleCount: this.pgPool.idleCount,
        waitingCount: this.pgPool.waitingCount
      } : null
    };
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('🔄 Shutting down connection manager...');
    
    this.healthMonitor.stopMonitoring();
    
    if (this.pgPool) {
      await this.pgPool.end();
      logger.info('PostgreSQL pool closed');
    }
    
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis connection closed');
    }
    
    this.cache.clear();
    this.isInitialized = false;
    
    logger.info('✅ Connection manager shutdown complete');
  }
}

// Export singleton instance
const connectionManager = new RobustConnectionManager();
module.exports = connectionManager;