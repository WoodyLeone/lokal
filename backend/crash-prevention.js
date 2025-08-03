#!/usr/bin/env node

const dotenv = require('dotenv');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Enhanced logging with crash detection
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'crash-prevention' },
  transports: [
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || './logs/crash.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class CrashPrevention {
  constructor() {
    this.crashCount = 0;
    this.maxCrashes = 5;
    this.crashWindow = 60000; // 1 minute
    this.lastCrashTime = 0;
    this.memoryThreshold = 0.9; // 90% memory usage
    this.healthChecks = new Map();
    this.isShuttingDown = false;
    this.lastMemoryLogTime = 0; // Track last memory log time
  }

  /**
   * Initialize crash prevention
   */
  initialize() {
    logger.info('🚀 Initializing Crash Prevention System...');
    
    // Set up global error handlers
    this.setupGlobalHandlers();
    
    // Set up memory monitoring
    this.setupMemoryMonitoring();
    
    // Set up health checks
    this.setupHealthChecks();
    
    // Set up graceful shutdown
    this.setupGracefulShutdown();
    
    logger.info('✅ Crash Prevention System initialized');
  }

  /**
   * Set up global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleCrash('uncaughtException', error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleCrash('unhandledRejection', reason, promise);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, initiating graceful shutdown...');
      this.gracefulShutdown();
    });

    // Handle SIGINT
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, initiating graceful shutdown...');
      this.gracefulShutdown();
    });
  }

  /**
   * Set up memory monitoring
   */
  setupMemoryMonitoring() {
    const memoryCheckInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
      
      // Only log memory usage if it's high or if we haven't logged recently
      const now = Date.now();
      const shouldLog = memUsagePercent > this.memoryThreshold || 
                       !this.lastMemoryLogTime || 
                       (now - this.lastMemoryLogTime > 300000); // 5 minutes
      
      if (shouldLog) {
        logger.info('Memory usage:', {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          usagePercent: `${Math.round(memUsagePercent * 100)}%`
        });
        this.lastMemoryLogTime = now;
      }

      // Alert if memory usage is high
      if (memUsagePercent > this.memoryThreshold) {
        logger.warn('⚠️ High memory usage detected:', {
          usage: `${Math.round(memUsagePercent * 100)}%`,
          threshold: `${Math.round(this.memoryThreshold * 100)}%`
        });
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          logger.info('🔄 Forced garbage collection');
        }
      }

      // Emergency shutdown if memory usage is critical
      if (memUsagePercent > 0.95) {
        logger.error('🚨 Critical memory usage, initiating emergency shutdown');
        this.emergencyShutdown();
      }
    }, 120000); // Check every 2 minutes (increased from 30 seconds)

    // Store interval for cleanup
    this.memoryCheckInterval = memoryCheckInterval;
  }

  /**
   * Set up health checks
   */
  setupHealthChecks() {
    // Database health check
    this.addHealthCheck('database', async () => {
      try {
        const databaseManager = require('./src/config/database');
        const status = databaseManager.getStatus();
        return status.isConnected;
      } catch (error) {
        logger.error('Database health check failed:', error);
        return false;
      }
    });

    // Redis health check
    this.addHealthCheck('redis', async () => {
      try {
        const databaseManager = require('./src/config/database');
        const redis = databaseManager.getRedis();
        if (!redis) return false;
        
        await redis.ping();
        return true;
      } catch (error) {
        logger.error('Redis health check failed:', error);
        return false;
      }
    });

    // File system health check
    this.addHealthCheck('filesystem', async () => {
      try {
        const tempDir = path.join(__dirname, 'temp');
        const logsDir = path.join(__dirname, 'logs');
        
        // Check if directories exist and are writable
        if (!fs.existsSync(tempDir) || !fs.existsSync(logsDir)) {
          return false;
        }
        
        // Test write permissions
        const testFile = path.join(tempDir, 'health-check.txt');
        fs.writeFileSync(testFile, 'health-check');
        fs.unlinkSync(testFile);
        
        return true;
      } catch (error) {
        logger.error('File system health check failed:', error);
        return false;
      }
    });
  }

  /**
   * Add a health check
   */
  addHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {};
    
    for (const [name, checkFunction] of this.healthChecks) {
      try {
        results[name] = await checkFunction();
      } catch (error) {
        logger.error(`Health check ${name} failed:`, error);
        results[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Handle crashes
   */
  handleCrash(type, error, promise = null) {
    const now = Date.now();
    
    // Reset crash count if enough time has passed
    if (now - this.lastCrashTime > this.crashWindow) {
      this.crashCount = 0;
    }
    
    this.crashCount++;
    this.lastCrashTime = now;
    
    logger.error('🚨 CRASH DETECTED:', {
      type,
      error: error.message,
      stack: error.stack,
      crashCount: this.crashCount,
      maxCrashes: this.maxCrashes,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    });

    // Log additional context
    if (promise) {
      logger.error('Promise that caused rejection:', promise);
    }

    // Emergency shutdown if too many crashes
    if (this.crashCount >= this.maxCrashes) {
      logger.error('🚨 Too many crashes detected, initiating emergency shutdown');
      this.emergencyShutdown();
      return;
    }

    // Attempt recovery
    this.attemptRecovery();
  }

  /**
   * Attempt recovery from crash
   */
  async attemptRecovery() {
    logger.info('🔄 Attempting recovery...');
    
    try {
      // Run health checks
      const healthResults = await this.runHealthChecks();
      
      logger.info('Health check results:', healthResults);
      
      // If all health checks pass, continue
      const allHealthy = Object.values(healthResults).every(result => result);
      
      if (allHealthy) {
        logger.info('✅ Recovery successful, all systems healthy');
        return;
      }
      
      // If some systems are unhealthy, try to restart them
      logger.warn('⚠️ Some systems unhealthy, attempting restart...');
      
      // Restart database connections
      if (!healthResults.database) {
        await this.restartDatabase();
      }
      
      // Restart Redis
      if (!healthResults.redis) {
        await this.restartRedis();
      }
      
    } catch (error) {
      logger.error('Recovery attempt failed:', error);
    }
  }

  /**
   * Restart database connections
   */
  async restartDatabase() {
    try {
      logger.info('🔄 Restarting database connections...');
      const databaseManager = require('./src/config/database');
      
      await databaseManager.close();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await databaseManager.initialize();
      
      logger.info('✅ Database connections restarted');
    } catch (error) {
      logger.error('Failed to restart database:', error);
    }
  }

  /**
   * Restart Redis
   */
  async restartRedis() {
    try {
      logger.info('🔄 Restarting Redis connection...');
      const databaseManager = require('./src/config/database');
      
      const redis = databaseManager.getRedis();
      if (redis) {
        await redis.quit();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await databaseManager.initializeRedis();
      }
      
      logger.info('✅ Redis connection restarted');
    } catch (error) {
      logger.error('Failed to restart Redis:', error);
    }
  }

  /**
   * Set up graceful shutdown
   */
  setupGracefulShutdown() {
    this.gracefulShutdown = async () => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress...');
        return;
      }
      
      this.isShuttingDown = true;
      logger.info('🔄 Starting graceful shutdown...');
      
      try {
        // Stop memory monitoring
        if (this.memoryCheckInterval) {
          clearInterval(this.memoryCheckInterval);
        }
        
        // Close database connections
        const databaseManager = require('./src/config/database');
        await databaseManager.close();
        
        // Clean up temp files
        this.cleanupTempFiles();
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };
  }

  /**
   * Emergency shutdown
   */
  emergencyShutdown() {
    logger.error('🚨 EMERGENCY SHUTDOWN INITIATED');
    
    // Force exit after 5 seconds
    setTimeout(() => {
      logger.error('🚨 Force exiting due to emergency shutdown');
      process.exit(1);
    }, 5000);
    
    // Attempt graceful shutdown
    this.gracefulShutdown();
  }

  /**
   * Clean up temp files
   */
  cleanupTempFiles() {
    try {
      const tempDir = path.join(__dirname, 'temp');
      const files = fs.readdirSync(tempDir);
      
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Remove files older than 1 hour
        if (Date.now() - stats.mtime.getTime() > 3600000) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up temp file: ${file}`);
        }
      });
    } catch (error) {
      logger.warn('Error cleaning up temp files:', error);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      crashCount: this.crashCount,
      maxCrashes: this.maxCrashes,
      lastCrashTime: this.lastCrashTime,
      isShuttingDown: this.isShuttingDown,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

// Create singleton instance
const crashPrevention = new CrashPrevention();

module.exports = crashPrevention; 