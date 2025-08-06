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
    this.memoryThreshold = 0.9; // Increased to 90% to reduce false warnings
    this.checkInterval = 300000; // 5 minutes (increased from 2 minutes)
    this.monitoring = false;
    this.intervalId = null;
    this.lastLogTime = 0;
    this.logInterval = 600000; // Only log every 10 minutes to reduce memory usage
    this.warningThreshold = 0.95; // Only warn at 95% usage
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

    // Only log if enough time has passed or if memory usage is very high
    const now = Date.now();
    const shouldLog = (now - this.lastLogTime > this.logInterval) || (heapUsagePercent > (this.warningThreshold * 100));
    
    if (shouldLog) {
      logger.info('Memory usage:', memoryInfo);
      this.lastLogTime = now;
    }

    // Check for memory threshold - only warn at very high usage
    if (heapUsagePercent > (this.warningThreshold * 100)) {
      logger.warn('⚠️ High memory usage detected:', memoryInfo);
      
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