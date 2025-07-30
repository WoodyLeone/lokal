#!/usr/bin/env node

/**
 * Railway Readiness Test Script
 * Tests all critical components before Railway deployment
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
    log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}`);
    log('='.repeat(message.length));
}

// Test results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function testFileExists(filePath, description) {
    try {
        if (fs.existsSync(filePath)) {
            logSuccess(`${description} - ${filePath}`);
            results.passed++;
            return true;
        } else {
            logError(`${description} - ${filePath} (NOT FOUND)`);
            results.failed++;
            return false;
        }
    } catch (error) {
        logError(`${description} - ${filePath} (ERROR: ${error.message})`);
        results.failed++;
        return false;
    }
}

function testFileContent(filePath, description, requiredContent) {
    try {
        if (!fs.existsSync(filePath)) {
            logError(`${description} - ${filePath} (NOT FOUND)`);
            results.failed++;
            return false;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const hasContent = requiredContent.some(item => content.includes(item));
        
        if (hasContent) {
            logSuccess(`${description} - ${filePath}`);
            results.passed++;
            return true;
        } else {
            logError(`${description} - ${filePath} (MISSING REQUIRED CONTENT)`);
            results.failed++;
            return false;
        }
    } catch (error) {
        logError(`${description} - ${filePath} (ERROR: ${error.message})`);
        results.failed++;
        return false;
    }
}

function testPackageJson() {
    logHeader('Testing Package.json Configuration');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Test required fields
        const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
        requiredFields.forEach(field => {
            if (packageJson[field]) {
                logSuccess(`Package.json has ${field}`);
                results.passed++;
            } else {
                logError(`Package.json missing ${field}`);
                results.failed++;
            }
        });
        
        // Test start script
        if (packageJson.scripts && packageJson.scripts.start) {
            logSuccess('Package.json has start script');
            results.passed++;
        } else {
            logError('Package.json missing start script');
            results.failed++;
        }
        
        // Test critical dependencies
        const criticalDeps = ['express', 'cors', 'dotenv'];
        criticalDeps.forEach(dep => {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                logSuccess(`Has dependency: ${dep}`);
                results.passed++;
            } else {
                logError(`Missing dependency: ${dep}`);
                results.failed++;
            }
        });
        
    } catch (error) {
        logError(`Package.json parsing error: ${error.message}`);
        results.failed++;
    }
}

function testRailwayConfiguration() {
    logHeader('Testing Railway Configuration');
    
    // Test railway.json
    testFileExists('railway.json', 'Railway configuration file');
    
    // Test Procfile
    testFileExists('Procfile', 'Procfile for Railway');
    
    // Test railway.env.example
    testFileExists('railway.env.example', 'Railway environment example');
    
    // Test railway.json content
    try {
        const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
        
        if (railwayConfig.deploy && railwayConfig.deploy.startCommand) {
            logSuccess('Railway start command configured');
            results.passed++;
        } else {
            logError('Railway start command not configured');
            results.failed++;
        }
        
        if (railwayConfig.deploy && railwayConfig.deploy.healthcheckPath) {
            logSuccess('Railway health check path configured');
            results.passed++;
        } else {
            logError('Railway health check path not configured');
            results.failed++;
        }
        
    } catch (error) {
        logError(`Railway configuration error: ${error.message}`);
        results.failed++;
    }
}

function testServerConfiguration() {
    logHeader('Testing Server Configuration');
    
    // Test main server file
    testFileExists('src/server.js', 'Main server file');
    
    // Test health endpoint
    testFileExists('src/routes/health.js', 'Health endpoint');
    
    // Test server content for critical imports
    testFileContent('src/server.js', 'Server has Express import', ['express']);
    testFileContent('src/server.js', 'Server has CORS configuration', ['cors']);
    testFileContent('src/server.js', 'Server has environment loading', ['dotenv']);
}

function testEnvironmentConfiguration() {
    logHeader('Testing Environment Configuration');
    
    // Test environment example files
    testFileExists('config.env.example', 'Environment example file');
    testFileExists('railway.env.example', 'Railway environment example');
    
    // Test railway.env.example content
    const requiredEnvVars = [
        'PORT',
        'NODE_ENV',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'REDIS_URL',
        'SESSION_SECRET',
        'JWT_SECRET'
    ];
    
    try {
        const envContent = fs.readFileSync('railway.env.example', 'utf8');
        requiredEnvVars.forEach(varName => {
            if (envContent.includes(varName)) {
                logSuccess(`Environment variable: ${varName}`);
                results.passed++;
            } else {
                logWarning(`Environment variable: ${varName} (NOT FOUND)`);
                results.warnings++;
            }
        });
    } catch (error) {
        logError(`Environment file error: ${error.message}`);
        results.failed++;
    }
}

function testSecurityConfiguration() {
    logHeader('Testing Security Configuration');
    
    // Test for security middleware
    testFileContent('src/server.js', 'Has Helmet security middleware', ['helmet']);
    testFileContent('src/server.js', 'Has rate limiting', ['rate-limit']);
    testFileContent('src/server.js', 'Has CORS configuration', ['cors']);
}

function testHealthEndpoint() {
    logHeader('Testing Health Endpoint');
    
    try {
        const healthContent = fs.readFileSync('src/routes/health.js', 'utf8');
        
        // Test for basic health endpoint
        if (healthContent.includes('router.get(\'/\'') || healthContent.includes('app.get(\'/api/health\'')) {
            logSuccess('Basic health endpoint exists');
            results.passed++;
        } else {
            logError('Basic health endpoint missing');
            results.failed++;
        }
        
        // Test for database health check
        if (healthContent.includes('database') || healthContent.includes('Database')) {
            logSuccess('Database health check exists');
            results.passed++;
        } else {
            logWarning('Database health check not found');
            results.warnings++;
        }
        
    } catch (error) {
        logError(`Health endpoint error: ${error.message}`);
        results.failed++;
    }
}

function testDirectoryStructure() {
    logHeader('Testing Directory Structure');
    
    const requiredDirs = [
        'src',
        'src/routes',
        'src/controllers',
        'src/services',
        'src/config',
        'logs',
        'temp'
    ];
    
    requiredDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            logSuccess(`Directory exists: ${dir}`);
            results.passed++;
        } else {
            logWarning(`Directory missing: ${dir}`);
            results.warnings++;
        }
    });
}

function runAllTests() {
    logHeader('🚂 Railway Readiness Test Suite');
    logInfo('Testing backend configuration for Railway deployment...\n');
    
    testPackageJson();
    testRailwayConfiguration();
    testServerConfiguration();
    testEnvironmentConfiguration();
    testSecurityConfiguration();
    testHealthEndpoint();
    testDirectoryStructure();
    
    // Summary
    logHeader('Test Results Summary');
    log(`Tests Passed: ${results.passed}`, 'green');
    log(`Tests Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'green');
    
    if (results.failed === 0) {
        logSuccess('\n🎉 All critical tests passed! Your backend is ready for Railway deployment.');
        logInfo('\nNext steps:');
        logInfo('1. Run: ./deploy-to-railway.sh');
        logInfo('2. Follow the deployment instructions');
        logInfo('3. Set up environment variables in Railway dashboard');
        logInfo('4. Deploy and test your endpoints');
    } else {
        logError('\n❌ Some tests failed. Please fix the issues before deploying to Railway.');
        logInfo('\nCommon fixes:');
        logInfo('1. Check missing files and dependencies');
        logInfo('2. Verify environment variable configuration');
        logInfo('3. Ensure health endpoint is properly implemented');
    }
    
    if (results.warnings > 0) {
        logWarning('\n⚠️  Some warnings detected. Review and address if needed.');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    results
}; 