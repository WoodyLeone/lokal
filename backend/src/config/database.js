/**
 * Database Connection Manager
 * Handles Railway PostgreSQL connections with robust error handling and reconnection logic
 */

const { Pool } = require('pg');
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
      
      // Initialize PostgreSQL (don't fail if this fails)
      const postgresSuccess = await this.initializePostgreSQL();
      
      // Initialize Redis (don't fail if this fails)
      const redisSuccess = await this.initializeRedis();
      
      // Initialize in-memory cache
      this.initializeCache();
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      if (postgresSuccess) {
        logger.info('Database connections initialized successfully');
      } else {
        logger.warn('Database initialization completed with warnings - PostgreSQL not available');
      }
      return true;
    } catch (error) {
      logger.error('Failed to initialize database connections:', error);
      // Don't throw error, just return false to indicate partial initialization
      return false;
    }
  }

  /**
   * Initialize Railway PostgreSQL connection
   */
  async initializePostgreSQL() {
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      if (!databaseUrl) {
        logger.warn('DATABASE_URL or POSTGRES_URL not configured, skipping PostgreSQL initialization');
        this.isConnected = false;
        return false;
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
        logger.debug('New client connected to PostgreSQL');
      });

      this.pool.on('error', (err, client) => {
        logger.error('Unexpected error on idle client', err);
      });

      // Test connection and create tables if needed
      const client = await this.pool.connect();
      try {
        await client.query('SELECT NOW()');
        logger.info('✅ PostgreSQL connection successful');
        
        // Create tables and indexes if they don't exist
        await this.createTablesAndIndexes(client);
        
        this.isConnected = true;
        return true;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Failed to initialize PostgreSQL:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Create necessary tables and indexes for pipeline data
   */
  async createTablesAndIndexes(client) {
    try {
      logger.info('Creating tables and indexes for pipeline data...');
      
      // Videos table
      await client.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          file_path VARCHAR(1000),
          file_size BIGINT,
          duration FLOAT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processing_started_at TIMESTAMP,
          processing_completed_at TIMESTAMP,
          error_message TEXT,
          metadata JSONB
        )
      `);

      // Pipeline results table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pipeline_results (
          id SERIAL PRIMARY KEY,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          pipeline_id VARCHAR(255),
          phase VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          progress INTEGER DEFAULT 0,
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Object detections table
      await client.query(`
        CREATE TABLE IF NOT EXISTS object_detections (
          id SERIAL PRIMARY KEY,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          frame_number INTEGER,
          track_id INTEGER,
          class_name VARCHAR(100),
          confidence FLOAT,
          bbox JSONB,
          quality_scores JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Product matches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_matches (
          id SERIAL PRIMARY KEY,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          track_id INTEGER,
          product_name VARCHAR(500),
          product_url VARCHAR(1000),
          affiliate_link VARCHAR(1000),
          relevance_score FLOAT,
          confidence FLOAT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User feedback table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id SERIAL PRIMARY KEY,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          track_id INTEGER,
          feedback_type VARCHAR(50),
          feedback_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
        CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pipeline_results_video_id ON pipeline_results(video_id);
        CREATE INDEX IF NOT EXISTS idx_pipeline_results_phase ON pipeline_results(phase);
        CREATE INDEX IF NOT EXISTS idx_pipeline_results_created_at ON pipeline_results(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_object_detections_video_id ON object_detections(video_id);
        CREATE INDEX IF NOT EXISTS idx_object_detections_track_id ON object_detections(track_id);
        CREATE INDEX IF NOT EXISTS idx_object_detections_class_name ON object_detections(class_name);
        CREATE INDEX IF NOT EXISTS idx_product_matches_video_id ON product_matches(video_id);
        CREATE INDEX IF NOT EXISTS idx_product_matches_track_id ON product_matches(track_id);
        CREATE INDEX IF NOT EXISTS idx_user_feedback_video_id ON user_feedback(video_id);
      `);

      logger.info('✅ Tables and indexes created successfully');
      
    } catch (error) {
      logger.error('Failed to create tables and indexes:', error);
      throw error;
    }
  }

  /**
   * Save pipeline results to database
   */
  async savePipelineResult(videoId, pipelineId, phase, status, progress, data = {}) {
    if (!this.isConnected) {
      logger.warn('Database not connected, skipping pipeline result save');
      return false;
    }

    try {
      const query = `
        INSERT INTO pipeline_results (video_id, pipeline_id, phase, status, progress, data)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (video_id, pipeline_id, phase) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          progress = EXCLUDED.progress,
          data = EXCLUDED.data,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await this.query(query, [videoId, pipelineId, phase, status, progress, JSON.stringify(data)]);
      return true;
    } catch (error) {
      logger.error('Failed to save pipeline result:', error);
      return false;
    }
  }

  /**
   * Save object detections to database
   */
  async saveObjectDetections(videoId, detections) {
    if (!this.isConnected) {
      logger.warn('Database not connected, skipping object detections save');
      return false;
    }

    try {
      // Clear existing detections for this video
      await this.query('DELETE FROM object_detections WHERE video_id = $1', [videoId]);
      
      // Insert new detections
      for (const detection of detections) {
        const query = `
          INSERT INTO object_detections 
          (video_id, frame_number, track_id, class_name, confidence, bbox, quality_scores)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await this.query(query, [
          videoId,
          detection.frame_number,
          detection.track_id,
          detection.class_name,
          detection.confidence,
          JSON.stringify(detection.bbox),
          JSON.stringify(detection.quality_scores || {})
        ]);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to save object detections:', error);
      return false;
    }
  }

  /**
   * Save product matches to database
   */
  async saveProductMatches(videoId, matches) {
    if (!this.isConnected) {
      logger.warn('Database not connected, skipping product matches save');
      return false;
    }

    try {
      // Clear existing matches for this video
      await this.query('DELETE FROM product_matches WHERE video_id = $1', [videoId]);
      
      // Insert new matches
      for (const match of matches) {
        const query = `
          INSERT INTO product_matches 
          (video_id, track_id, product_name, product_url, affiliate_link, relevance_score, confidence)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await this.query(query, [
          videoId,
          match.track_id,
          match.product_name,
          match.product_url,
          match.affiliate_link,
          match.relevance_score,
          match.confidence
        ]);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to save product matches:', error);
      return false;
    }
  }

  /**
   * Get pipeline results for a video
   */
  async getPipelineResults(videoId) {
    if (!this.isConnected) {
      logger.warn('Database not connected, cannot retrieve pipeline results');
      return null;
    }

    try {
      const query = `
        SELECT * FROM pipeline_results 
        WHERE video_id = $1 
        ORDER BY created_at DESC
      `;
      
      const result = await this.query(query, [videoId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get pipeline results:', error);
      return null;
    }
  }

  /**
   * Get object detections for a video
   */
  async getObjectDetections(videoId) {
    if (!this.isConnected) {
      logger.warn('Database not connected, cannot retrieve object detections');
      return null;
    }

    try {
      const query = `
        SELECT * FROM object_detections 
        WHERE video_id = $1 
        ORDER BY frame_number, track_id
      `;
      
      const result = await this.query(query, [videoId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get object detections:', error);
      return null;
    }
  }

  /**
   * Get product matches for a video
   */
  async getProductMatches(videoId) {
    if (!this.isConnected) {
      logger.warn('Database not connected, cannot retrieve product matches');
      return null;
    }

    try {
      const query = `
        SELECT * FROM product_matches 
        WHERE video_id = $1 
        ORDER BY relevance_score DESC
      `;
      
      const result = await this.query(query, [videoId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get product matches:', error);
      return null;
    }
  }

  /**
   * Update video status in database
   */
  async updateVideoStatus(videoId, status, metadata = {}) {
    if (!this.isConnected) {
      logger.warn('Database not connected, skipping video status update');
      return false;
    }

    try {
      const query = `
        UPDATE videos 
        SET status = $2, updated_at = CURRENT_TIMESTAMP, metadata = $3
        WHERE id = $1
      `;
      
      await this.query(query, [videoId, status, JSON.stringify(metadata)]);
      return true;
    } catch (error) {
      logger.error('Failed to update video status:', error);
      return false;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      const Redis = require('ioredis');
      
      // Use direct Redis connection string
      const redisUrl = process.env.REDIS_URL || 'redis://default:AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA@exact-sturgeon-62017.upstash.io:6379';
      
      if (!redisUrl) {
        logger.warn('REDIS_URL not configured, skipping Redis initialization');
        return false;
      }

      logger.info('Connecting to Upstash Redis via direct connection...');

      // Create Redis client with TLS
      this.redis = new Redis(redisUrl, {
        tls: {
          rejectUnauthorized: false
        },
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      // Handle Redis events
      this.redis.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis client error:', error);
      });

      this.redis.on('close', () => {
        logger.warn('Redis client connection closed');
      });

      // Test connection
      await this.redis.ping();
      logger.info('Upstash Redis connection established');
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
    if (!this.pool || !this.isConnected) {
      logger.warn('PostgreSQL not available, query skipped:', text);
      return { rows: [], rowCount: 0 };
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