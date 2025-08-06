#!/usr/bin/env node

/**
 * Railway Configuration Setup Script
 * This script configures all environment files with Railway connection information
 */

const fs = require('fs');
const path = require('path');

// Railway configuration from your account
const RAILWAY_CONFIG = {
  // Database Configuration
  DATABASE_URL: 'postgresql://postgres:olgtwNjDXPQbkNNuknFliLDomEKjaLTK@mainline.proxy.rlwy.net:25135/railway',
  
  // Redis Configuration
  REDIS_URL: 'redis://default:AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA@exact-sturgeon-62017.upstash.io:6379',
  REDIS_HOST: 'exact-sturgeon-62017.upstash.io',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: 'AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA',
  REDIS_DB: '0',
  
  // Backend URLs
  BACKEND_URL_DEV: 'https://lokal-dev-production.up.railway.app',
  BACKEND_URL_PROD: 'https://lokal-dev-production.up.railway.app',
  
  // Security (from Railway variables)
  JWT_SECRET: 'VnkmzR4oxJTwq+JrVAHjD04/q8RkvWq4kZ6vOc7dQCk=',
  SESSION_SECRET: 'cpPriCnAccrePFoOJ5zzP6N+ZLZJhd4HidU8pyb6llw=',
  REFRESH_SECRET: 'f21d6272a23d0c786a50e6f9bd0bbc7e41345cefb11fddc91ba9b47d8f824a40be421fb708a57a18682ac948f625d354bf7b26d7cd047ca593a1418003a38c49',
  
  // Environment settings
  NODE_ENV_PRODUCTION: 'production',
  NODE_ENV_DEVELOPMENT: 'development',
  PORT: '3001',
  
  // Feature flags
  DEMO_MODE: 'false',
  PRODUCTION_MATCHING: 'true',
  DETECTION_CONFIDENCE_THRESHOLD: '0.7',
  SUGGESTION_RELEVANCE_THRESHOLD: '0.6'
};

function createEnvFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${filePath}:`, error.message);
    return false;
  }
}

function setupRailwayConfig() {
  console.log('🚀 Setting up Railway Configuration...\n');
  
  // 1. Create root .env file for React Native app
  const rootEnvContent = `# Railway Environment Configuration for React Native
# Generated automatically from Railway setup

# Railway Backend API URLs
EXPO_PUBLIC_API_BASE_URL=${RAILWAY_CONFIG.BACKEND_URL_DEV}/api
EXPO_PUBLIC_API_BASE_URL_PROD=${RAILWAY_CONFIG.BACKEND_URL_PROD}/api

# Database Configuration (if needed for direct access)
EXPO_PUBLIC_DATABASE_URL=${RAILWAY_CONFIG.DATABASE_URL}

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_ENABLE_OBJECT_DETECTION=true
EXPO_PUBLIC_ENABLE_PRODUCT_MATCHING=true
EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD=true
EXPO_PUBLIC_ENABLE_FILE_UPLOAD=true

# Video Configuration
EXPO_PUBLIC_MAX_VIDEO_DURATION=180
EXPO_PUBLIC_MAX_VIDEO_SIZE=524288000
EXPO_PUBLIC_SUPPORTED_VIDEO_FORMATS=mp4,mov,avi,mkv

# Object Detection Configuration
EXPO_PUBLIC_CONFIDENCE_THRESHOLD=0.5
EXPO_PUBLIC_MAX_DETECTED_OBJECTS=10

# Product Matching Configuration
EXPO_PUBLIC_MAX_MATCHED_PRODUCTS=6
EXPO_PUBLIC_PRODUCT_MATCH_THRESHOLD=0.3

# Upload Configuration
EXPO_PUBLIC_UPLOAD_TIMEOUT=120000
EXPO_PUBLIC_DETECTION_TIMEOUT=300000

# Debug Configuration
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_DEV_MODE=false

# Railway Environment Info
EXPO_PUBLIC_RAILWAY_ENVIRONMENT=production
EXPO_PUBLIC_RAILWAY_PROJECT_NAME=lokal-prod
`;

  // 2. Create backend production environment
  const backendProdEnvContent = `# Production Environment Configuration
