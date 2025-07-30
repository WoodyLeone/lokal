#!/usr/bin/env node

/**
 * Railway Entry Point - app.js
 * This is the main entry point for Railway deployment
 * Railway looks for app.js by default
 */

console.log('🚂 Starting Lokal Backend via Railway...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');

// Import and start the main server
require('./src/server.js'); 