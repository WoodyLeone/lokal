#!/usr/bin/env node

/**
 * Update Environment File for Railway PostgreSQL
 * This script helps update your .env file for Railway PostgreSQL migration
 */

const fs = require('fs');
const path = require('path');

function updateEnvFile() {
  console.log('🔧 Updating .env file for Railway PostgreSQL...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const backupPath = path.join(__dirname, '..', '.env.backup.supabase');
  
  try {
    // Read current .env file
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    
    // Create backup if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, currentEnv);
      console.log('✅ Created backup at .env.backup.supabase');
    }
    
    // Update the content
    let updatedEnv = currentEnv
      // Comment out Supabase configuration
      .replace(
        /^# Supabase Configuration\n# Get these from your Supabase project dashboard > Settings > API\nEXPO_PUBLIC_SUPABASE_URL=/m,
        '# Railway PostgreSQL Configuration\n# Get this from your Railway project dashboard > Database > Connect\nEXPO_PUBLIC_DATABASE_URL=YOUR_RAILWAY_DATABASE_URL_HERE\n\n# Supabase Configuration (for migration only - remove after migration)\n# Get these from your Supabase project dashboard > Settings > API\n# EXPO_PUBLIC_SUPABASE_URL='
      )
      .replace(
        /^EXPO_PUBLIC_SUPABASE_ANON_KEY=/m,
        '# EXPO_PUBLIC_SUPABASE_ANON_KEY='
      )
      // Comment out service role key
      .replace(
        /^# Supabase Service Role Key \(for admin operations\)\nSUPABASE_SERVICE_ROLE_KEY=/m,
        '# Supabase Service Role Key (for migration only - remove after migration)\n# SUPABASE_SERVICE_ROLE_KEY='
      );
    
    // Write updated content
    fs.writeFileSync(envPath, updatedEnv);
    
    console.log('✅ Updated .env file for Railway PostgreSQL');
    console.log('\n📋 Next steps:');
    console.log('1. Go to Railway.app and create a PostgreSQL database');
    console.log('2. Copy the connection string from Railway dashboard');
    console.log('3. Replace YOUR_RAILWAY_DATABASE_URL_HERE with your actual connection string');
    console.log('4. Run: npm run setup-railway');
    console.log('5. Run: npm run test-database');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    console.log('\n💡 Manual steps:');
    console.log('1. Open your .env file');
    console.log('2. Comment out EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    console.log('3. Add: EXPO_PUBLIC_DATABASE_URL=YOUR_RAILWAY_DATABASE_URL_HERE');
  }
}

// Run if called directly
if (require.main === module) {
  updateEnvFile();
}

module.exports = { updateEnvFile }; 