NODE_ENV=${RAILWAY_CONFIG.NODE_ENV_PRODUCTION}
PORT=${RAILWAY_CONFIG.PORT}

# Railway PostgreSQL Configuration
DATABASE_URL=${RAILWAY_CONFIG.DATABASE_URL}

# Railway Redis Configuration
REDIS_URL=${RAILWAY_CONFIG.REDIS_URL}
REDIS_HOST=${RAILWAY_CONFIG.REDIS_HOST}
REDIS_PORT=${RAILWAY_CONFIG.REDIS_PORT}
REDIS_PASSWORD=${RAILWAY_CONFIG.REDIS_PASSWORD}
REDIS_DB=${RAILWAY_CONFIG.REDIS_DB}

# OpenAI Configuration (set in Railway dashboard)
OPENAI_API_KEY=\${OPENAI_API_KEY}
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=300
OPENAI_BATCH_SIZE=3
MAX_OPENAI_CALLS_PER_VIDEO=20
OPENAI_CONFIDENCE_THRESHOLD=0.7
OPENAI_CACHE_EXPIRY=86400

# Video Processing Pipeline Configuration
MAX_PROCESSING_TIME=300000
ENABLE_COST_OPTIMIZATION=true
SAVE_INTERMEDIATE_RESULTS=false

# Frame Extraction Configuration
MAX_FRAMES_PER_SECOND=2
MAX_FRAME_WIDTH=640
MAX_FRAME_HEIGHT=480
MIN_FRAME_INTERVAL=500
MAX_FRAMES_PER_VIDEO=30

# Object Detection Configuration
CONFIDENCE_THRESHOLD=0.5
IOU_THRESHOLD=0.45
MIN_TRACK_DURATION=3
MAX_TRACKS_PER_FRAME=10
TRACK_CONFIDENCE_THRESHOLD=0.6

# Object Cropping Configuration
MIN_CROP_SIZE=50
MAX_CROP_SIZE=512
CROP_QUALITY=85
CROP_FORMAT=jpeg
CROP_OUTPUT_DIR=./temp/crops

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# File Upload Configuration
MAX_FILE_SIZE=500000000
UPLOAD_TIMEOUT=120000

# Security Configuration (from Railway)
JWT_SECRET=${RAILWAY_CONFIG.JWT_SECRET}
SESSION_SECRET=${RAILWAY_CONFIG.SESSION_SECRET}
REFRESH_SECRET=${RAILWAY_CONFIG.REFRESH_SECRET}

# Rate Limiting (more restrictive for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# CORS Configuration (allow all origins for production)
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Cache Configuration
CACHE_TTL=300
CACHE_CHECK_PERIOD=60
HEARTBEAT_INTERVAL=30000

# Production specific settings
DEMO_MODE=${RAILWAY_CONFIG.DEMO_MODE}
PRODUCTION_MATCHING=${RAILWAY_CONFIG.PRODUCTION_MATCHING}
ENABLE_FEEDBACK=true
ENABLE_LEARNING=true
DETECTION_CONFIDENCE_THRESHOLD=${RAILWAY_CONFIG.DETECTION_CONFIDENCE_THRESHOLD}
SUGGESTION_RELEVANCE_THRESHOLD=${RAILWAY_CONFIG.SUGGESTION_RELEVANCE_THRESHOLD}
DEBUG_MODE=false
ENABLE_DEMO_FALLBACK=false

# Railway Environment Variables
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_NAME=lokal-prod
RAILWAY_SERVICE_NAME=Lokal-Dev
`;

  // 3. Create backend development environment
  const backendDevEnvContent = `# Development Environment Configuration
NODE_ENV=${RAILWAY_CONFIG.NODE_ENV_DEVELOPMENT}
PORT=${RAILWAY_CONFIG.PORT}

# Railway PostgreSQL Configuration (same as production for testing)
DATABASE_URL=${RAILWAY_CONFIG.DATABASE_URL}

