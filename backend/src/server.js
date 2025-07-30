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

// Initialize database manager
const databaseManager = require('./config/database');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lokal-backend' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/app.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
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
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

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
if (databaseManager.getRedis() && databaseManager.getRedis().status === 'ready') {
  sessionConfig.store = new RedisStore({ client: databaseManager.getRedis() });
  logger.info('Using Redis session store');
} else {
  logger.warn('Redis not available, using memory session store');
}

app.use(session(sessionConfig));

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    if (!databaseManager.isDatabaseConnected()) {
      logger.warn('Database not connected, attempting reconnection...');
      await databaseManager.initialize();
    }
    req.db = databaseManager;
    next();
  } catch (error) {
    logger.error('Database middleware error:', error);
    res.status(503).json({
      success: false,
      error: 'Database service unavailable',
      retryAfter: 30
    });
  }
});

// Cache middleware
app.use((req, res, next) => {
  req.cache = databaseManager.getCache();
  next();
});

// Import routes
const videoRoutes = require('./routes/videos');
const productRoutes = require('./routes/products');
const healthRoutes = require('./routes/health');

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/products', productRoutes);
app.use('/api/health', healthRoutes);

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

// Health check endpoint
app.get('/api/health', async (req, res) => {
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
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
app.use('*', (req, res) => {
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
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  try {
    await databaseManager.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }

  // Close Socket.IO
  io.close(() => {
    logger.info('Socket.IO server closed');
  });

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
    
    // Initialize database connections
    await databaseManager.initialize();
    logger.info('Database connections initialized');
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Lokal Backend Server running on port ${PORT}`);
      logger.info(`📱 API available at http://localhost:${PORT}/api`);
      logger.info(`🌐 Network API available at http://192.168.1.207:${PORT}/api`);
      logger.info(`🏥 Health check at http://localhost:${PORT}/api/health`);
      logger.info(`🔌 Socket.IO available at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = { app, server, io, databaseManager }; 