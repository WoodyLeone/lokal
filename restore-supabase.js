#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Restoring Supabase Configuration...');

try {
  // Read current .env file
  let envContent = fs.readFileSync('.env', 'utf8');
  
  // Restore original Supabase credentials
  envContent = envContent.replace(
    /EXPO_PUBLIC_SUPABASE_URL=.*/,
    'EXPO_PUBLIC_SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co'
  );
  
  envContent = envContent.replace(
    /EXPO_PUBLIC_SUPABASE_ANON_KEY=.*/,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8'
  );
  
  // Disable debug mode
  envContent = envContent.replace(
    /EXPO_PUBLIC_DEBUG=.*/,
    'EXPO_PUBLIC_DEBUG=false'
  );
  
  // Write back to .env file
  fs.writeFileSync('.env', envContent);
  
  console.log('✅ Successfully restored SUPABASE configuration!');
  console.log('');
  console.log('⚠️  Note: You will need to create a real account in Supabase to sign in.');
  console.log('   Or switch back to demo mode for testing.');
  console.log('');
  console.log('🔄 Restart your Expo server to apply changes:');
  console.log('   npx expo start --clear');
  
} catch (error) {
  console.log('❌ Error restoring Supabase configuration:', error.message);
} 