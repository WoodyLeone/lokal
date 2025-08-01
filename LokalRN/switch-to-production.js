#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Switching to Production Mode...');

try {
  // Read the production environment template
  const productionEnvPath = path.join(__dirname, '.env.production');
  
  if (!fs.existsSync(productionEnvPath)) {
    console.log('❌ .env.production file not found');
    process.exit(1);
  }
  
  const productionEnvContent = fs.readFileSync(productionEnvPath, 'utf8');
  
  // Write to .env file
  fs.writeFileSync('.env', productionEnvContent);
  
  console.log('✅ Successfully switched to PRODUCTION MODE!');
  console.log('');
  console.log('🎯 Production Configuration:');
  console.log('   • Backend: https://lokal-production.up.railway.app/api');
  console.log('   • Database: Real Supabase (with auth)');
  console.log('   • Features: All enabled (video upload, object detection)');
  console.log('   • Mode: Production (debug disabled)');
  console.log('');
  console.log('📱 Next Steps:');
  console.log('   1. Restart your Expo server: npx expo start --clear');
  console.log('   2. Test with real email registration');
  console.log('   3. Try video upload and object detection');
  console.log('');
  console.log('🔄 To switch back to demo mode:');
  console.log('   node switch-to-demo.js');
  
} catch (error) {
  console.log('❌ Error switching to production mode:', error.message);
}