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

// Load environment variables
dotenv.config();

// Initialize database manager (PostgreSQL + Redis + Cache)
const databaseManager = require('./config/database');

// Initialize auth service
const authService = require('./services/authService');

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
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
let sessionStore;
try {
  const RedisStore = require('connect-redis').default;
  const redis = require('redis');
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  sessionStore = new RedisStore({ client: redisClient });
  console.log('✅ Redis session store configured');
} catch (error) {
  console.warn('⚠️ Redis not available, using memory session store');
  sessionStore = undefined;
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_TTL) || 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await databaseManager.getStatus();
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    res.json({
      status: 'OK',
      message: 'Lokal Backend Server is running',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      database: {
        postgresql: dbStatus.postgresql ? 'Available' : 'Unavailable',
        redis: dbStatus.redis === 'ready' ? 'Available' : 'Unavailable',
        cache: dbStatus.cache ? 'Available' : 'Unavailable'
      },
      features: {
        yolo: 'Available',
        openai: 'Not configured',
        hybrid: 'YOLO-only',
        redis: dbStatus.redis === 'ready' ? 'Available' : 'Unavailable',
        cache: dbStatus.cache ? 'Available' : 'Unavailable'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Import routes
const healthRoutes = require('./routes/health');
const productsRoutes = require('./routes/products');
const videosRoutes = require('./routes/videos');
const databaseRoutes = require('./routes/database');

// Use routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/database', databaseRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  socket.on('video-upload-progress', (data) => {
    socket.broadcast.emit('video-upload-update', data);
  });
  
  socket.on('detection-progress', (data) => {
    socket.broadcast.emit('detection-update', data);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close database connections
    await databaseManager.close();
    console.log('✅ Database connections closed');
    
    // Close Socket.IO
    io.close(() => {
      console.log('✅ Socket.IO server closed');
    });
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Lokal Backend Server...');
    
    // Initialize database connections
    await databaseManager.initialize();
    console.log('✅ Database connections initialized');
    
    // Initialize auth service
    await authService.initialize();
    console.log('✅ Auth service initialized');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.IO ready`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 