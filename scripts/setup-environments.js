#!/usr/bin/env node

/**
 * Setup Development and Production Environments
 * This script configures Railway environments for Lokal
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironments() {
  console.log('🚀 Setting up Railway Environments for Lokal');
  console.log('=============================================\n');

  try {
    // Get environment configuration
    console.log('📋 Environment Configuration');
    console.log('----------------------------');
    
    const devDbUrl = await question('🔗 Development Database URL (Railway): ');
    const prodDbUrl = await question('🔗 Production Database URL (Railway): ');
    const devApiUrl = await question('🌐 Development API URL (Railway): ');
    const prodApiUrl = await question('🌐 Production API URL (Railway): ');
    
    console.log('\n📝 Creating environment files...');

    // Create development environment
    const devEnv = `# Development Environment Configuration
# Railway PostgreSQL Database
EXPO_PUBLIC_DATABASE_URL=${devDbUrl}

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=${devApiUrl}

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

    // Create production environment
    const prodEnv = `# Production Environment Configuration
# Railway PostgreSQL Database
EXPO_PUBLIC_DATABASE_URL=${prodDbUrl}

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=${prodApiUrl}

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

    // Write environment files
    fs.writeFileSync('.env.development', devEnv);
    fs.writeFileSync('.env.production', prodEnv);

    console.log('✅ Environment files created:');
    console.log('   - .env.development');
    console.log('   - .env.production');

    // Create Railway configuration
    const railwayConfig = {
      $schema: "https://railway.app/railway.schema.json",
      build: {
        builder: "NIXPACKS"
      },
      deploy: {
        numReplicas: 1,
        healthcheckPath: "/health",
        healthcheckTimeout: 300,
        restartPolicyType: "ON_FAILURE",
        restartPolicyMaxRetries: 10
      }
    };

    fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
    console.log('✅ Railway configuration created: railway.json');

    // Update package.json scripts
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      "start:dev": "EXPO_ENV=development expo start",
      "start:prod": "EXPO_ENV=production expo start",
      "build:dev": "EXPO_ENV=development expo build",
      "build:prod": "EXPO_ENV=production expo build",
      "deploy:dev": "railway up --environment development",
      "deploy:prod": "railway up --environment production",
      "setup-environments": "node scripts/setup-environments.js",
      "test:dev": "EXPO_ENV=development npm run test-database",
      "test:prod": "EXPO_ENV=production npm run test-database"
    };

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json scripts updated');

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
const sourceFile = \`\`.env.\${targetEnv}\`;
const targetFile = '.env';

if (!fs.existsSync(sourceFile)) {
  console.log(\`❌ Environment file \${sourceFile} not found\`);
  console.log('Run: npm run setup-environments');
  process.exit(1);
}

fs.copyFileSync(sourceFile, targetFile);
console.log(\`✅ Switched to \${targetEnv} environment\`);
console.log(\`📁 Copied \${sourceFile} to .env\`);
`;

    fs.writeFileSync('scripts/switch-env.js', envSwitcher);
    fs.chmodSync('scripts/switch-env.js', '755');
    console.log('✅ Environment switcher created: scripts/switch-env.js');

    console.log('\n🎉 Environment setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Switch to development: node scripts/switch-env.js dev');
    console.log('2. Switch to production: node scripts/switch-env.js prod');
    console.log('3. Start development: npm run start:dev');
    console.log('4. Start production: npm run start:prod');
    console.log('5. Deploy to Railway: npm run deploy:dev or npm run deploy:prod');

  } catch (error) {
    console.error('❌ Error setting up environments:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupEnvironments();
}

module.exports = { setupEnvironments }; 