#!/usr/bin/env node

/**
 * Complete Railway Setup Script
 * This script sets up everything for Railway deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

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

async function setupRailwayComplete() {
  console.log('🚀 Complete Railway Setup for Lokal...\n');
  
  // Step 1: Check Railway CLI
  console.log('📋 Step 1: Checking Railway CLI...');
  const railwayStatus = runCommand('railway whoami', 'Checking Railway login status');
  if (!railwayStatus.success) {
    console.log('❌ Please login to Railway first: railway login');
    return;
  }
  
  // Step 2: Check project status
  console.log('\n📋 Step 2: Checking Railway project status...');
  const projectStatus = runCommand('railway status', 'Checking project status');
  
  // Step 3: Create environment files
  console.log('\n📋 Step 3: Creating environment files...');
  
  // Root .env for React Native
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

  // Backend production environment
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

  // Backend development environment
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

  // Step 4: Test connections
  console.log('\n📋 Step 4: Testing connections...');
  
  // Test database connection
  const dbTest = runCommand('node scripts/test-railway-connection.js', 'Testing database connection');
  
  // Test backend connectivity
  const backendTest = runCommand('node scripts/test-railway-backend.js', 'Testing backend connectivity');
  
  // Step 5: Create deployment scripts
  console.log('\n📋 Step 5: Creating deployment scripts...');
  
  const deployScript = `#!/bin/bash
# Railway Deployment Script

echo "🚀 Deploying to Railway..."

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
  echo "❌ railway.json not found. Make sure you're in the project root."
  exit 1
fi

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🔗 Check your Railway dashboard for deployment status"
`;

  const deployScriptPath = 'deploy-railway.sh';
  fs.writeFileSync(deployScriptPath, deployScript);
  runCommand(`chmod +x ${deployScriptPath}`, 'Making deploy script executable');
  
  // Step 6: Create environment switching script
  console.log('\n📋 Step 6: Creating environment switching script...');
  
  const switchEnvScript = `#!/bin/bash
# Railway Environment Switching Script

ENVIRONMENT=\${1:-production}

echo "🔄 Switching to \${ENVIRONMENT} environment..."

case \$ENVIRONMENT in
  "production"|"prod")
    echo "📋 Linking to production environment..."
    railway link -p lokal-prod -e production
    echo "✅ Switched to production environment"
    ;;
  "development"|"dev")
    echo "📋 Linking to development environment..."
    railway link -p lokal-prod -e development
    echo "✅ Switched to development environment"
    ;;
  *)
    echo "❌ Invalid environment. Use 'production' or 'development'"
    exit 1
    ;;
esac

echo "📊 Current status:"
railway status
`;

  const switchEnvScriptPath = 'switch-railway-env.sh';
  fs.writeFileSync(switchEnvScriptPath, switchEnvScript);
  runCommand(`chmod +x ${switchEnvScriptPath}`, 'Making environment switch script executable');
  
  // Step 7: Summary
  console.log('\n🎉 Railway Setup Complete!\n');
  
  console.log('📊 Configuration Summary:');
  console.log(`✅ Created ${successCount}/${files.length} environment files`);
  console.log(`✅ Database connection: ${dbTest.success ? 'Working' : 'Failed'}`);
  console.log(`✅ Backend connectivity: ${backendTest.success ? 'Working' : 'Failed'}`);
  console.log(`✅ Created deployment scripts`);
  
  console.log('\n🔗 Railway URLs:');
  console.log(`   Development: ${RAILWAY_CONFIG.BACKEND_URL_DEV}`);
  console.log(`   Production:  ${RAILWAY_CONFIG.BACKEND_URL_PROD}`);
  
  console.log('\n🗄️  Database: PostgreSQL (Railway)');
  console.log(`   Host: mainline.proxy.rlwy.net:25135`);
  console.log(`   Database: railway`);
  
  console.log('\n🔴 Redis: Upstash');
  console.log(`   Host: ${RAILWAY_CONFIG.REDIS_HOST}:${RAILWAY_CONFIG.REDIS_PORT}`);
  
  console.log('\n📋 Available Commands:');
  console.log('   ./deploy-railway.sh                    - Deploy to Railway');
  console.log('   ./switch-railway-env.sh production     - Switch to production');
  console.log('   ./switch-railway-env.sh development    - Switch to development');
  console.log('   railway status                         - Check project status');
  console.log('   railway logs                           - View deployment logs');
  console.log('   railway variables                      - View environment variables');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy to Railway: ./deploy-railway.sh');
  console.log('2. Monitor deployment: railway logs');
  console.log('3. Test your app with the new Railway backend');
  console.log('4. Set up OpenAI API key in Railway dashboard if needed');
};

// Run if called directly
if (require.main === module) {
  setupRailwayComplete();
}

module.exports = { setupRailwayComplete, RAILWAY_CONFIG }; 