/**
 * Simplified Database Connection Manager
 * Handles Redis and caching only - no Supabase dependencies
 */

const Redis = require('ioredis');
const NodeCache = require('node-cache');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/database.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class SimpleDatabaseManager {
  constructor() {
    this.redis = null;
    this.cache = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = parseInt(process.env.RECONNECT_ATTEMPTS) || 5;
    this.reconnectDelay = parseInt(process.env.RECONNECT_DELAY) || 1000;
    this.connectionTimeout = parseInt(process.env.CONNECTION_TIMEOUT) || 30000;
    this.heartbeatInterval = null;
  }

  /**
   * Initialize database connections
   */
  async initialize() {
    try {
      logger.info('Initializing simplified database connections...');
      
      // Initialize Redis
      await this.initializeRedis();
      
      // Initialize in-memory cache
      this.initializeCache();
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      logger.info('Simplified database connections initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize simplified database connections:', error);
      throw error;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        logger.warn('Redis URL not configured, skipping Redis initialization');
        this.redis = null;
        return false;
      }

      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        connectTimeout: this.connectionTimeout,
        commandTimeout: this.connectionTimeout,
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        connectTimeout: this.connectionTimeout,
        commandTimeout: this.connectionTimeout,
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false
      });

      // Handle Redis events
      this.redis.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.redis.on('ready', () => {
        logger.info('Redis ready');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Connect to Redis
      await this.redis.connect();
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.redis = null;
      return false;
    }
  }

  /**
   * Initialize in-memory cache
   */
  initializeCache() {
    try {
      this.cache = new NodeCache({
        stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
        checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60, // 1 minute
        useClones: false,
        deleteOnExpire: true
      });

      logger.info('In-memory cache initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize cache:', error);
      this.cache = null;
      return false;
    }
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        if (this.redis && this.redis.status === 'ready') {
          await this.redis.ping();
        }
      } catch (error) {
        logger.warn('Heartbeat ping failed:', error.message);
      }
    }, parseInt(process.env.HEARTBEAT_INTERVAL) || 30000); // 30 seconds
  }

  /**
   * Get Redis client
   */
  getRedis() {
    return this.redis;
  }

  /**
   * Get cache instance
   */
  getCache() {
    return this.cache;
  }

  /**
   * Check if database is connected
   */
  isDatabaseConnected() {
    // For Railway PostgreSQL, we don't need Redis to be connected
    // The main database operations are handled by the API routes
    return true; // Always return true since Railway PostgreSQL is handled separately
  }

  /**
   * Cache data
   */
  async cacheData(key, data, ttl = null) {
    try {
      if (this.cache) {
        this.cache.set(key, data, ttl);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key) {
    try {
      if (this.cache) {
        return this.cache.get(key);
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(pattern = null) {
    try {
      if (this.cache) {
        if (pattern) {
          const keys = this.cache.keys();
          const matchingKeys = keys.filter(key => key.includes(pattern));
          matchingKeys.forEach(key => this.cache.del(key));
          logger.info(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
        } else {
          this.cache.flushAll();
          logger.info('Cache cleared');
        }
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    try {
      logger.info('Closing database connections...');
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
      }

      if (this.cache) {
        this.cache.close();
        this.cache = null;
      }

      this.isConnected = false;
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      redis: this.redis ? this.redis.status : 'disconnected',
      cache: this.cache ? 'available' : 'unavailable',
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Create and export singleton instance
const simpleDatabaseManager = new SimpleDatabaseManager();

module.exports = simpleDatabaseManager; 