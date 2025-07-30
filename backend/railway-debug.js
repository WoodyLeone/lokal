#!/usr/bin/env node

/**
 * Railway Debug Script
 * This script helps debug Railway deployment issues
 */

console.log('=== Railway Debug Information ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 'not set');

// List files in current directory
const fs = require('fs');
console.log('\n=== Files in current directory ===');
try {
    const files = fs.readdirSync('.');
    files.forEach(file => {
        const stats = fs.statSync(file);
        console.log(`${file} - ${stats.isDirectory() ? 'DIR' : 'FILE'}`);
    });
} catch (error) {
    console.error('Error reading directory:', error.message);
}

// Check if src directory exists
console.log('\n=== Checking src directory ===');
try {
    const srcFiles = fs.readdirSync('./src');
    console.log('src directory exists with files:', srcFiles);
} catch (error) {
    console.error('src directory error:', error.message);
}

// Check package.json
console.log('\n=== Package.json info ===');
try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    console.log('Name:', packageJson.name);
    console.log('Main:', packageJson.main);
    console.log('Start script:', packageJson.scripts?.start);
    console.log('Engines:', packageJson.engines);
} catch (error) {
    console.error('Package.json error:', error.message);
}

console.log('\n=== Starting server ===');
require('./src/server.js'); 