const express = require('express');
const router = express.Router();
const databaseManager = require('../config/database');

/**
 * @route GET /api/health
 * @desc Get overall health status
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = databaseManager.getStatus();
    const openaiStatus = process.env.OPENAI_API_KEY ? 'Available' : 'Not configured';
    
    const healthStatus = {
      status: 'OK',
      message: 'Lokal Backend Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbStatus,
      features: {
        yolo: 'Available',
        openai: openaiStatus,
        hybrid: process.env.OPENAI_API_KEY ? 'Available' : 'YOLO-only',
        redis: dbStatus.redis === 'ready' ? 'Available' : 'Unavailable',
        cache: dbStatus.cache ? 'Available' : 'Unavailable'
      }
    };

    // Check if database is healthy
    if (!dbStatus.isConnected) {
      healthStatus.status = 'DEGRADED';
      healthStatus.message = 'Database connection issues detected';
    }

    res.json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/database
 * @desc Get database health status
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    const dbStatus = databaseManager.getStatus();
    
    // Test database connections
    const tests = {
      supabase: false,
      redis: false,
      cache: false
    };

    // Test Supabase
    try {
      if (databaseManager.getSupabase()) {
        const { error } = await databaseManager.getSupabase()
          .from('videos')
          .select('count')
          .limit(1);
        
        tests.supabase = !error;
      }
    } catch (error) {
      tests.supabase = false;
    }

    // Test Redis
    try {
      if (databaseManager.getRedis() && databaseManager.getRedis().status === 'ready') {
        await databaseManager.getRedis().ping();
        tests.redis = true;
      }
    } catch (error) {
      tests.redis = false;
    }

    // Test cache
    try {
      if (databaseManager.getCache()) {
        databaseManager.getCache().set('health-test', 'ok', 10);
        const result = databaseManager.getCache().get('health-test');
        tests.cache = result === 'ok';
      }
    } catch (error) {
      tests.cache = false;
    }

    const status = {
      overall: tests.supabase && (tests.redis || tests.cache),
      details: {
        supabase: {
          connected: tests.supabase,
          status: dbStatus.supabase ? 'connected' : 'disconnected'
        },
        redis: {
          connected: tests.redis,
          status: dbStatus.redis
        },
        cache: {
          connected: tests.cache,
          status: dbStatus.cache ? 'available' : 'unavailable'
        }
      },
      reconnectAttempts: dbStatus.reconnectAttempts,
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    res.status(503).json({
      overall: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/cache
 * @desc Get cache health status
 * @access Public
 */
router.get('/cache', async (req, res) => {
  try {
    const cache = databaseManager.getCache();
    const redis = databaseManager.getRedis();
    
    const status = {
      memory: {
        available: !!cache,
        keys: cache ? cache.keys().length : 0,
        stats: cache ? cache.getStats() : null
      },
      redis: {
        available: !!(redis && redis.status === 'ready'),
        status: redis ? redis.status : 'disconnected'
      },
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    res.status(503).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/health/cache/clear
 * @desc Clear all caches
 * @access Public
 */
router.post('/cache/clear', async (req, res) => {
  try {
    await databaseManager.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/ready
 * @desc Check if service is ready to handle requests
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    const dbStatus = databaseManager.getStatus();
    
    // Service is ready if database is connected
    const isReady = dbStatus.isConnected;
    
    if (isReady) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/live
 * @desc Liveness probe - check if service is alive
 * @access Public
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 