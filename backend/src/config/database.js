/**
 * Database Connection Manager
 * Handles Supabase connections with robust error handling and reconnection logic
 */

const { createClient } = require('@supabase/supabase-js');
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
    this.supabase = null;
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
      logger.info('Initializing database connections...');
      
      // Initialize Supabase (optional)
      try {
        await this.initializeSupabase();
      } catch (error) {
        logger.warn('Supabase initialization failed (optional):', error.message);
      }
      
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
   * Initialize Supabase connection with enhanced error handling
   */
  async initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      // Use service role key if available, otherwise fall back to anon key
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        logger.warn('Supabase configuration not found, skipping Supabase initialization');
        return false;
      }

      // Log which key we're using
      const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon';
      logger.info(`Using Supabase ${keyType} key for backend operations`);

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'lokal-backend'
          }
        }
      });

      // Test connection with timeout
      const testPromise = this.supabase
        .from('videos')
        .select('count')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase connection timeout')), 15000)
      );
      
      const { data, error } = await Promise.race([testPromise, timeoutPromise]);

      if (error) {
        throw new Error(`Supabase connection test failed: ${error.message}`);
      }

      logger.info('Supabase connection established');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Supabase:', error);
      // Don't throw error, allow app to continue without Supabase
      this.supabase = null;
      return false;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      // Check if using Upstash Redis
      const isUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
      
      let redisConfig;
      
      if (isUpstash) {
        // Use Upstash Redis configuration
        const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
        const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        
        // For Upstash Redis, we need to use the REST API format
        // The URL should be in format: https://hostname:port
        const url = new URL(upstashUrl);
        const host = url.hostname;
        const port = parseInt(url.port) || 6379;
        
        redisConfig = {
          host: host,
          port: port,
          password: upstashToken,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: this.connectionTimeout,
          commandTimeout: 5000,
          tls: {
            rejectUnauthorized: false
          },
          // Upstash specific settings
          enableReadyCheck: false,
          maxRetriesPerRequest: 1
        };
      } else {
        // Use standard Redis configuration
        redisConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB) || 0,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: this.connectionTimeout,
          commandTimeout: 5000
        };
      }

      this.redis = new Redis(redisConfig);

      // Handle Redis events
      this.redis.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.isConnected = false;
        this.handleReconnection();
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
        this.handleReconnection();
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
        // Test Supabase connection
        if (this.supabase) {
          const { error } = await this.supabase
            .from('videos')
            .select('count')
            .limit(1);
          
          if (error) {
            logger.warn('Supabase heartbeat failed:', error);
            this.isConnected = false;
          }
        }

        // Test Redis connection
        if (this.redis) {
          await this.redis.ping();
        }

        this.isConnected = true;
      } catch (error) {
        logger.warn('Heartbeat check failed:', error);
        this.isConnected = false;
      }
    }, interval);
  }

  /**
   * Get Supabase client
   */
  getSupabase() {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }
    return this.supabase;
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
      supabase: !!this.supabase,
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