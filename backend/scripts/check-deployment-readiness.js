#!/usr/bin/env node

/**
 * Deployment Readiness Check Script
 * Verifies that the backend is ready for Railway deployment
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'package.json',
  'app.js',
  'Procfile',
  'railway.json',
  '.railwayignore',
  '.gitignore',
  'src/server.js'
];

const REQUIRED_DIRECTORIES = [
  'src',
  'src/config',
  'src/controllers',
  'src/middleware',
  'src/routes',
  'src/services',
  'src/utils',
  'scripts'
];

const REQUIRED_SCRIPTS = [
  'scripts/detect_objects.py',
  'scripts/download-models.js',
  'scripts/check-deployment-readiness.js'
];

const EXCLUDED_FILES = [
  'yolov8n.pt',
  'config.env',
  'railway-debug.js',
  'deploy-to-railway.sh',
  'test-deployment.js',
  'test-railway-readiness.js',
  'test-learning-system.js',
  'start.sh'
];

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} (MISSING)`);
    return false;
  }
}

function checkDirectoryExists(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✅ ${description}: ${dirPath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${dirPath} (MISSING)`);
    return false;
  }
}

function checkFileNotExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath} (NOT PRESENT - GOOD)`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} (SHOULD NOT EXIST)`);
    return false;
  }
}

function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['start', 'dev', 'postinstall'];
    let scriptsOk = true;
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ Package.json script: ${script}`);
      } else {
        console.log(`❌ Package.json script: ${script} (MISSING)`);
        scriptsOk = false;
      }
    });
    
    // Check main entry point
    if (packageJson.main === 'app.js') {
      console.log(`✅ Package.json main: ${packageJson.main}`);
    } else {
      console.log(`❌ Package.json main should be 'app.js', got: ${packageJson.main}`);
      scriptsOk = false;
    }
    
    return scriptsOk;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

function checkRailwayConfig() {
  try {
    const railwayJson = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    
    if (railwayJson.deploy && railwayJson.deploy.startCommand === 'npm start') {
      console.log(`✅ Railway start command: ${railwayJson.deploy.startCommand}`);
    } else {
      console.log(`❌ Railway start command should be 'npm start'`);
      return false;
    }
    
    if (railwayJson.deploy && railwayJson.deploy.healthcheckPath === '/api/health') {
      console.log(`✅ Railway health check path: ${railwayJson.deploy.healthcheckPath}`);
    } else {
      console.log(`❌ Railway health check path should be '/api/health'`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error reading railway.json: ${error.message}`);
    return false;
  }
}

function checkProcfile() {
  try {
    const procfile = fs.readFileSync('Procfile', 'utf8').trim();
    if (procfile === 'web: npm start') {
      console.log(`✅ Procfile: ${procfile}`);
      return true;
    } else {
      console.log(`❌ Procfile should be 'web: npm start', got: ${procfile}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error reading Procfile: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🚂 Railway Deployment Readiness Check');
  console.log('=====================================\n');
  
  let allChecksPassed = true;
  
  // Check required files
  console.log('📁 Required Files:');
  REQUIRED_FILES.forEach(file => {
    if (!checkFileExists(file, 'Required file')) {
      allChecksPassed = false;
    }
  });
  
  console.log('\n📂 Required Directories:');
  REQUIRED_DIRECTORIES.forEach(dir => {
    if (!checkDirectoryExists(dir, 'Required directory')) {
      allChecksPassed = false;
    }
  });
  
  console.log('\n🔧 Required Scripts:');
  REQUIRED_SCRIPTS.forEach(script => {
    if (!checkFileExists(script, 'Required script')) {
      allChecksPassed = false;
    }
  });
  
  console.log('\n🚫 Excluded Files (should not exist):');
  EXCLUDED_FILES.forEach(file => {
    if (!checkFileNotExists(file, 'Excluded file')) {
      allChecksPassed = false;
    }
  });
  
  console.log('\n📦 Package.json Configuration:');
  if (!checkPackageJson()) {
    allChecksPassed = false;
  }
  
  console.log('\n🚂 Railway Configuration:');
  if (!checkRailwayConfig()) {
    allChecksPassed = false;
  }
  
  console.log('\n📋 Procfile Configuration:');
  if (!checkProcfile()) {
    allChecksPassed = false;
  }
  
  console.log('\n=====================================');
  if (allChecksPassed) {
    console.log('✅ All checks passed! Ready for Railway deployment.');
    console.log('\nNext steps:');
    console.log('1. Commit your changes: git add . && git commit -m "Clean up for Railway deployment"');
    console.log('2. Push to your Railway-connected repository');
    console.log('3. Monitor deployment in Railway dashboard');
    console.log('4. Set environment variables in Railway dashboard using env.example as reference');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before deploying.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 