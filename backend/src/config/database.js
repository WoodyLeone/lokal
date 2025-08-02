/**
 * Database Connection Manager
 * Handles Railway PostgreSQL connections with robust error handling and reconnection logic
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const NodeCache = require('node-cache');
const winston = require('winston');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

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

class DatabaseManager {
  constructor() {
    this.pool = null;
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
      logger.info('Initializing Railway PostgreSQL database connections...');
      
      // Initialize PostgreSQL
      await this.initializePostgreSQL();
      
      // Initialize Redis
      await this.initializeRedis();
      
      // Initialize in-memory cache
      this.initializeCache();
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      logger.info('Database connections initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize database connections:', error);
      throw error;
    }
  }

  /**
   * Initialize Railway PostgreSQL connection
   */
  async initializePostgreSQL() {
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
      }

      logger.info('Connecting to Railway PostgreSQL...');

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      });

      // Handle pool events
      this.pool.on('connect', (client) => {
        logger.info('PostgreSQL client connected');
        this.isConnected = true;
      });

      this.pool.on('error', (err, client) => {
        logger.error('Unexpected error on idle client', err);
        this.isConnected = false;
        this.handleReconnection();
      });

      // Test connection
      const client = await this.pool.connect();
      try {
        await client.query('SELECT NOW()');
        logger.info('Railway PostgreSQL connection established');
        this.isConnected = true;
      } finally {
        client.release();
      }

      return true;
    } catch (error) {
      logger.error('Failed to initialize Railway PostgreSQL:', error);
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
        logger.warn('REDIS_URL not configured, skipping Redis initialization');
        return false;
      }

      logger.info('Connecting to Redis...');

      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: this.connectionTimeout,
        commandTimeout: 5000,
        tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      });

      // Handle Redis events
      this.redis.on('connect', () => {
        logger.info('Redis connected');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Test connection
      await this.redis.ping();
      logger.info('Redis connection established');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      // Don't throw error for Redis - it's optional for caching
      return false;
    }
  }

  /**
   * Initialize in-memory cache
   */
  initializeCache() {
    const ttl = parseInt(process.env.CACHE_TTL) || 3600;
    const checkPeriod = parseInt(process.env.CACHE_CHECK_PERIOD) || 600;
    const maxKeys = parseInt(process.env.CACHE_MAX_KEYS) || 1000;

    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: checkPeriod,
      maxKeys: maxKeys,
      useClones: false
    });

    logger.info('In-memory cache initialized');
  }

  /**
   * Handle reconnection logic
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(async () => {
      try {
        await this.initialize();
        this.reconnectAttempts = 0;
        logger.info('Reconnection successful');
      } catch (error) {
        logger.error('Reconnection failed:', error);
        this.handleReconnection();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    const interval = parseInt(process.env.HEARTBEAT_INTERVAL) || 30000;
    
    this.heartbeatInterval = setInterval(async () => {
      try {
        // Test PostgreSQL connection
        if (this.pool) {
          const client = await this.pool.connect();
          try {
            await client.query('SELECT 1');
            this.isConnected = true;
          } finally {
            client.release();
          }
        }

        // Test Redis connection
        if (this.redis) {
          await this.redis.ping();
        }
      } catch (error) {
        logger.warn('Heartbeat check failed:', error);
        this.isConnected = false;
      }
    }, interval);
  }

  /**
   * Get PostgreSQL pool
   */
  getPool() {
    if (!this.pool) {
      throw new Error('PostgreSQL not initialized');
    }
    return this.pool;
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
    return this.isConnected;
  }

  /**
   * Execute a query with error handling
   */
  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('PostgreSQL not initialized');
    }

    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Query error', { text, duration, error: error.message });
      throw error;
    }
  }

  /**
   * Cache data with fallback
   */
  async cacheData(key, data, ttl = null) {
    try {
      // Try Redis first
      if (this.redis && this.redis.status === 'ready') {
        const serialized = JSON.stringify(data);
        await this.redis.setex(key, ttl || 3600, serialized);
        return true;
      }
    } catch (error) {
      logger.warn('Redis cache failed, falling back to memory cache:', error);
    }

    // Fallback to in-memory cache
    try {
      this.cache.set(key, data, ttl);
      return true;
    } catch (error) {
      logger.error('Memory cache failed:', error);
      return false;
    }
  }

  /**
   * Get cached data with fallback
   */
  async getCachedData(key) {
    try {
      // Try Redis first
      if (this.redis && this.redis.status === 'ready') {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
      }
    } catch (error) {
      logger.warn('Redis get failed, trying memory cache:', error);
    }

    // Fallback to in-memory cache
    try {
      return this.cache.get(key);
    } catch (error) {
      logger.error('Memory cache get failed:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(pattern = null) {
    try {
      // Clear Redis cache
      if (this.redis && this.redis.status === 'ready') {
        if (pattern) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.flushdb();
        }
      }
    } catch (error) {
      logger.warn('Redis clear failed:', error);
    }

    // Clear memory cache
    try {
      if (pattern) {
        this.cache.flushAll();
      } else {
        this.cache.flushAll();
      }
    } catch (error) {
      logger.error('Memory cache clear failed:', error);
    }
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing database connections...');
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close PostgreSQL pool
    if (this.pool) {
      await this.pool.end();
    }

    // Close Redis
    if (this.redis) {
      await this.redis.quit();
    }

    // Close cache
    if (this.cache) {
      this.cache.close();
    }

    logger.info('Database connections closed');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      postgresql: !!this.pool,
      redis: this.redis ? this.redis.status : 'disconnected',
      cache: !!this.cache,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager; 