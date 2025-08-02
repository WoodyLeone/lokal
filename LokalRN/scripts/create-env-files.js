#!/usr/bin/env node

/**
 * Create Environment Files
 * Creates development and production environment files with existing Railway config
 */

const fs = require('fs');
const path = require('path');

function createEnvFiles() {
  console.log('🔧 Creating environment files with existing Railway configuration...');
  
  // Development environment
  const devEnv = `# Development Environment Configuration
# Railway PostgreSQL Database
EXPO_PUBLIC_DATABASE_URL=postgresql://postgres:olgtwNjDXPQbkNNuknFliLDomEKjaLTK@mainline.proxy.rlwy.net:25135/railway

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=https://lokal-prod-production.up.railway.app/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal (Dev)
EXPO_PUBLIC_APP_VERSION=1.0.0-dev

# Environment
NODE_ENV=development
EXPO_PUBLIC_ENV=development

# Feature Flags
EXPO_PUBLIC_ENABLE_OBJECT_DETECTION=true
EXPO_PUBLIC_ENABLE_PRODUCT_MATCHING=true
EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD=true
EXPO_PUBLIC_ENABLE_FILE_UPLOAD=true

# Debug Configuration
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_DEV_MODE=true

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
`;

  // Production environment
  const prodEnv = `# Production Environment Configuration
# Railway PostgreSQL Database
EXPO_PUBLIC_DATABASE_URL=postgresql://postgres:olgtwNjDXPQbkNNuknFliLDomEKjaLTK@mainline.proxy.rlwy.net:25135/railway

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=https://lokal-prod-production.up.railway.app/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal
EXPO_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
EXPO_PUBLIC_ENV=production

# Feature Flags
EXPO_PUBLIC_ENABLE_OBJECT_DETECTION=true
EXPO_PUBLIC_ENABLE_PRODUCT_MATCHING=true
EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD=true
EXPO_PUBLIC_ENABLE_FILE_UPLOAD=true

# Debug Configuration
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_DEV_MODE=false

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
`;

  try {
    // Write environment files
    fs.writeFileSync('.env.development', devEnv);
    fs.writeFileSync('.env.production', prodEnv);
    
    console.log('✅ Environment files created:');
    console.log('   - .env.development');
    console.log('   - .env.production');
    
    // Create environment switcher
    const envSwitcher = `#!/usr/bin/env node

/**
 * Environment Switcher
 * Switch between development and production environments
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2];

if (!env || !['dev', 'prod', 'development', 'production'].includes(env)) {
  console.log('❌ Please specify environment: dev or prod');
  console.log('Usage: node scripts/switch-env.js [dev|prod]');
  process.exit(1);
}

const targetEnv = env === 'dev' || env === 'development' ? 'development' : 'production';
const sourceFile = \`.env.\${targetEnv}\`;
const targetFile = '.env';

if (!fs.existsSync(sourceFile)) {
  console.log(\`❌ Environment file \${sourceFile} not found\`);
  console.log('Run: npm run create-env-files');
  process.exit(1);
}

fs.copyFileSync(sourceFile, targetFile);
console.log(\`✅ Switched to \${targetEnv} environment\`);
console.log(\`📁 Copied \${sourceFile} to .env\`);
`;

    fs.writeFileSync('scripts/switch-env.js', envSwitcher);
    fs.chmodSync('scripts/switch-env.js', '755');
    console.log('✅ Environment switcher created: scripts/switch-env.js');
    
    // Set current environment to development
    fs.copyFileSync('.env.development', '.env');
    console.log('✅ Set current environment to development');
    
    console.log('\n🎉 Environment setup completed!');
    console.log('\n📋 Available commands:');
    console.log('1. Switch to development: npm run switch:dev');
    console.log('2. Switch to production: npm run switch:prod');
    console.log('3. Start development: npm run start:dev');
    console.log('4. Start production: npm run start:prod');
    console.log('5. Test database: npm run test-database');
    
  } catch (error) {
    console.error('❌ Error creating environment files:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createEnvFiles();
}

module.exports = { createEnvFiles }; 