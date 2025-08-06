const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Protect stdout and stderr from EPIPE errors
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

process.stdout.write = function(chunk, encoding, callback) {
  try {
    return originalStdoutWrite.call(this, chunk, encoding, callback);
  } catch (error) {
    if (error.code === 'EPIPE' || error.message.includes('EPIPE')) {
      // Suppress EPIPE errors
      if (callback) callback();
      return true;
    }
    throw error;
  }
};

process.stderr.write = function(chunk, encoding, callback) {
  try {
    return originalStderrWrite.call(this, chunk, encoding, callback);
  } catch (error) {
    if (error.code === 'EPIPE' || error.message.includes('EPIPE')) {
      // Suppress EPIPE errors
      if (callback) callback();
      return true;
    }
    throw error;
  }
};

// Initialize robust connection manager (PostgreSQL + Redis + Cache)
const connectionManager = require('./config/connection-manager');

// Initialize auth service
const authService = require('./services/authService');

// Initialize WebSocket service
const websocketService = require('./services/websocketService');

// Initialize memory monitor
const memoryMonitor = require('./utils/memoryMonitor');

// Initialize memory optimizer
const memoryOptimizer = require('./utils/memoryOptimizer');

// Initialize crash prevention system
const crashPrevention = require('../crash-prevention');

// Initialize Railway configuration
const railwayConfig = require('../railway-config');

// Custom console transport that handles EPIPE errors
class SafeConsoleTransport extends winston.transports.Console {
  constructor(options = {}) {
    super(options);
    this.silent = false;
  }

  log(info, callback) {
    try {
      // Check if stdout/stderr are writable
      if (process.stdout.writable && process.stderr.writable) {
        super.log(info, callback);
      } else {
        // If streams are not writable, just call callback without logging
        if (callback) callback();
      }
    } catch (error) {
      // Suppress EPIPE and other stream errors
      if (error.code === 'EPIPE' || error.message.includes('EPIPE')) {
        if (callback) callback();
        return;
      }
      
      // For other errors, try to log to stderr directly
      try {
        process.stderr.write(`Logger error: ${error.message}\n`);
      } catch (stderrError) {
        // If even stderr fails, just ignore
      }
      
      if (callback) callback();
    }
  }
}

