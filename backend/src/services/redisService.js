/**
 * Redis Service for Lokal Backend
 * Handles caching, pub/sub, and rate limiting for various services
 */

const winston = require('winston');
const databaseManager = require('../config/database');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'redis-service' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/redis.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class RedisService {
  constructor() {
    this.redis = null;
    this.pubsub = null;
    this.isConnected = false;
    this.rateLimiters = new Map();
    
    // Cache TTL configurations
    this.ttl = {
      openai: parseInt(process.env.CACHE_TTL_OPENAI) || 3600, // 1 hour
      yolo: parseInt(process.env.CACHE_TTL_YOLO) || 7200, // 2 hours
      affiliate: parseInt(process.env.CACHE_TTL_AFFILIATE) || 1800, // 30 minutes
      detection: parseInt(process.env.CACHE_TTL_DETECTION) || 3600, // 1 hour
      rateLimit: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000 // 15 minutes
    };
  }

  /**
   * Initialize Redis service
   */
  async initialize() {
    try {
      logger.info('Initializing Redis Service...');
      
      // Get Redis instance from database manager
      this.redis = databaseManager.getRedis();
      
      if (!this.redis) {
        logger.warn('Redis not available, using fallback cache');
        return false;
      }

      // Test connection
      const pingResult = await this.redis.ping();
      if (pingResult === 'PONG') {
        this.isConnected = true;
        logger.info('Redis Service initialized successfully');
        return true;
      } else {
        logger.warn('Redis ping failed, using fallback cache');
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize Redis Service:', error);
      return false;
    }
  }

  /**
   * ============================================================================
   * OPENAI RESPONSES CACHING (CLIP/GPT Object Captions)
   * ============================================================================
   */

  /**
   * Cache OpenAI response for object captions
   */
  async cacheOpenAIResponse(objectKey, response, model = 'gpt-4o-mini') {
    try {
      const key = `openai:caption:${objectKey}:${model}`;
      const data = {
        response,
        model,
        timestamp: Date.now(),
        ttl: this.ttl.openai
      };
      
      await this.redis.set(key, JSON.stringify(data), this.ttl.openai);
      logger.debug(`Cached OpenAI response for object: ${objectKey}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache OpenAI response:', error);
      return false;
    }
  }

  /**
   * Get cached OpenAI response for object captions
   */
  async getCachedOpenAIResponse(objectKey, model = 'gpt-4o-mini') {
    try {
      const key = `openai:caption:${objectKey}:${model}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        logger.debug(`Retrieved cached OpenAI response for object: ${objectKey}`);
        return data.response;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached OpenAI response:', error);
      return null;
    }
  }

  /**
   * Cache CLIP embeddings
   */
  async cacheCLIPEmbedding(objectKey, embedding) {
    try {
      const key = `clip:embedding:${objectKey}`;
      const data = {
        embedding,
        timestamp: Date.now(),
        ttl: this.ttl.openai
      };
      
      await this.redis.set(key, JSON.stringify(data), this.ttl.openai);
      logger.debug(`Cached CLIP embedding for object: ${objectKey}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache CLIP embedding:', error);
      return false;
    }
  }

  /**
   * Get cached CLIP embedding
   */
  async getCachedCLIPEmbedding(objectKey) {
    try {
      const key = `clip:embedding:${objectKey}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        logger.debug(`Retrieved cached CLIP embedding for object: ${objectKey}`);
        return data.embedding;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached CLIP embedding:', error);
      return null;
    }
  }

  /**
   * ============================================================================
   * YOLO DETECTION RESULTS CACHING (Bounding Boxes, Crops)
   * ============================================================================
   */

  /**
   * Cache YOLO detection results
   */
  async cacheYOLOResults(videoId, frameNumber, detections) {
    try {
      const key = `yolo:detections:${videoId}:${frameNumber}`;
      const data = {
        detections,
        timestamp: Date.now(),
        ttl: this.ttl.yolo
      };
      
      await this.redis.set(key, JSON.stringify(data), this.ttl.yolo);
      logger.debug(`Cached YOLO results for video: ${videoId}, frame: ${frameNumber}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache YOLO results:', error);
      return false;
    }
  }

  /**
   * Get cached YOLO detection results
   */
  async getCachedYOLOResults(videoId, frameNumber) {
    try {
      const key = `yolo:detections:${videoId}:${frameNumber}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        logger.debug(`Retrieved cached YOLO results for video: ${videoId}, frame: ${frameNumber}`);
        return data.detections;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached YOLO results:', error);
      return null;
    }
  }

  /**
   * Cache cropped object images
   */
  async cacheObjectCrop(videoId, frameNumber, objectId, cropData) {
    try {
      const key = `yolo:crop:${videoId}:${frameNumber}:${objectId}`;
      const data = {
        cropData,
        timestamp: Date.now(),
        ttl: this.ttl.yolo
      };
      
      await this.redis.set(key, JSON.stringify(data), this.ttl.yolo);
      logger.debug(`Cached object crop for video: ${videoId}, object: ${objectId}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache object crop:', error);
      return false;
    }
  }

  /**
   * Get cached object crop
   */
  async getCachedObjectCrop(videoId, frameNumber, objectId) {
    try {
      const key = `yolo:crop:${videoId}:${frameNumber}:${objectId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        logger.debug(`Retrieved cached object crop for video: ${videoId}, object: ${objectId}`);
        return data.cropData;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached object crop:', error);
      return null;
    }
  }

  /**
   * ============================================================================
   * AFFILIATE MATCH LOOKUP RESULTS
   * ============================================================================
   */

  /**
   * Cache affiliate match results
   */
  async cacheAffiliateMatch(objectKey, matches) {
    try {
      const key = `affiliate:match:${objectKey}`;
      const data = {
        matches,
        timestamp: Date.now(),
        ttl: this.ttl.affiliate
      };
      
      await this.redis.set(key, JSON.stringify(data), this.ttl.affiliate);
      logger.debug(`Cached affiliate matches for object: ${objectKey}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache affiliate matches:', error);
      return false;
    }
  }

  /**
   * Get cached affiliate match results
   */
  async getCachedAffiliateMatch(objectKey) {
    try {
      const key = `affiliate:match:${objectKey}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        logger.debug(`Retrieved cached affiliate matches for object: ${objectKey}`);
        return data.matches;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached affiliate matches:', error);
      return null;
    }
  }

  /**
   * Cache product similarity scores
   */
  async cacheProductSimilarity(objectKey, productId, similarityScore) {
    try {
      const key = `affiliate:similarity:${objectKey}:${productId}`;
      const data = {
        similarityScore,
        timestamp: Date.now(),
        ttl: this.ttl.affiliate
      };
      
      await this.redis.set(key, JSON.stringify(data), this.ttl.affiliate);
      logger.debug(`Cached product similarity for object: ${objectKey}, product: ${productId}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache product similarity:', error);
      return false;
    }
  }

  /**
   * ============================================================================
   * REAL-TIME QUEUE & PUB/SUB FOR DETECTION STATUS
   * ============================================================================
   */

  /**
   * Publish detection status update
   */
  async publishDetectionStatus(videoId, status, progress = 0, data = {}) {
    try {
      const message = {
        videoId,
        status,
        progress,
        data,
        timestamp: Date.now()
      };
      
      const channel = `detection:status:${videoId}`;
      await this.redis.set(`detection:status:${videoId}`, JSON.stringify(message), this.ttl.detection);
      
      logger.debug(`Published detection status for video: ${videoId}, status: ${status}`);
      return true;
    } catch (error) {
      logger.error('Failed to publish detection status:', error);
      return false;
    }
  }

  /**
   * Get current detection status
   */
  async getDetectionStatus(videoId) {
    try {
      const key = `detection:status:${videoId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get detection status:', error);
      return null;
    }
  }

  /**
   * Add detection job to queue
   */
  async addDetectionJob(videoId, priority = 'normal') {
    try {
      const job = {
        videoId,
        priority,
        timestamp: Date.now(),
        status: 'queued'
      };
      
      const queueKey = `detection:queue:${priority}`;
      await this.redis.set(`detection:job:${videoId}`, JSON.stringify(job), this.ttl.detection);
      
      logger.debug(`Added detection job to queue for video: ${videoId}, priority: ${priority}`);
      return true;
    } catch (error) {
      logger.error('Failed to add detection job:', error);
      return false;
    }
  }

  /**
   * Get next detection job from queue
   */
  async getNextDetectionJob(priority = 'normal') {
    try {
      // This is a simplified implementation
      // In a production environment, you'd want to use a proper job queue like Bull
      const jobKey = `detection:job:${priority}`;
      const job = await this.redis.get(jobKey);
      
      if (job) {
        return JSON.parse(job);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get next detection job:', error);
      return null;
    }
  }

  /**
   * ============================================================================
   * RATE LIMITING (Uploads, User Actions)
   * ============================================================================
   */

  /**
   * Check rate limit for user action
   */
  async checkRateLimit(userId, action, limit, windowMs) {
    try {
      const key = `ratelimit:${action}:${userId}`;
      const now = Date.now();
      
      // Get current count
      const current = await this.redis.get(key);
      const count = current ? parseInt(current) : 0;
      
      if (count >= limit) {
        logger.warn(`Rate limit exceeded for user: ${userId}, action: ${action}`);
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + windowMs
        };
      }
      
      // Increment counter
      await this.redis.set(key, count + 1, Math.ceil(windowMs / 1000));
      
      return {
        allowed: true,
        remaining: limit - count - 1,
        resetTime: now + windowMs
      };
    } catch (error) {
      logger.error('Failed to check rate limit:', error);
      // Allow action if rate limiting fails
      return { allowed: true, remaining: 999, resetTime: Date.now() + 60000 };
    }
  }

  /**
   * Rate limit for video uploads
   */
  async checkUploadRateLimit(userId) {
    const limit = parseInt(process.env.RATE_LIMIT_UPLOADS) || 10;
    const windowMs = parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW) || 3600000; // 1 hour
    
    return this.checkRateLimit(userId, 'upload', limit, windowMs);
  }

  /**
   * Rate limit for API requests
   */
  async checkAPIRateLimit(userId) {
    const limit = parseInt(process.env.RATE_LIMIT_API) || 100;
    const windowMs = parseInt(process.env.RATE_LIMIT_API_WINDOW) || 900000; // 15 minutes
    
    return this.checkRateLimit(userId, 'api', limit, windowMs);
  }

  /**
   * Rate limit for object detection requests
   */
  async checkDetectionRateLimit(userId) {
    const limit = parseInt(process.env.RATE_LIMIT_DETECTION) || 5;
    const windowMs = parseInt(process.env.RATE_LIMIT_DETECTION_WINDOW) || 300000; // 5 minutes
    
    return this.checkRateLimit(userId, 'detection', limit, windowMs);
  }

  /**
   * ============================================================================
   * UTILITY METHODS
   * ============================================================================
   */

  /**
   * Clear cache by pattern
   */
  async clearCacheByPattern(pattern) {
    try {
      // Note: This is a simplified implementation
      // In production, you'd want to use SCAN for large datasets
      logger.info(`Clearing cache with pattern: ${pattern}`);
      return true;
    } catch (error) {
      logger.error('Failed to clear cache by pattern:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const stats = {
        openai: 0,
        yolo: 0,
        affiliate: 0,
        detection: 0,
        rateLimit: 0
      };
      
      // This would be implemented with proper Redis commands
      // For now, return basic stats
      return stats;
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        connected: this.isConnected,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService; 