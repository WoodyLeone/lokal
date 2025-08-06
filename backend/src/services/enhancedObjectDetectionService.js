/**
 * Enhanced Object Detection Service with Redis Caching
 * Handles YOLO detection with caching, status tracking, and performance optimization
 */

const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const redisService = require('./redisService');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'enhanced-object-detection' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/object-detection.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class EnhancedObjectDetectionService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../scripts/enhanced_detect_objects.py');
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      // Initialize Redis service
      await redisService.initialize();
      this.isInitialized = true;
      logger.info('Enhanced Object Detection Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Enhanced Object Detection Service:', error);
      throw error;
    }
  }

  /**
   * Detect objects in video with caching and status tracking
   */
  async detectObjects(videoId, videoPath, options = {}) {
    try {
      logger.info(`Starting enhanced object detection for video: ${videoId}`);
      
      // Check if video file exists
      if (!fs.existsSync(videoPath)) {
        logger.error(`Video file not found: ${videoPath}`);
        throw new Error('Video file not found');
      }

      // Check file size
      const stats = fs.statSync(videoPath);
      logger.info(`Video file size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        logger.error('Video file is empty');
        throw new Error('Video file is empty');
      }

      // Update detection status (gracefully handle Redis failures)
      try {
        await redisService.publishDetectionStatus(videoId, 'processing', 0, {
          message: 'Starting object detection',
          fileSize: stats.size
        });
      } catch (redisError) {
        logger.warn(`Redis status update failed, continuing without caching: ${redisError.message}`);
      }

      // Check for cached results first (gracefully handle Redis failures)
      let cachedResults = null;
      try {
        cachedResults = await this.getCachedDetectionResults(videoId);
        if (cachedResults) {
          logger.info(`Using cached detection results for video: ${videoId}`);
          try {
            await redisService.publishDetectionStatus(videoId, 'completed', 100, {
              message: 'Using cached results',
              objects: cachedResults
            });
          } catch (redisError) {
            logger.warn(`Redis status update failed: ${redisError.message}`);
          }
          return cachedResults;
        }
      } catch (redisError) {
        logger.warn(`Redis cache check failed, proceeding with fresh detection: ${redisError.message}`);
      }

      // Add to detection queue (gracefully handle Redis failures)
      try {
        await redisService.addDetectionJob(videoId, options.priority || 'normal');
      } catch (redisError) {
        logger.warn(`Redis queue failed, proceeding with direct detection: ${redisError.message}`);
      }

      // Update status (gracefully handle Redis failures)
      try {
        await redisService.publishDetectionStatus(videoId, 'queued', 5, {
          message: 'Added to detection queue'
        });
      } catch (redisError) {
        logger.warn(`Redis status update failed: ${redisError.message}`);
      }

      // Perform detection
      const results = await this.performDetection(videoId, videoPath, options);

      // Cache results (gracefully handle Redis failures)
      try {
        await this.cacheDetectionResults(videoId, results);
      } catch (redisError) {
        logger.warn(`Redis caching failed, results not cached: ${redisError.message}`);
      }

      // Update final status (gracefully handle Redis failures)
      try {
        await redisService.publishDetectionStatus(videoId, 'completed', 100, {
          message: 'Detection completed',
          objects: results
        });
      } catch (redisError) {
        logger.warn(`Redis status update failed: ${redisError.message}`);
      }

      logger.info(`Detection completed for video: ${videoId}, found ${results.length} objects`);
      return results;

    } catch (error) {
      logger.error(`Detection failed for video: ${videoId}`, error);
      
      // Update error status
      await redisService.publishDetectionStatus(videoId, 'error', 0, {
        message: 'Detection failed',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Perform actual object detection using Python script
   */
  async performDetection(videoId, videoPath, options = {}) {
    return new Promise((resolve, reject) => {
      logger.info(`Running detection for video: ${videoId}`);

      const detectionOptions = {
        mode: 'json',
        pythonPath: 'python3',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(this.pythonScriptPath),
        args: [
          videoPath,
          '--confidence', options.confidence || '0.3',
          '--model', options.model || 'yolov8n.pt',
          '--save-crops', 'true',
          '--save-txt', 'true'
        ]
      };

      logger.info(`Python script arguments: ${detectionOptions.args.join(' ')}`);

      const pyshell = new PythonShell(path.basename(this.pythonScriptPath), detectionOptions);
      let results = [];
      let progress = 10;
      let hasError = false;

      // Progress tracking
      const progressInterval = setInterval(async () => {
        if (progress < 90) {
          progress += 10;
          await redisService.publishDetectionStatus(videoId, 'processing', progress, {
            message: `Processing frame ${progress}%`
          });
        }
      }, 2000);

      pyshell.on('message', async (message) => {
        try {
          logger.debug('Python output:', message);
          
          if (typeof message === 'object' && message !== null) {
            if (message.objects && Array.isArray(message.objects)) {
              results = message.objects;
            } else if (message.frame && message.detections) {
              // Cache frame-level results
              await this.cacheFrameDetections(videoId, message.frame, message.detections);
            } else if (message.crop && message.cropData) {
              // Cache object crops
              await this.cacheObjectCrop(videoId, message.frame, message.objectId, message.cropData);
            } else if (message.progress) {
              progress = message.progress;
              await redisService.publishDetectionStatus(videoId, 'processing', progress, {
                message: `Processing frame ${progress}%`
              });
            } else if (message.error) {
              logger.error('Python script error:', message.error);
              hasError = true;
            }
          }
        } catch (error) {
          logger.error('Error processing Python output:', error);
          hasError = true;
        }
      });

      pyshell.on('error', (err) => {
        logger.error('Python script execution error:', err);
        hasError = true;
      });

      pyshell.end((err) => {
        clearInterval(progressInterval);
        
        if (err) {
          logger.error('Python script execution error:', err);
          hasError = true;
        }
        
        if (hasError || results.length === 0) {
          logger.warn('Detection failed or no objects detected');
          resolve([]);
        } else {
          logger.info(`Detection completed: ${results.join(', ')}`);
          resolve(results);
        }
      });
    });
  }

  /**
   * Get cached detection results
   */
  async getCachedDetectionResults(videoId) {
    try {
      const key = `detection:results:${videoId}`;
      const cached = await redisService.redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        logger.info(`Retrieved cached detection results for video: ${videoId}`);
        return data.results;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached detection results:', error);
      return null;
    }
  }

  /**
   * Cache detection results
   */
  async cacheDetectionResults(videoId, results) {
    try {
      const key = `detection:results:${videoId}`;
      const data = {
        results,
        timestamp: Date.now(),
        ttl: redisService.ttl.detection
      };
      
      await redisService.redis.set(key, JSON.stringify(data), redisService.ttl.detection);
      logger.info(`Cached detection results for video: ${videoId}`);
      return true;
    } catch (error) {
      logger.error('Failed to cache detection results:', error);
      return false;
    }
  }

  /**
   * Cache frame-level detections
   */
  async cacheFrameDetections(videoId, frameNumber, detections) {
    try {
      await redisService.cacheYOLOResults(videoId, frameNumber, detections);
    } catch (error) {
      logger.error('Failed to cache frame detections:', error);
    }
  }

  /**
   * Cache object crop
   */
  async cacheObjectCrop(videoId, frameNumber, objectId, cropData) {
    try {
      await redisService.cacheObjectCrop(videoId, frameNumber, objectId, cropData);
    } catch (error) {
      logger.error('Failed to cache object crop:', error);
    }
  }

  /**
   * Get detection status
   */
  async getDetectionStatus(videoId) {
    try {
      return await redisService.getDetectionStatus(videoId);
    } catch (error) {
      logger.error('Failed to get detection status:', error);
      return null;
    }
  }

  /**
   * Get cached frame detections
   */
  async getCachedFrameDetections(videoId, frameNumber) {
    try {
      return await redisService.getCachedYOLOResults(videoId, frameNumber);
    } catch (error) {
      logger.error('Failed to get cached frame detections:', error);
      return null;
    }
  }

  /**
   * Get cached object crop
   */
  async getCachedObjectCrop(videoId, frameNumber, objectId) {
    try {
      return await redisService.getCachedObjectCrop(videoId, frameNumber, objectId);
    } catch (error) {
      logger.error('Failed to get cached object crop:', error);
      return null;
    }
  }

  /**
   * Clear detection cache for video
   */
  async clearDetectionCache(videoId) {
    try {
      const patterns = [
        `detection:results:${videoId}`,
        `detection:status:${videoId}`,
        `yolo:detections:${videoId}:*`,
        `yolo:crop:${videoId}:*`
      ];

      for (const pattern of patterns) {
        await redisService.clearCacheByPattern(pattern);
      }

      logger.info(`Cleared detection cache for video: ${videoId}`);
      return true;
    } catch (error) {
      logger.error('Failed to clear detection cache:', error);
      return false;
    }
  }

  /**
   * Get detection statistics
   */
  async getDetectionStats() {
    try {
      const stats = await redisService.getCacheStats();
      return {
        ...stats,
        service: 'enhanced-object-detection',
        initialized: this.isInitialized
      };
    } catch (error) {
      logger.error('Failed to get detection stats:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const redisHealth = await redisService.healthCheck();
      return {
        service: 'enhanced-object-detection',
        status: redisHealth.status,
        initialized: this.isInitialized,
        redis: redisHealth,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        service: 'enhanced-object-detection',
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

// Create singleton instance
const enhancedObjectDetectionService = new EnhancedObjectDetectionService();

module.exports = enhancedObjectDetectionService; 