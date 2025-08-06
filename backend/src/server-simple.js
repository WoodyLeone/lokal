const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../env.development') });

// Protect stdout and stderr from EPIPE errors
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

process.stdout.write = function(chunk, encoding, callback) {
  try {
    return originalStdoutWrite.call(this, chunk, encoding, callback);
  } catch (error) {
    if (error.code === 'EPIPE' || error.message.includes('EPIPE')) {
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
      if (callback) callback();
      return true;
    }
    throw error;
  }
};

// Initialize simplified database manager
const databaseManager = require('./config/database-simple');

// Initialize auth service
const authService = require('./services/authService-simple');

// Custom console transport that handles EPIPE errors
class SafeConsoleTransport extends winston.transports.Console {
  constructor(options = {}) {
    super(options);
    this.silent = false;
  }

  log(info, callback) {
    try {
      if (process.stdout.writable && process.stderr.writable) {
        super.log(info, callback);
      } else {
        if (callback) callback();
      }
    } catch (error) {
      if (error.code === 'EPIPE' || error.message.includes('EPIPE')) {
        if (callback) callback();
        return;
      }
      
      try {
        process.stderr.write(`Logger error: ${error.message}\n`);
      } catch (stderrError) {
        // If even stderr fails, just ignore
      }
      
      if (callback) callback();
    }
  }
}

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
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new SafeConsoleTransport({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store server reference for health checks
app.set('server', server);

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
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use('/static', express.static(path.join(__dirname, '../temp')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = databaseManager.getStatus();
    
    const healthStatus = {
      status: 'OK',
      message: 'Lokal Backend Server (Simple) is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        redis: dbStatus.redis === 'ready' ? 'Available' : 'Unavailable',
        cache: dbStatus.cache ? 'Available' : 'Unavailable'
      },
      features: {
        yolo: 'Available',
        openai: process.env.OPENAI_API_KEY ? 'Available' : 'Not configured',
        hybrid: process.env.OPENAI_API_KEY ? 'Available' : 'YOLO-only',
        redis: dbStatus.redis === 'ready' ? 'Available' : 'Unavailable',
        cache: dbStatus.cache ? 'Available' : 'Unavailable'
      }
    };

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

// API Routes
app.use('/api/health', require('./routes/health-simple'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/products', require('./routes/products'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Video processing progress updates
  socket.on('video-progress', (data) => {
    socket.broadcast.emit('video-progress-update', data);
  });

  // Object detection progress
  socket.on('detection-progress', (data) => {
    socket.broadcast.emit('detection-progress-update', data);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await databaseManager.close();
    
    // Close server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    logger.info('Starting Lokal Backend Server (Simple)...');
    
    // Initialize database connections
    await databaseManager.initialize();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🔗 API base: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 