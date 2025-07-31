#!/usr/bin/env node

const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Railway-specific logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'railway-config' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class RailwayConfig {
  constructor() {
    this.isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
    this.port = process.env.PORT || 3001;
    this.host = '0.0.0.0'; // Railway requires binding to 0.0.0.0
  }

  /**
   * Initialize Railway-specific configuration
   */
  initialize() {
    logger.info('🚂 Initializing Railway Configuration...');
    
    if (this.isRailway) {
      logger.info('✅ Running on Railway platform');
      this.setupRailwayEnvironment();
    } else {
      logger.info('ℹ️ Running in local environment');
    }
    
    this.validateEnvironment();
    this.setupProcessHandlers();
    
    logger.info('✅ Railway Configuration initialized');
  }

  /**
   * Set up Railway-specific environment
   */
  setupRailwayEnvironment() {
    // Railway-specific environment variables
    const railwayVars = {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: this.port,
      // Railway automatically provides these
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
      RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID
    };

    // Set Railway-specific defaults
    Object.entries(railwayVars).forEach(([key, value]) => {
      if (value && !process.env[key]) {
        process.env[key] = value;
        logger.info(`Set Railway environment variable: ${key}`);
      }
    });

    // Railway-specific connection settings
    process.env.KEEP_ALIVE_TIMEOUT = '65000';
    process.env.HEADERS_TIMEOUT = '66000';
    process.env.MAX_CONNECTIONS = '1000';
    
    // Railway-specific logging
    process.env.LOG_LEVEL = 'info';
    
    logger.info('Railway environment configured');
  }

  /**
   * Validate environment variables
   */
  validateEnvironment() {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'REDIS_HOST',
      'REDIS_PASSWORD'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.error('❌ Missing required environment variables:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.info('✅ All required environment variables are present');
  }

  /**
   * Set up process handlers for Railway
   */
  setupProcessHandlers() {
    // Handle Railway-specific signals
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM from Railway, initiating shutdown...');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, initiating shutdown...');
      this.gracefulShutdown();
    });

    // Handle Railway container restarts
    process.on('exit', (code) => {
      logger.info(`Process exiting with code: ${code}`);
    });

    // Handle uncaught exceptions (Railway will restart the container)
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception in Railway environment:', error);
      // Don't exit immediately, let Railway handle the restart
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection in Railway environment:', reason);
      // Don't exit immediately, let Railway handle the restart
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  /**
   * Graceful shutdown for Railway
   */
  gracefulShutdown() {
    logger.info('🔄 Railway graceful shutdown initiated...');
    
    // Give Railway time to route traffic away
    setTimeout(() => {
      logger.info('✅ Railway graceful shutdown completed');
      process.exit(0);
    }, 5000);
  }

  /**
   * Get Railway configuration
   */
  getConfig() {
    return {
      isRailway: this.isRailway,
      port: this.port,
      host: this.host,
      environment: process.env.NODE_ENV,
      railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
      railwayProjectId: process.env.RAILWAY_PROJECT_ID
    };
  }

  /**
   * Check if running on Railway
   */
  isRailwayEnvironment() {
    return this.isRailway;
  }

  /**
   * Get server configuration for Railway
   */
  getServerConfig() {
    return {
      port: this.port,
      host: this.host,
      keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 65000,
      headersTimeout: parseInt(process.env.HEADERS_TIMEOUT) || 66000,
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000
    };
  }
}

// Create singleton instance
const railwayConfig = new RailwayConfig();

module.exports = railwayConfig; 