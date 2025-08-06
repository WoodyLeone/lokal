/**
 * Enhanced Health Check Routes
 * Provides detailed system health and connection status
 */

const express = require('express');
const router = express.Router();

/**
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const connectionManager = req.connectionManager;
    const systemHealth = req.systemHealth;
    
    const healthStatus = {
      status: systemHealth.isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        postgresql: systemHealth.postgresql ? 'healthy' : 'unhealthy',
        redis: systemHealth.redis ? 'healthy' : 'unhealthy'
      }
    };

    // Set appropriate status code
    const statusCode = systemHealth.isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      health: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check endpoint
 */
router.get('/detailed', async (req, res) => {
  try {
    const connectionManager = req.connectionManager;
    const systemHealth = req.systemHealth;
    
    const detailedHealth = {
      status: systemHealth.isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // System resources
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      
      // Connection details
      connections: systemHealth.summary,
      
      // Service health
      services: {
        postgresql: {
          status: systemHealth.postgresql ? 'healthy' : 'unhealthy',
          poolStats: systemHealth.summary.poolStats
        },
        redis: {
          status: systemHealth.redis ? 'healthy' : 'unhealthy'
        }
      },
      
      // Circuit breaker status
      circuitBreakers: systemHealth.summary.circuitBreakers,
      
      // Health checks
      healthChecks: systemHealth.summary.health
    };

    const statusCode = systemHealth.isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      health: detailedHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Detailed health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Database health check endpoint
 */
router.get('/database', async (req, res) => {
  try {
    const connectionManager = req.connectionManager;
    
    const dbHealth = {
      postgresql: {
        status: connectionManager.isPostgreSQLHealthy() ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString()
      },
      redis: {
        status: connectionManager.isRedisHealthy() ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString()
      }
    };

    // Test actual database connections
    if (connectionManager.isPostgreSQLHealthy()) {
      try {
        const result = await connectionManager.query('SELECT NOW() as current_time, version() as version');
        dbHealth.postgresql.test_result = result.rows[0];
        dbHealth.postgresql.test_status = 'success';
      } catch (error) {
        dbHealth.postgresql.test_status = 'failed';
        dbHealth.postgresql.test_error = error.message;
      }
    }

    if (connectionManager.isRedisHealthy()) {
      try {
        await connectionManager.redisSet('health_check', JSON.stringify({ timestamp: Date.now() }), 60);
        const testValue = await connectionManager.redisGet('health_check');
        dbHealth.redis.test_result = testValue ? 'success' : 'failed';
        dbHealth.redis.test_status = 'success';
      } catch (error) {
        dbHealth.redis.test_status = 'failed';
        dbHealth.redis.test_error = error.message;
      }
    }

    const allHealthy = dbHealth.postgresql.status === 'healthy' && dbHealth.redis.status === 'healthy';
    const statusCode = allHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      health: dbHealth,
      overall_status: allHealthy ? 'healthy' : 'degraded'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Connection metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    const connectionManager = req.connectionManager;
    const systemHealth = req.systemHealth;
    
    const metrics = {
      timestamp: new Date().toISOString(),
      
      // Connection pool metrics
      postgresql: systemHealth.summary.poolStats ? {
        totalConnections: systemHealth.summary.poolStats.totalCount,
        idleConnections: systemHealth.summary.poolStats.idleCount,
        waitingRequests: systemHealth.summary.poolStats.waitingCount,
        poolUtilization: systemHealth.summary.poolStats.totalCount > 0 
          ? ((systemHealth.summary.poolStats.totalCount - systemHealth.summary.poolStats.idleCount) / systemHealth.summary.poolStats.totalCount * 100).toFixed(2) + '%'
          : '0%'
      } : null,
      
      // Circuit breaker metrics
      circuitBreakers: systemHealth.summary.circuitBreakers,
      
      // System metrics
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        activeHandles: process._getActiveHandles().length,
        activeRequests: process._getActiveRequests().length
      }
    };

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Metrics collection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Reset circuit breakers endpoint (for debugging)
 */
router.post('/reset-circuit-breakers', async (req, res) => {
  try {
    const connectionManager = req.connectionManager;
    
    // This would reset circuit breakers if the connection manager supports it
    // For now, we'll return the current status
    const summary = connectionManager.getConnectionSummary();
    
    res.json({
      success: true,
      message: 'Circuit breaker reset requested',
      circuitBreakers: summary.circuitBreakers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Circuit breaker reset failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;