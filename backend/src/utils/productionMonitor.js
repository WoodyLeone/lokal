const winston = require('winston');
const os = require('os');

class ProductionMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.activeConnections = 0;
    this.metrics = {
      requests: 0,
      errors: 0,
      uploads: 0,
      detections: 0,
      matches: 0,
      avgResponseTime: 0
    };

    this.setupLogging();
    this.startMetricsCollection();
  }

  setupLogging() {
    // Configure production logging
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'lokal-backend',
        environment: process.env.NODE_ENV || 'production'
      },
      transports: [
        // File transport for errors
        new winston.transports.File({ 
          filename: process.env.LOG_FILE || './logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // File transport for all logs
        new winston.transports.File({ 
          filename: process.env.LOG_FILE || './logs/app.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Console transport for development
        ...(process.env.NODE_ENV !== 'production' ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ] : [])
      ]
    });

    // Handle uncaught exceptions
    this.logger.exceptions.handle(
      new winston.transports.File({ 
        filename: './logs/exceptions.log',
        maxsize: 5242880,
        maxFiles: 5,
      })
    );

    // Handle unhandled rejections
    this.logger.rejections.handle(
      new winston.transports.File({ 
        filename: './logs/rejections.log',
        maxsize: 5242880,
        maxFiles: 5,
      })
    );
  }

  startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Log system status every 5 minutes
    setInterval(() => {
      this.logSystemStatus();
    }, 300000);
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    this.metrics.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };

    this.metrics.system = {
      uptime: Math.round(uptime),
      cpuUsage: {
        user: Math.round(cpuUsage.user / 1000), // ms
        system: Math.round(cpuUsage.system / 1000), // ms
      },
      loadAverage: os.loadavg(),
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
    };

    this.metrics.timestamp = new Date().toISOString();
  }

  logSystemStatus() {
    this.logger.info('System Status', {
      metrics: this.metrics,
      activeConnections: this.activeConnections,
      requestRate: this.calculateRequestRate(),
      errorRate: this.calculateErrorRate(),
    });
  }

  calculateRequestRate() {
    const uptime = (Date.now() - this.startTime) / 1000; // seconds
    return this.metrics.requests / uptime; // requests per second
  }

  calculateErrorRate() {
    if (this.metrics.requests === 0) return 0;
    return (this.metrics.errors / this.metrics.requests) * 100; // percentage
  }

  // Request tracking
  trackRequest(method, path, statusCode, responseTime) {
    this.metrics.requests++;
    this.requestCount++;

    this.logger.info('Request', {
      method,
      path,
      statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
    });

    // Update average response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.requests - 1) + responseTime) / this.metrics.requests;
  }

  trackError(error, context = {}) {
    this.metrics.errors++;
    this.errorCount++;

    this.logger.error('Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  trackUpload(videoId, fileSize, duration) {
    this.metrics.uploads++;

    this.logger.info('Video Upload', {
      videoId,
      fileSize: Math.round(fileSize / 1024 / 1024), // MB
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  trackDetection(videoId, objects, processingTime) {
    this.metrics.detections++;

    this.logger.info('Object Detection', {
      videoId,
      objectCount: objects.length,
      objects,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  }

  trackMatching(videoId, objects, products, processingTime) {
    this.metrics.matches++;

    this.logger.info('Product Matching', {
      videoId,
      objectCount: objects.length,
      productCount: products.length,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  }

  // Connection tracking
  trackConnection() {
    this.activeConnections++;
  }

  trackDisconnection() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  // Health check
  getHealthStatus() {
    const errorRate = this.calculateErrorRate();
    const memoryUsage = this.metrics.memory?.heapUsed / this.metrics.memory?.heapTotal * 100 || 0;

    let status = 'healthy';
    let issues = [];

    if (errorRate > 5) {
      status = 'degraded';
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    if (memoryUsage > 90) {
      status = 'degraded';
      issues.push(`High memory usage: ${memoryUsage.toFixed(2)}%`);
    }

    if (this.activeConnections > 1000) {
      status = 'degraded';
      issues.push(`High connection count: ${this.activeConnections}`);
    }

    return {
      status,
      issues,
      metrics: this.metrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  // Performance monitoring
  startTimer() {
    return Date.now();
  }

  endTimer(startTime, operation) {
    const duration = Date.now() - startTime;
    
    this.logger.info('Performance', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
    });

    return duration;
  }

  // Alert system
  sendAlert(level, message, data = {}) {
    this.logger.log(level, 'Alert', {
      message,
      data,
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to send alerts to external services
    // like Slack, email, or monitoring platforms
    if (level === 'error' && process.env.ALERT_WEBHOOK_URL) {
      this.sendWebhookAlert(level, message, data);
    }
  }

  async sendWebhookAlert(level, message, data) {
    try {
      const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          service: 'lokal-backend',
        }),
      });

      if (!response.ok) {
        this.logger.error('Failed to send webhook alert', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      this.logger.error('Error sending webhook alert', {
        error: error.message,
      });
    }
  }

  // Cleanup
  cleanup() {
    this.logger.info('Shutting down production monitor');
  }
}

// Create singleton instance
const productionMonitor = new ProductionMonitor();

module.exports = productionMonitor; 