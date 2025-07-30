#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Switching to Demo Mode...');

try {
  // Read current .env file
  let envContent = fs.readFileSync('.env', 'utf8');
  
  // Replace Supabase credentials with demo values
  envContent = envContent.replace(
    /EXPO_PUBLIC_SUPABASE_URL=.*/,
    'EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL'
  );
  
  envContent = envContent.replace(
    /EXPO_PUBLIC_SUPABASE_ANON_KEY=.*/,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY'
  );
  
  // Enable debug mode
  envContent = envContent.replace(
    /EXPO_PUBLIC_DEBUG=.*/,
    'EXPO_PUBLIC_DEBUG=true'
  );
  
  // Write back to .env file
  fs.writeFileSync('.env', envContent);
  
  console.log('✅ Successfully switched to DEMO MODE!');
  console.log('');
  console.log('🎯 Now you can:');
  console.log('   1. Use the "Use Demo Credentials" button in the app');
  console.log('   2. Or manually enter:');
  console.log('      Email: demo@lokal.com');
  console.log('      Password: demo123');
  console.log('   3. Or use any email/password format');
  console.log('');
  console.log('🔄 Restart your Expo server to apply changes:');
  console.log('   npx expo start --clear');
  
} catch (error) {
  console.log('❌ Error switching to demo mode:', error.message);
} 