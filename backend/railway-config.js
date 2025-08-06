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
    this.isRailway = this.detectRailwayEnvironment();
    this.port = process.env.PORT || 3001;
    this.host = '0.0.0.0'; // Railway requires binding to 0.0.0.0
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Detect if running on Railway
   */
  detectRailwayEnvironment() {
    return !!(process.env.RAILWAY_ENVIRONMENT || 
              process.env.RAILWAY_PROJECT_ID || 
              process.env.RAILWAY_STATIC_URL ||
              process.env.RAILWAY_PUBLIC_DOMAIN);
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
      this.setupLocalEnvironment();
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
    
    // Railway-specific security
    process.env.NODE_ENV = 'production';
    
    logger.info('Railway environment configured');
  }

  /**
   * Set up local development environment
   */
  setupLocalEnvironment() {
    // Local development settings
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'debug';
    process.env.KEEP_ALIVE_TIMEOUT = '30000';
    process.env.HEADERS_TIMEOUT = '31000';
    process.env.MAX_CONNECTIONS = '100';
    
    logger.info('Local development environment configured');
  }

  /**
   * Validate environment variables
   */
  validateEnvironment() {
    const requiredVars = [];
    const optionalVars = [
      'DATABASE_URL',
      'POSTGRES_URL',
      'REDIS_URL',
      'REDIS_HOST',
      'REDIS_PASSWORD',
      'JWT_SECRET',
      'REFRESH_SECRET',
      'SESSION_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];

    // Check required variables based on environment
    if (this.isRailway) {
      requiredVars.push('DATABASE_URL', 'REDIS_URL');
    }

    const missingRequired = requiredVars.filter(varName => !process.env[varName]);
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);
    
    if (missingRequired.length > 0) {
      logger.error('❌ Missing required environment variables:', missingRequired);
      throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    }

    if (missingOptional.length > 0) {
      logger.warn('⚠️ Missing optional environment variables:', missingOptional);
    }

    logger.info('✅ Environment validation completed');
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
      environment: this.environment,
      railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
      railwayProjectId: process.env.RAILWAY_PROJECT_ID,
      railwayStaticUrl: process.env.RAILWAY_STATIC_URL,
      railwayPublicDomain: process.env.RAILWAY_PUBLIC_DOMAIN
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

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      redisUrl: process.env.REDIS_URL,
      redisHost: process.env.REDIS_HOST,
      redisPassword: process.env.REDIS_PASSWORD,
      redisPort: process.env.REDIS_PORT || 6379
    };
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      refreshSecret: process.env.REFRESH_SECRET,
      sessionSecret: process.env.SESSION_SECRET,
      nodeEnv: this.environment
    };
  }

  /**
   * Log configuration summary
   */
  logConfigurationSummary() {
    logger.info('📋 Railway Configuration Summary:');
    logger.info(`   Environment: ${this.environment}`);
    logger.info(`   Railway: ${this.isRailway ? 'Yes' : 'No'}`);
    logger.info(`   Port: ${this.port}`);
    logger.info(`   Host: ${this.host}`);
    logger.info(`   Database: ${this.getDatabaseConfig().databaseUrl ? 'Configured' : 'Not configured'}`);
    logger.info(`   Redis: ${this.getDatabaseConfig().redisUrl ? 'Configured' : 'Not configured'}`);
    logger.info(`   JWT Secret: ${this.getSecurityConfig().jwtSecret ? 'Configured' : 'Not configured'}`);
  }
}

// Create singleton instance
const railwayConfig = new RailwayConfig();

module.exports = railwayConfig; 