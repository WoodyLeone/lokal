/**
 * Pipeline Monitor Service
 * Monitors pipeline performance, detects issues, and provides recovery mechanisms
 */

const winston = require('winston');
const redisService = require('./redisService');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pipeline-monitor' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/pipeline-monitor.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class PipelineMonitor {
  constructor() {
    this.isInitialized = false;
    this.monitoringInterval = null;
    this.alertThresholds = {
      processingTime: 300000, // 5 minutes
      errorRate: 0.1, // 10%
      memoryUsage: 0.8, // 80%
      queueSize: 100
    };
    
    // Performance metrics
    this.metrics = {
      totalVideos: 0,
      successfulVideos: 0,
      failedVideos: 0,
      averageProcessingTime: 0,
      currentQueueSize: 0,
      memoryUsage: 0,
      errorRate: 0,
      lastUpdate: new Date()
    };
  }

  /**
   * Initialize the monitor
   */
  async initialize() {
    try {
      await redisService.initialize();
      this.isInitialized = true;
      
      // Start monitoring
      this.startMonitoring();
      
      logger.info('Pipeline Monitor initialized');
    } catch (error) {
      logger.error('Failed to initialize Pipeline Monitor:', error);
      throw error;
    }
  }

  /**
   * Start monitoring pipeline performance
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.checkThresholds();
      await this.generateAlerts();
    }, 30000); // Check every 30 seconds
    
    logger.info('Pipeline monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Pipeline monitoring stopped');
    }
  }

  /**
   * Collect current metrics
   */
  async collectMetrics() {
    try {
      // Get pipeline stats from Redis
      const pipelineStats = await redisService.getPipelineStats();
      
      // Update metrics
      this.metrics = {
        ...this.metrics,
        ...pipelineStats,
        lastUpdate: new Date()
      };
      
      // Calculate error rate
      if (this.metrics.totalVideos > 0) {
        this.metrics.errorRate = this.metrics.failedVideos / this.metrics.totalVideos;
      }
      
      // Get memory usage
      this.metrics.memoryUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
      
      // Get queue size
      this.metrics.currentQueueSize = await this.getQueueSize();
      
      logger.debug('Metrics collected:', this.metrics);
      
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Check if metrics exceed thresholds
   */
  async checkThresholds() {
    const alerts = [];
    
    // Check processing time
    if (this.metrics.averageProcessingTime > this.alertThresholds.processingTime) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Average processing time (${this.metrics.averageProcessingTime}ms) exceeds threshold (${this.alertThresholds.processingTime}ms)`
      });
    }
    
    // Check error rate
    if (this.metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'reliability',
        severity: 'critical',
        message: `Error rate (${(this.metrics.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.alertThresholds.errorRate * 100).toFixed(1)}%)`
      });
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'resource',
        severity: 'warning',
        message: `Memory usage (${(this.metrics.memoryUsage * 100).toFixed(1)}%) exceeds threshold (${(this.alertThresholds.memoryUsage * 100).toFixed(1)}%)`
      });
    }
    
    // Check queue size
    if (this.metrics.currentQueueSize > this.alertThresholds.queueSize) {
      alerts.push({
        type: 'capacity',
        severity: 'warning',
        message: `Queue size (${this.metrics.currentQueueSize}) exceeds threshold (${this.alertThresholds.queueSize})`
      });
    }
    
    return alerts;
  }

  /**
   * Generate and send alerts
   */
  async generateAlerts() {
    try {
      const alerts = await this.checkThresholds();
      
      for (const alert of alerts) {
        await this.sendAlert(alert);
        logger.warn(`Alert generated: ${alert.message}`);
      }
      
    } catch (error) {
      logger.error('Failed to generate alerts:', error);
    }
  }

  /**
   * Send alert notification
   */
  async sendAlert(alert) {
    try {
      // Store alert in Redis for persistence
      await redisService.setex(
        `alert:${Date.now()}`,
        3600, // 1 hour expiry
        JSON.stringify({
          ...alert,
          timestamp: new Date().toISOString(),
          metrics: this.metrics
        })
      );
      
      // In production, this would send to monitoring services like:
      // - Sentry for error tracking
      // - DataDog for metrics
      // - Slack/Discord for notifications
      // - Email for critical alerts
      
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }

  /**
   * Get current queue size
   */
  async getQueueSize() {
    try {
      const queueSize = await redisService.get('pipeline:queue:size');
      return parseInt(queueSize) || 0;
    } catch (error) {
      logger.error('Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Record pipeline event
   */
  async recordEvent(videoId, eventType, data = {}) {
    try {
      const event = {
        videoId,
        eventType,
        timestamp: new Date().toISOString(),
        data
      };
      
      // Store event in Redis
      await redisService.lpush('pipeline:events', JSON.stringify(event));
      
      // Keep only last 1000 events
      await redisService.ltrim('pipeline:events', 0, 999);
      
      logger.debug(`Event recorded: ${eventType} for video ${videoId}`);
      
    } catch (error) {
      logger.error('Failed to record event:', error);
    }
  }

  /**
   * Get pipeline health status
   */
  async getHealthStatus() {
    try {
      const alerts = await this.checkThresholds();
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
      
      let status = 'healthy';
      if (criticalAlerts.length > 0) {
        status = 'critical';
      } else if (warningAlerts.length > 0) {
        status = 'warning';
      }
      
      return {
        status,
        metrics: this.metrics,
        alerts: {
          critical: criticalAlerts.length,
          warning: warningAlerts.length,
          total: alerts.length
        },
        lastUpdate: this.metrics.lastUpdate
      };
      
    } catch (error) {
      logger.error('Failed to get health status:', error);
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit = 50) {
    try {
      const events = await redisService.lrange('pipeline:events', 0, limit - 1);
      return events.map(event => JSON.parse(event));
    } catch (error) {
      logger.error('Failed to get recent events:', error);
      return [];
    }
  }

  /**
   * Get performance recommendations
   */
  async getRecommendations() {
    const recommendations = [];
    
    // Processing time recommendations
    if (this.metrics.averageProcessingTime > 120000) { // 2 minutes
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider reducing frame processing rate or using smaller models',
        action: 'Adjust MAX_FRAMES_TO_PROCESS or use yolov8n instead of yolov8s'
      });
    }
    
    // Error rate recommendations
    if (this.metrics.errorRate > 0.05) { // 5%
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        message: 'High error rate detected. Review error logs and check system resources',
        action: 'Check logs for common error patterns and increase error handling'
      });
    }
    
    // Memory usage recommendations
    if (this.metrics.memoryUsage > 0.7) { // 70%
      recommendations.push({
        type: 'resource',
        priority: 'medium',
        message: 'High memory usage detected. Consider optimizing memory usage',
        action: 'Implement memory cleanup and reduce batch sizes'
      });
    }
    
    // Queue size recommendations
    if (this.metrics.currentQueueSize > 50) {
      recommendations.push({
        type: 'capacity',
        priority: 'medium',
        message: 'Large queue detected. Consider scaling up processing capacity',
        action: 'Add more worker processes or implement queue prioritization'
      });
    }
    
    return recommendations;
  }

  /**
   * Cleanup old data
   */
  async cleanup() {
    try {
      // Clean up old events (older than 24 hours)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const events = await this.getRecentEvents(1000);
      
      const oldEvents = events.filter(event => 
        new Date(event.timestamp) < cutoff
      );
      
      if (oldEvents.length > 0) {
        await redisService.ltrim('pipeline:events', oldEvents.length, -1);
        logger.info(`Cleaned up ${oldEvents.length} old events`);
      }
      
      // Clean up old alerts (older than 1 hour)
      const alertKeys = await redisService.keys('alert:*');
      for (const key of alertKeys) {
        const alert = await redisService.get(key);
        if (alert) {
          const alertData = JSON.parse(alert);
          if (new Date(alertData.timestamp) < cutoff) {
            await redisService.del(key);
          }
        }
      }
      
    } catch (error) {
      logger.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Get monitoring statistics
   */
  async getStats() {
    try {
      const health = await this.getHealthStatus();
      const recommendations = await this.getRecommendations();
      const recentEvents = await this.getRecentEvents(10);
      
      return {
        health,
        metrics: this.metrics,
        recommendations,
        recentEvents,
        thresholds: this.alertThresholds,
        isMonitoring: this.monitoringInterval !== null
      };
    } catch (error) {
      logger.error('Failed to get monitoring stats:', error);
      return {
        error: error.message
      };
    }
  }
}

module.exports = new PipelineMonitor(); 