# Railway Redis Configuration (same as production for testing)
REDIS_URL=${RAILWAY_CONFIG.REDIS_URL}
REDIS_HOST=${RAILWAY_CONFIG.REDIS_HOST}
REDIS_PORT=${RAILWAY_CONFIG.REDIS_PORT}
REDIS_PASSWORD=${RAILWAY_CONFIG.REDIS_PASSWORD}
REDIS_DB=${RAILWAY_CONFIG.REDIS_DB}

# OpenAI Configuration (Optional for testing)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=300
OPENAI_BATCH_SIZE=3
MAX_OPENAI_CALLS_PER_VIDEO=20
OPENAI_CONFIDENCE_THRESHOLD=0.7
OPENAI_CACHE_EXPIRY=86400

# Video Processing Pipeline Configuration
MAX_PROCESSING_TIME=300000
ENABLE_COST_OPTIMIZATION=true
SAVE_INTERMEDIATE_RESULTS=false

# Frame Extraction Configuration
MAX_FRAMES_PER_SECOND=2
MAX_FRAME_WIDTH=640
MAX_FRAME_HEIGHT=480
MIN_FRAME_INTERVAL=500
MAX_FRAMES_PER_VIDEO=30

# Object Detection Configuration
CONFIDENCE_THRESHOLD=0.5
IOU_THRESHOLD=0.45
MIN_TRACK_DURATION=3
MAX_TRACKS_PER_FRAME=10
TRACK_CONFIDENCE_THRESHOLD=0.6

# Object Cropping Configuration
MIN_CROP_SIZE=50
MAX_CROP_SIZE=512
CROP_QUALITY=85
CROP_FORMAT=jpeg
CROP_OUTPUT_DIR=./temp/crops

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# File Upload Configuration
MAX_FILE_SIZE=500000000
UPLOAD_TIMEOUT=120000

# Security Configuration (development secrets)
JWT_SECRET=dev_jwt_secret_12345
SESSION_SECRET=dev_session_secret_12345
REFRESH_SECRET=dev_refresh_secret_12345

# Rate Limiting (less restrictive for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Cache Configuration
CACHE_TTL=300
CACHE_CHECK_PERIOD=60
HEARTBEAT_INTERVAL=30000

# Development specific settings
DEMO_MODE=true
PRODUCTION_MATCHING=false
ENABLE_FEEDBACK=true
ENABLE_LEARNING=true
DETECTION_CONFIDENCE_THRESHOLD=0.5
SUGGESTION_RELEVANCE_THRESHOLD=0.5
DEBUG_MODE=true
ENABLE_DEMO_FALLBACK=true

# Railway Environment Variables
RAILWAY_ENVIRONMENT=development
RAILWAY_PROJECT_NAME=lokal-prod
RAILWAY_SERVICE_NAME=Lokal-Dev
`;

  // Create the files
  const files = [
    { path: '.env', content: rootEnvContent },
    { path: 'backend/.env.production', content: backendProdEnvContent },
    { path: 'backend/.env.development', content: backendDevEnvContent }
  ];

  let successCount = 0;
  files.forEach(file => {
    if (createEnvFile(file.path, file.content)) {
      successCount++;
    }
  });

  console.log(`\n📊 Configuration Summary:`);
  console.log(`✅ Created ${successCount}/${files.length} environment files`);
  console.log(`\n🔗 Railway URLs:`);
  console.log(`   Development: ${RAILWAY_CONFIG.BACKEND_URL_DEV}`);
  console.log(`   Production:  ${RAILWAY_CONFIG.BACKEND_URL_PROD}`);
  console.log(`\n🗄️  Database: PostgreSQL (Railway)`);
  console.log(`   Host: mainline.proxy.rlwy.net:25135`);
  console.log(`   Database: railway`);
  console.log(`\n🔴 Redis: Upstash`);
  console.log(`   Host: ${RAILWAY_CONFIG.REDIS_HOST}:${RAILWAY_CONFIG.REDIS_PORT}`);
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Test database connection: npm run test-railway-connection`);
  console.log(`2. Test backend connectivity: npm run test-backend-connectivity`);
  console.log(`3. Deploy to Railway: railway up`);
  console.log(`4. Monitor logs: railway logs`);
};

// Run if called directly
if (require.main === module) {
  setupRailwayConfig();
}

module.exports = { setupRailwayConfig, RAILWAY_CONFIG }; 