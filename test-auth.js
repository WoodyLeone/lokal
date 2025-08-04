// Test script to verify authentication configuration
console.log('🔧 Authentication Configuration Test');
console.log('=====================================');

// Read environment variables directly
const fs = require('fs');
const path = require('path');

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      envVars[key.trim()] = value.trim();
    }
  });

  console.log('1. Environment Variables:');
  console.log('   SUPABASE_URL:', envVars.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('   SUPABASE_ANON_KEY:', envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
  console.log('   API_BASE_URL:', envVars.EXPO_PUBLIC_API_BASE_URL);
  console.log('   DEV_MODE:', envVars.EXPO_PUBLIC_DEV_MODE);

  console.log('\n2. Demo Mode Check:');
  const isDemoMode = envVars.EXPO_PUBLIC_SUPABASE_URL === 'YOUR_SUPABASE_URL' || 
                     envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';
  console.log('   Demo Mode:', isDemoMode ? '✅ Enabled' : '❌ Disabled');

  console.log('\n3. Available Demo Credentials:');
  console.log('   Email: demo@lokal.com');
  console.log('   Password: demo123');
  console.log('   Email: test@lokal.com');
  console.log('   Password: test123');

  console.log('\n4. Current Configuration:');
  if (isDemoMode) {
    console.log('   ✅ App is in DEMO MODE');
    console.log('   ✅ You can use demo credentials or any email/password');
    console.log('   ✅ Use the "Use Demo Credentials" button in the app');
  } else {
    console.log('   ✅ App is using REAL SUPABASE');
    console.log('   ❌ You need to create a real account in Supabase');
    console.log('   ❌ Or switch to demo mode for testing');
  }

  console.log('\n5. Quick Fix Options:');
  console.log('   Option 1: Use "Use Demo Credentials" button in app');
  console.log('   Option 2: Create real Supabase account');
  console.log('   Option 3: Switch to demo mode (temporary .env change)');

} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
} 