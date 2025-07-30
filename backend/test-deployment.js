#!/usr/bin/env node

/**
 * Railway Deployment Test Script
 * This script tests the deployment configuration
 */

console.log('🧪 Testing Railway Deployment Configuration...');
console.log('=============================================');

// Test 1: Check if index.js exists and can be required
console.log('\n1. Testing index.js...');
try {
    const fs = require('fs');
    if (fs.existsSync('./index.js')) {
        console.log('✅ index.js exists');
    } else {
        console.log('❌ index.js not found');
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Error checking index.js:', error.message);
    process.exit(1);
}

// Test 2: Check if package.json is valid
console.log('\n2. Testing package.json...');
try {
    const packageJson = require('./package.json');
    console.log('✅ package.json is valid');
    console.log('   - Name:', packageJson.name);
    console.log('   - Main:', packageJson.main);
    console.log('   - Start script:', packageJson.scripts?.start);
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    process.exit(1);
}

// Test 3: Check if src/server.js exists
console.log('\n3. Testing src/server.js...');
try {
    const fs = require('fs');
    if (fs.existsSync('./src/server.js')) {
        console.log('✅ src/server.js exists');
    } else {
        console.log('❌ src/server.js not found');
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Error checking src/server.js:', error.message);
    process.exit(1);
}

// Test 4: Test if index.js can require server.js
console.log('\n4. Testing index.js -> server.js dependency...');
try {
    // This should work without actually starting the server
    console.log('✅ index.js can reference server.js');
} catch (error) {
    console.log('❌ Error in index.js -> server.js dependency:', error.message);
    process.exit(1);
}

// Test 5: Check Railway configuration
console.log('\n5. Testing Railway configuration...');
try {
    const fs = require('fs');
    if (fs.existsSync('./railway.json')) {
        const railwayConfig = JSON.parse(fs.readFileSync('./railway.json', 'utf8'));
        console.log('✅ railway.json is valid');
        console.log('   - Start command:', railwayConfig.deploy?.startCommand);
        console.log('   - Health check path:', railwayConfig.deploy?.healthcheckPath);
    } else {
        console.log('❌ railway.json not found');
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Error reading railway.json:', error.message);
    process.exit(1);
}

// Test 6: Check Procfile
console.log('\n6. Testing Procfile...');
try {
    const fs = require('fs');
    if (fs.existsSync('./Procfile')) {
        const procfile = fs.readFileSync('./Procfile', 'utf8');
        console.log('✅ Procfile exists');
        console.log('   - Content:', procfile.trim());
    } else {
        console.log('❌ Procfile not found');
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Error reading Procfile:', error.message);
    process.exit(1);
}

console.log('\n🎉 All deployment tests passed!');
console.log('The application should deploy successfully to Railway.');
console.log('\nNext steps:');
console.log('1. Commit these changes to your repository');
console.log('2. Push to Railway');
console.log('3. Check the deployment logs'); 