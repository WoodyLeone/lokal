/**
 * Memory Optimizer Utility
 * Provides memory optimization functions to prevent memory leaks
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'memory-optimizer' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class MemoryOptimizer {
  constructor() {
    this.optimizationInterval = 300000; // 5 minutes
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start memory optimization
   */
  start() {
    if (this.isRunning) {
      logger.warn('Memory optimization already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.optimizeMemory();
    }, this.optimizationInterval);

    logger.info('Memory optimization started');
  }

  /**
   * Stop memory optimization
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Memory optimization stopped');
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory() {
    try {
      const beforeUsage = process.memoryUsage();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Garbage collection triggered');
      }

      // Clear any cached data
      this.clearCaches();

      const afterUsage = process.memoryUsage();
      const freedMemory = beforeUsage.heapUsed - afterUsage.heapUsed;
      
      if (freedMemory > 0) {
        logger.info(`Memory optimization freed ${Math.round(freedMemory / 1024 / 1024)}MB`);
      }
    } catch (error) {
      logger.error('Memory optimization error:', error);
    }
  }

  /**
   * Clear various caches
   */
  clearCaches() {
    // Clear require cache for non-essential modules
    const cacheKeys = Object.keys(require.cache);
    const nonEssentialModules = cacheKeys.filter(key => 
      key.includes('node_modules') && 
      !key.includes('express') && 
      !key.includes('winston') &&
      !key.includes('pg') &&
      !key.includes('redis')
    );

    nonEssentialModules.forEach(key => {
      delete require.cache[key];
    });

    if (nonEssentialModules.length > 0) {
      logger.info(`Cleared ${nonEssentialModules.length} non-essential module caches`);
    }
  }

  /**
   * Get memory optimization status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      optimizationInterval: this.optimizationInterval,
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = new MemoryOptimizer(); 