#!/usr/bin/env node

/**
 * Quick Setup Script
 * Automates the entire Railway environment setup for Lokal
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function quickSetup() {
  console.log('🚀 Quick Setup for Railway Environments');
  console.log('=======================================\n');

  try {
    // Check if Railway CLI is installed
    try {
      execSync('railway --version', { stdio: 'ignore' });
      console.log('✅ Railway CLI is installed');
    } catch (error) {
      console.log('❌ Railway CLI not found');
      console.log('📦 Installing Railway CLI...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
      console.log('✅ Railway CLI installed');
    }

    // Check if user is logged in
    try {
      execSync('railway whoami', { stdio: 'ignore' });
      console.log('✅ Logged into Railway');
    } catch (error) {
      console.log('🔐 Please log into Railway:');
      execSync('railway login', { stdio: 'inherit' });
    }

    console.log('\n📋 Setting up environments...');
    
    // Run environment setup
    execSync('npm run setup-environments', { stdio: 'inherit' });

    console.log('\n🔧 Setting up database...');
    
    // Setup database
    execSync('npm run setup-railway', { stdio: 'inherit' });

    console.log('\n🧪 Testing setup...');
    
    // Test database connection
    execSync('npm run test-database', { stdio: 'inherit' });

    console.log('\n🎉 Quick setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Create Railway projects:');
    console.log('   - railway init lokal-frontend');
    console.log('   - railway init lokal-backend');
    console.log('   - railway init lokal-database');
    console.log('');
    console.log('2. Link projects:');
    console.log('   - cd LokalRN && railway link');
    console.log('   - cd ../backend && railway link');
    console.log('');
    console.log('3. Deploy:');
    console.log('   - npm run deploy:dev (development)');
    console.log('   - npm run deploy:prod (production)');
    console.log('');
    console.log('4. Switch environments:');
    console.log('   - npm run switch:dev');
    console.log('   - npm run switch:prod');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you have Node.js installed');
    console.log('2. Check your internet connection');
    console.log('3. Verify Railway account access');
    console.log('4. Run setup steps manually if needed');
  }
}

// Run if called directly
if (require.main === module) {
  quickSetup();
}

module.exports = { quickSetup }; 