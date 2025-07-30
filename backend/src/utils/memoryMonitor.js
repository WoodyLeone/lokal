/**
 * Memory Monitor Utility
 * Monitors memory usage and provides alerts for potential memory leaks
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'memory-monitor' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class MemoryMonitor {
  constructor() {
    this.memoryThreshold = 0.8; // 80% of available memory
    this.checkInterval = 30000; // 30 seconds
    this.monitoring = false;
    this.intervalId = null;
  }

  /**
   * Start memory monitoring
   */
  start() {
    if (this.monitoring) {
      logger.warn('Memory monitoring already started');
      return;
    }

    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);

    logger.info('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoring = false;
    logger.info('Memory monitoring stopped');
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    const memoryInfo = {
      heapUsed: `${heapUsedMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      rss: `${rssMB} MB`,
      heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
      timestamp: new Date().toISOString()
    };

    // Log memory usage
    logger.info('Memory usage:', memoryInfo);

    // Check for memory threshold
    if (heapUsagePercent > (this.memoryThreshold * 100)) {
      logger.warn('High memory usage detected:', memoryInfo);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Garbage collection triggered');
      }
    }

    return memoryInfo;
  }

  /**
   * Get current memory status
   */
  getMemoryStatus() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    
    return {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssMB,
      heapUsagePercent: (usage.heapUsed / usage.heapTotal) * 100,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      logger.info('Manual garbage collection triggered');
      return true;
    } else {
      logger.warn('Garbage collection not available (run with --expose-gc flag)');
      return false;
    }
  }
}

module.exports = new MemoryMonitor(); 