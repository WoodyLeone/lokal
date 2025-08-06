/**
 * Rate Limiting Middleware using Redis
 * Provides rate limiting for various API endpoints
 */

const redisService = require('../services/redisService');

/**
 * Rate limiting middleware factory
 */
const createRateLimiter = (action, limit, windowMs) => {
  return async (req, res, next) => {
    try {
      // Get user ID from request (you can customize this based on your auth system)
      const userId = req.user?.id || req.ip || 'anonymous';
      
      // Check rate limit
      const rateLimitResult = await redisService.checkRateLimit(userId, action, limit, windowMs);
      
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many ${action} requests`,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limit,
        'X-RateLimit-Remaining': rateLimitResult.remaining,
        'X-RateLimit-Reset': rateLimitResult.resetTime,
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Allow request if rate limiting fails
      next();
    }
  };
};

/**
 * Upload rate limiting middleware
 */
const uploadRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip || 'anonymous';
    const rateLimitResult = await redisService.checkUploadRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Upload rate limit exceeded',
        message: 'Too many upload requests',
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }
    
    res.set({
      'X-RateLimit-Limit': process.env.RATE_LIMIT_UPLOADS || 10,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': rateLimitResult.resetTime,
      'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    });
    
    next();
  } catch (error) {
    console.error('Upload rate limiting error:', error);
    next();
  }
};

/**
 * API rate limiting middleware
 */
const apiRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip || 'anonymous';
    const rateLimitResult = await redisService.checkAPIRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'Too many API requests',
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }
    
    res.set({
      'X-RateLimit-Limit': process.env.RATE_LIMIT_API || 100,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': rateLimitResult.resetTime,
      'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    });
    
    next();
  } catch (error) {
    console.error('API rate limiting error:', error);
    next();
  }
};

/**
 * Detection rate limiting middleware
 */
const detectionRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip || 'anonymous';
    const rateLimitResult = await redisService.checkDetectionRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Detection rate limit exceeded',
        message: 'Too many object detection requests',
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }
    
    res.set({
      'X-RateLimit-Limit': process.env.RATE_LIMIT_DETECTION || 5,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': rateLimitResult.resetTime,
      'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    });
    
    next();
  } catch (error) {
    console.error('Detection rate limiting error:', error);
    next();
  }
};

/**
 * Custom rate limiter for specific actions
 */
const customRateLimiter = (action, limit, windowMs) => {
  return createRateLimiter(action, limit, windowMs);
};

module.exports = {
  uploadRateLimiter,
  apiRateLimiter,
  detectionRateLimiter,
  customRateLimiter,
  createRateLimiter
}; 