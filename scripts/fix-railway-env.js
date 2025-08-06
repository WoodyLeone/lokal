#!/usr/bin/env node

/**
 * Fix Railway Environment Variables
 * This script updates Railway environment variables to match backend expectations
 */

const { execSync } = require('child_process');

// Railway configuration that matches backend expectations
const RAILWAY_ENV_VARS = {
  // Database Configuration
  'DATABASE_URL': 'postgresql://postgres:olgtwNjDXPQbkNNuknFliLDomEKjaLTK@mainline.proxy.rlwy.net:25135/railway',
  'POSTGRES_URL': 'postgresql://postgres:olgtwNjDXPQbkNNuknFliLDomEKjaLTK@mainline.proxy.rlwy.net:25135/railway',
  
  // Redis Configuration (Upstash format that backend expects)
  'UPSTASH_REDIS_REST_URL': 'https://exact-sturgeon-62017.upstash.io',
  'UPSTASH_REDIS_REST_TOKEN': 'AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA',
  'REDIS_URL': 'redis://default:AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA@exact-sturgeon-62017.upstash.io:6379',
  'REDIS_HOST': 'exact-sturgeon-62017.upstash.io',
  'REDIS_PORT': '6379',
  'REDIS_PASSWORD': 'AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA',
  'REDIS_DB': '0',
  
  // Server Configuration
  'NODE_ENV': 'production',
  'PORT': '3001',
  'HOST': '0.0.0.0',
  
  // Security Configuration
  'JWT_SECRET': 'VnkmzR4oxJTwq+JrVAHjD04/q8RkvWq4kZ6vOc7dQCk=',
  'SESSION_SECRET': 'cpPriCnAccrePFoOJ5zzP6N+ZLZJhd4HidU8pyb6llw=',
  'REFRESH_SECRET': 'f21d6272a23d0c786a50e6f9bd0bbc7e41345cefb11fddc91ba9b47d8f824a40be421fb708a57a18682ac948f625d354bf7b26d7cd047ca593a1418003a38c49',
  
  // Logging Configuration
  'LOG_LEVEL': 'info',
  'LOG_FILE': './logs/app.log',
  
  // Cache Configuration
  'CACHE_TTL': '300',
  'CACHE_CHECK_PERIOD': '60',
  'CACHE_MAX_KEYS': '1000',
  'HEARTBEAT_INTERVAL': '30000',
  
  // Connection Configuration
  'RECONNECT_ATTEMPTS': '5',
  'RECONNECT_DELAY': '1000',
  'CONNECTION_TIMEOUT': '30000',
  
  // Feature Flags
  'DEMO_MODE': 'false',
  'PRODUCTION_MATCHING': 'true',
  'DETECTION_CONFIDENCE_THRESHOLD': '0.7',
  'SUGGESTION_RELEVANCE_THRESHOLD': '0.6',
  'ENABLE_FEEDBACK': 'true',
  'ENABLE_LEARNING': 'true',
  'DEBUG_MODE': 'false',
  'ENABLE_DEMO_FALLBACK': 'false',
  
  // Rate Limiting
  'RATE_LIMIT_WINDOW_MS': '900000',
  'RATE_LIMIT_MAX_REQUESTS': '50',
  
  // CORS Configuration
  'CORS_ORIGIN': '*',
  'CORS_CREDENTIALS': 'true',
  
  // Health Check Configuration
  'HEALTH_CHECK_INTERVAL': '30000',
  'HEALTH_CHECK_TIMEOUT': '5000',
  
  // File Upload Configuration
  'MAX_FILE_SIZE': '500000000',
  'UPLOAD_TIMEOUT': '120000',
  
  // Video Processing Configuration
  'MAX_PROCESSING_TIME': '300000',
  'ENABLE_COST_OPTIMIZATION': 'true',
  'SAVE_INTERMEDIATE_RESULTS': 'false',
  
  // Frame Extraction Configuration
  'MAX_FRAMES_PER_SECOND': '2',
  'MAX_FRAME_WIDTH': '640',
  'MAX_FRAME_HEIGHT': '480',
  'MIN_FRAME_INTERVAL': '500',
  'MAX_FRAMES_PER_VIDEO': '30',
  
  // Object Detection Configuration
  'CONFIDENCE_THRESHOLD': '0.5',
  'IOU_THRESHOLD': '0.45',
  'MIN_TRACK_DURATION': '3',
  'MAX_TRACKS_PER_FRAME': '10',
  'TRACK_CONFIDENCE_THRESHOLD': '0.6',
  
  // Object Cropping Configuration
  'MIN_CROP_SIZE': '50',
  'MAX_CROP_SIZE': '512',
  'CROP_QUALITY': '85',
  'CROP_FORMAT': 'jpeg',
  'CROP_OUTPUT_DIR': './temp/crops',
  
  // OpenAI Configuration (optional - set in Railway dashboard)
  'OPENAI_API_KEY': '',
  'OPENAI_MODEL': 'gpt-4-vision-preview',
  'OPENAI_MAX_TOKENS': '300',
  'OPENAI_BATCH_SIZE': '3',
  'MAX_OPENAI_CALLS_PER_VIDEO': '20',
  'OPENAI_CONFIDENCE_THRESHOLD': '0.7',
  'OPENAI_CACHE_EXPIRY': '86400',
  
  // Railway Environment Variables
  'RAILWAY_ENVIRONMENT': 'production',
  'RAILWAY_PROJECT_NAME': 'lokal-prod',
  'RAILWAY_SERVICE_NAME': 'Lokal-Dev'
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

async function fixRailwayEnvironment() {
  console.log('🔧 Fixing Railway Environment Variables...\n');
  
  // Check Railway CLI status
  const railwayStatus = runCommand('railway whoami', 'Checking Railway login status');
  if (!railwayStatus.success) {
    console.log('❌ Please login to Railway first: railway login');
    return;
  }
  
  console.log('📋 Setting environment variables in Railway...\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  for (const [key, value] of Object.entries(RAILWAY_ENV_VARS)) {
    totalCount++;
    const setCommand = `railway variables set ${key}="${value}"`;
    const result = runCommand(setCommand, `Setting ${key}`);
    if (result.success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 Environment Variables Summary:`);
  console.log(`✅ Set ${successCount}/${totalCount} variables successfully`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All environment variables set successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Redeploy your application: railway up');
    console.log('2. Check deployment status: railway logs');
    console.log('3. Test the application: node scripts/test-railway-backend.js');
  } else {
    console.log('\n⚠️ Some variables failed to set. Please check Railway dashboard manually.');
  }
  
  // Show current variables
  console.log('\n📋 Current Railway Variables:');
  runCommand('railway variables', 'Displaying current variables');
}

// Run if called directly
if (require.main === module) {
  fixRailwayEnvironment();
}

module.exports = { fixRailwayEnvironment, RAILWAY_ENV_VARS }; 