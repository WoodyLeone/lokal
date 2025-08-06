/**
 * Performance Optimizer Service
 * Monitors and optimizes pipeline performance, memory usage, and resource utilization
 */

const os = require('os');
const winston = require('winston');
const { performance } = require('perf_hooks');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'performance-optimizer' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/performance.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      pipelinePerformance: new Map(),
      memoryUsage: [],
      cpuUsage: [],
      activeProcesses: new Map(),
      bottlenecks: [],
      optimizations: []
    };
    
    this.thresholds = {
      memoryUsage: 0.85, // 85% memory usage threshold
      cpuUsage: 0.80,    // 80% CPU usage threshold
      pipelineTimeout: 300000, // 5 minutes
      maxConcurrentVideos: 3,
      maxFrameExtraction: 50,
      maxObjectDetection: 100,
      maxOpenAICalls: 10
    };
    
    this.optimizationRules = [
      {
        name: 'memory_cleanup',
        condition: (metrics) => metrics.memoryUsage > this.thresholds.memoryUsage,
        action: this.performMemoryCleanup.bind(this),
        priority: 'high'
      },
      {
        name: 'pipeline_throttling',
        condition: (metrics) => metrics.activeProcesses.size > this.thresholds.maxConcurrentVideos,
        action: this.throttlePipelines.bind(this),
        priority: 'medium'
      },
      {
        name: 'resource_optimization',
        condition: (metrics) => metrics.cpuUsage > this.thresholds.cpuUsage,
        action: this.optimizeResources.bind(this),
        priority: 'medium'
      }
    ];
    
    this.monitoringInterval = null;
    this.isMonitoring = false;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs = 30000) {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.applyOptimizations();
    }, intervalMs);

    logger.info(`Performance monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Performance monitoring stopped');
  }

  /**
   * Collect system and application metrics
   */
  collectMetrics() {
    try {
      // System metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = usedMemory / totalMemory;

      const cpuUsage = os.loadavg()[0] / os.cpus().length;

      // Application metrics
      const processMemory = process.memoryUsage();
      const heapUsed = processMemory.heapUsed;
      const heapTotal = processMemory.heapTotal;
      const heapUsage = heapUsed / heapTotal;

      const currentMetrics = {
        timestamp: Date.now(),
        system: {
          memoryUsage,
          cpuUsage,
          totalMemory,
          freeMemory,
          usedMemory
        },
        application: {
          heapUsage,
          heapUsed,
          heapTotal,
          activeProcesses: this.metrics.activeProcesses.size,
          pipelineCount: this.metrics.pipelinePerformance.size
        }
      };

      this.metrics.memoryUsage.push(currentMetrics);
      this.metrics.cpuUsage.push(currentMetrics);

      // Keep only last 100 metrics
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
        this.metrics.cpuUsage.shift();
      }

      logger.debug('Metrics collected', currentMetrics);
      return currentMetrics;

    } catch (error) {
      logger.error('Failed to collect metrics:', error);
      return null;
    }
  }

  /**
   * Analyze performance and identify bottlenecks
   */
  analyzePerformance() {
    try {
      const currentMetrics = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      if (!currentMetrics) return;

      const bottlenecks = [];

      // Check memory usage
      if (currentMetrics.system.memoryUsage > this.thresholds.memoryUsage) {
        bottlenecks.push({
          type: 'memory_usage',
          severity: 'high',
          value: currentMetrics.system.memoryUsage,
          threshold: this.thresholds.memoryUsage,
          message: `Memory usage ${(currentMetrics.system.memoryUsage * 100).toFixed(1)}% exceeds threshold ${(this.thresholds.memoryUsage * 100).toFixed(1)}%`
        });
      }

      // Check CPU usage
      if (currentMetrics.system.cpuUsage > this.thresholds.cpuUsage) {
        bottlenecks.push({
          type: 'cpu_usage',
          severity: 'medium',
          value: currentMetrics.system.cpuUsage,
          threshold: this.thresholds.cpuUsage,
          message: `CPU usage ${(currentMetrics.system.cpuUsage * 100).toFixed(1)}% exceeds threshold ${(this.thresholds.cpuUsage * 100).toFixed(1)}%`
        });
      }

      // Check concurrent pipelines
      if (currentMetrics.application.activeProcesses > this.thresholds.maxConcurrentVideos) {
        bottlenecks.push({
          type: 'concurrent_pipelines',
          severity: 'medium',
          value: currentMetrics.application.activeProcesses,
          threshold: this.thresholds.maxConcurrentVideos,
          message: `${currentMetrics.application.activeProcesses} active pipelines exceed limit of ${this.thresholds.maxConcurrentVideos}`
        });
      }

      // Check heap usage
      if (currentMetrics.application.heapUsage > 0.9) {
        bottlenecks.push({
          type: 'heap_usage',
          severity: 'high',
          value: currentMetrics.application.heapUsage,
          threshold: 0.9,
          message: `Heap usage ${(currentMetrics.application.heapUsage * 100).toFixed(1)}% is critically high`
        });
      }

      this.metrics.bottlenecks = bottlenecks;

      if (bottlenecks.length > 0) {
        logger.warn('Performance bottlenecks detected:', bottlenecks);
      }

    } catch (error) {
      logger.error('Failed to analyze performance:', error);
    }
  }

  /**
   * Apply optimizations based on detected bottlenecks
   */
  applyOptimizations() {
    try {
      const currentMetrics = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      if (!currentMetrics) return;

      const appliedOptimizations = [];

      for (const rule of this.optimizationRules) {
        if (rule.condition(currentMetrics)) {
          try {
            const result = rule.action(currentMetrics);
            appliedOptimizations.push({
              rule: rule.name,
              priority: rule.priority,
              result: result,
              timestamp: Date.now()
            });
            logger.info(`Applied optimization: ${rule.name}`);
          } catch (error) {
            logger.error(`Failed to apply optimization ${rule.name}:`, error);
          }
        }
      }

      this.metrics.optimizations.push(...appliedOptimizations);

      // Keep only last 50 optimizations
      if (this.metrics.optimizations.length > 50) {
        this.metrics.optimizations = this.metrics.optimizations.slice(-50);
      }

    } catch (error) {
      logger.error('Failed to apply optimizations:', error);
    }
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup(metrics) {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Forced garbage collection');
      }

      // Clear old metrics data
      if (this.metrics.memoryUsage.length > 50) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50);
        this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-50);
      }

      // Clear old pipeline performance data
      const cutoffTime = Date.now() - 3600000; // 1 hour ago
      for (const [videoId, data] of this.metrics.pipelinePerformance) {
        if (data.timestamp < cutoffTime) {
          this.metrics.pipelinePerformance.delete(videoId);
        }
      }

      return {
        action: 'memory_cleanup',
        freedMemory: 'unknown',
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Memory cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Throttle pipeline processing
   */
  throttlePipelines(metrics) {
    try {
      const activeCount = metrics.application.activeProcesses;
      const maxAllowed = this.thresholds.maxConcurrentVideos;

      if (activeCount > maxAllowed) {
        // This would typically pause new pipeline starts
        // For now, we just log the throttling
        logger.warn(`Throttling pipeline processing: ${activeCount} active, max allowed: ${maxAllowed}`);
      }

      return {
        action: 'pipeline_throttling',
        activePipelines: activeCount,
        maxAllowed: maxAllowed,
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Pipeline throttling failed:', error);
      throw error;
    }
  }

  /**
   * Optimize resource usage
   */
  optimizeResources(metrics) {
    try {
      const optimizations = [];

      // Reduce frame extraction if CPU is high
      if (metrics.system.cpuUsage > this.thresholds.cpuUsage) {
        this.thresholds.maxFrameExtraction = Math.max(20, this.thresholds.maxFrameExtraction - 5);
        optimizations.push('reduced_frame_extraction');
      }

      // Reduce object detection if memory is high
      if (metrics.system.memoryUsage > this.thresholds.memoryUsage) {
        this.thresholds.maxObjectDetection = Math.max(50, this.thresholds.maxObjectDetection - 10);
        optimizations.push('reduced_object_detection');
      }

      return {
        action: 'resource_optimization',
        optimizations: optimizations,
        newThresholds: {
          maxFrameExtraction: this.thresholds.maxFrameExtraction,
          maxObjectDetection: this.thresholds.maxObjectDetection
        },
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Resource optimization failed:', error);
      throw error;
    }
  }

  /**
   * Track pipeline performance
   */
  trackPipelinePerformance(videoId, phase, startTime, endTime, data = {}) {
    try {
      const duration = endTime - startTime;
      const performance = {
        videoId,
        phase,
        startTime,
        endTime,
        duration,
        data,
        timestamp: Date.now()
      };

      if (!this.metrics.pipelinePerformance.has(videoId)) {
        this.metrics.pipelinePerformance.set(videoId, []);
      }

      this.metrics.pipelinePerformance.get(videoId).push(performance);

      // Log slow operations
      if (duration > 30000) { // 30 seconds
        logger.warn(`Slow pipeline phase: ${phase} took ${duration}ms for video ${videoId}`);
      }

      return performance;

    } catch (error) {
      logger.error('Failed to track pipeline performance:', error);
    }
  }

  /**
   * Track active process
   */
  trackActiveProcess(videoId, processType, startTime) {
    this.metrics.activeProcesses.set(videoId, {
      type: processType,
      startTime,
      timestamp: Date.now()
    });
  }

  /**
   * Remove active process tracking
   */
  removeActiveProcess(videoId) {
    this.metrics.activeProcesses.delete(videoId);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    try {
      const currentMetrics = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      const recentMetrics = this.metrics.memoryUsage.slice(-10);

      const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.system.memoryUsage, 0) / recentMetrics.length;
      const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / recentMetrics.length;

      const pipelineStats = Array.from(this.metrics.pipelinePerformance.values())
        .flat()
        .reduce((stats, perf) => {
          if (!stats[perf.phase]) {
            stats[perf.phase] = { count: 0, totalDuration: 0, avgDuration: 0 };
          }
          stats[perf.phase].count++;
          stats[perf.phase].totalDuration += perf.duration;
          stats[perf.phase].avgDuration = stats[perf.phase].totalDuration / stats[perf.phase].count;
          return stats;
        }, {});

      return {
        current: currentMetrics,
        averages: {
          memoryUsage: avgMemoryUsage,
          cpuUsage: avgCpuUsage
        },
        activeProcesses: this.metrics.activeProcesses.size,
        bottlenecks: this.metrics.bottlenecks,
        pipelineStats,
        optimizations: this.metrics.optimizations.slice(-10),
        thresholds: this.thresholds,
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Failed to get performance stats:', error);
      return null;
    }
  }

  /**
   * Update optimization thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Updated performance thresholds:', newThresholds);
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const stats = this.getPerformanceStats();
    if (!stats) {
      return {
        status: 'unhealthy',
        message: 'Failed to get performance stats',
        timestamp: Date.now()
      };
    }

    const isHealthy = 
      stats.averages.memoryUsage < this.thresholds.memoryUsage &&
      stats.averages.cpuUsage < this.thresholds.cpuUsage &&
      stats.activeProcesses <= this.thresholds.maxConcurrentVideos &&
      stats.bottlenecks.length === 0;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      message: isHealthy ? 'Performance is within acceptable limits' : 'Performance issues detected',
      stats: stats,
      timestamp: Date.now()
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring();
    this.metrics.pipelinePerformance.clear();
    this.metrics.activeProcesses.clear();
    this.metrics.memoryUsage = [];
    this.metrics.cpuUsage = [];
    this.metrics.bottlenecks = [];
    this.metrics.optimizations = [];
    logger.info('Performance optimizer cleaned up');
  }
}

module.exports = new PerformanceOptimizer(); 