// Configure logging with EPIPE protection
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lokal-backend' },
  transports: [
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      handleExceptions: true,
      handleRejections: true
    }),
    new SafeConsoleTransport({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Enhanced transport error handling
logger.transports.forEach(transport => {
  transport.on('error', (error) => {
    // Don't log EPIPE errors to prevent infinite loops
    if (error.code === 'EPIPE' || error.message.includes('EPIPE')) {
      console.error('Logger transport EPIPE error (suppressed):', error.message);
      return;
    }
    console.error('Logger transport error:', error.message);
  });
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:19006"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Connection stability settings
const KEEP_ALIVE_TIMEOUT = 65000; // 65 seconds
const HEADERS_TIMEOUT = 66000; // 66 seconds
const MAX_CONNECTIONS = 1000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:19006"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
// app.use(morgan('combined', {
//   stream: {
//     write: (message) => logger.info(message.trim())
//   }
// }));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '500mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '500mb' }));

// Session configuration with Redis store
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_TTL) || 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use Redis store if available, otherwise use memory store
// Note: Session store setup will be handled after connection manager initialization

app.use(session(sessionConfig));

// Enhanced connection middleware with circuit breaker
app.use(async (req, res, next) => {
  try {
    // Provide connection manager to routes
    req.connectionManager = connectionManager;
    req.db = connectionManager; // Backward compatibility
    
    // Add cache helper methods
    req.cache = {
      get: (key) => connectionManager.cacheGet(key),
      set: (key, value, ttl) => connectionManager.cacheSet(key, value, ttl)
    };
    
    // Add health status to request
    req.systemHealth = {
      isHealthy: connectionManager.isOverallHealthy(),
      postgresql: connectionManager.isPostgreSQLHealthy(),
      redis: connectionManager.isRedisHealthy(),
      summary: connectionManager.getConnectionSummary()
    };
    
    next();
  } catch (error) {
    logger.error('Connection middleware error:', error);
    // Continue with degraded service
    req.connectionManager = connectionManager;
    req.db = connectionManager;
    req.cache = { get: () => null, set: () => false };
    req.systemHealth = { isHealthy: false };
    next();
  }
});

// Import routes
const videoRoutes = require('./routes/videos');
const productRoutes = require('./routes/products');
const healthRoutes = require('./routes/health');
const enhancedHealthRoutes = require('./routes/enhanced-health');
const databaseRoutes = require('./routes/database');

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/products', productRoutes);
app.use('/api/health', enhancedHealthRoutes); // Use enhanced health routes
app.use('/api/health-simple', healthRoutes); // Keep simple health as fallback
app.use('/api/database', databaseRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Handle video processing status updates
  socket.on('video-processing-status', (data) => {
    logger.info(`Video processing status update: ${JSON.stringify(data)}`);
    // Broadcast to all connected clients
    io.emit('video-status-update', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error: ${error}`);
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop memory monitoring
  memoryMonitor.stop();
  logger.info('Memory monitoring stopped');
  
  // Stop memory optimization
  memoryOptimizer.stop();
  logger.info('Memory optimization stopped');
  
  // Close WebSocket service
  try {
    websocketService.cleanup();
    logger.info('WebSocket service closed');
  } catch (error) {
    logger.error('Error closing WebSocket service:', error);
  }
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close connection manager
  try {
    await connectionManager.shutdown();
    logger.info('Connection manager shutdown complete');
  } catch (error) {
    logger.error('Error shutting down connection manager:', error);
  }

  // Close Socket.IO
  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  // Clean up crash prevention
  try {
    if (crashPrevention.cleanupTempFiles) {
      crashPrevention.cleanupTempFiles();
    }
    logger.info('Crash prevention cleanup completed');
  } catch (error) {
    logger.error('Error during crash prevention cleanup:', error);
  }

  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Initialize database and start server
async function startServer() {
  try {
    logger.info('Starting Lokal Backend Server...');
    
    // Initialize Railway configuration
    try {
      railwayConfig.initialize();
      logger.info('Railway configuration initialized');
    } catch (railwayError) {
      logger.warn('Railway configuration failed, continuing with defaults:', railwayError.message);
    }
    
    // Initialize crash prevention system
    try {
      crashPrevention.initialize();
      logger.info('Crash prevention system initialized');
    } catch (crashError) {
      logger.warn('Crash prevention initialization failed, continuing without crash protection:', crashError.message);
    }
    
    // Initialize robust connection manager
    try {
      await connectionManager.initialize();
      logger.info('Connection manager initialized successfully');
    } catch (dbError) {
      logger.warn('Connection manager initialization had issues:', dbError.message);
    }
    
    // Initialize auth service tables
    try {
      await authService.initializeTables();
      logger.info('Auth service initialized');
    } catch (authError) {
      logger.warn('Auth service initialization failed, continuing without auth tables:', authError.message);
    }
    
    // Start memory monitoring (reduced frequency to prevent memory leaks)
    try {
      // Only start memory monitoring if not already running
      if (!memoryMonitor.monitoring) {
        memoryMonitor.start();
        logger.info('Memory monitoring started');
      }
    } catch (monitorError) {
      logger.warn('Memory monitoring failed, continuing without monitoring:', monitorError.message);
    }
    
    // Start memory optimization
    try {
      memoryOptimizer.start();
      logger.info('Memory optimization started');
    } catch (optimizerError) {
      logger.warn('Memory optimization failed, continuing without optimization:', optimizerError.message);
    }
    
    // Initialize WebSocket service
    try {
      websocketService.initialize(server);
      logger.info('WebSocket service initialized');
    } catch (wsError) {
      logger.warn('WebSocket service initialization failed, continuing without real-time updates:', wsError.message);
    }
    
    // Configure server for connection stability
    server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
    server.headersTimeout = HEADERS_TIMEOUT;
    server.maxConnections = MAX_CONNECTIONS;
    
    // Make server instance available to routes
    app.set('server', server);

    // Get server configuration
    const serverConfig = railwayConfig.getServerConfig();
    
    // Start server
    server.listen(serverConfig.port, serverConfig.host, () => {
      logger.info(`🚀 Lokal Backend Server running on port ${serverConfig.port}`);
      logger.info(`📱 API available at http://${serverConfig.host}:${serverConfig.port}/api`);
      logger.info(`🏥 Health check at http://${serverConfig.host}:${serverConfig.port}/api/health`);
      logger.info(`🔌 Socket.IO available at http://${serverConfig.host}:${serverConfig.port}`);
      logger.info(`🔌 WebSocket available at ws://${serverConfig.host}:${serverConfig.port}`);
      
      // Log server configuration
      logger.info('Server Configuration:', {
        port: serverConfig.port,
        host: serverConfig.host,
        environment: process.env.NODE_ENV || 'development',
        maxConnections: MAX_CONNECTIONS,
        keepAliveTimeout: KEEP_ALIVE_TIMEOUT,
        headersTimeout: HEADERS_TIMEOUT
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = { app, server, io, connectionManager };