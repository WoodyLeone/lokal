#!/usr/bin/env node

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
const sourceFile = `.env.${targetEnv}`;
const targetFile = '.env';

if (!fs.existsSync(sourceFile)) {
  console.log(`❌ Environment file ${sourceFile} not found`);
  console.log('Run: npm run create-env-files');
  process.exit(1);
}

fs.copyFileSync(sourceFile, targetFile);
console.log(`✅ Switched to ${targetEnv} environment`);
console.log(`📁 Copied ${sourceFile} to .env`);
