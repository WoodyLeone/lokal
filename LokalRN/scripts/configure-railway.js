#!/usr/bin/env node

/**
 * Configure Railway Connection
 * This script helps configure the Railway PostgreSQL connection string
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function configureRailway() {
  console.log('🔧 Railway PostgreSQL Configuration');
  console.log('=====================================\n');
  
  console.log('📋 To get your Railway connection string:');
  console.log('1. Go to your Railway dashboard');
  console.log('2. Click on your PostgreSQL database');
  console.log('3. Go to "Connect" tab');
  console.log('4. Copy the "Postgres Connection URL"\n');
  
  console.log('🔗 The connection string should look like:');
  console.log('postgresql://postgres:password@mainline.proxy.rlwy.net:25135/railway\n');
  
  rl.question('Please paste your Railway connection string: ', (connectionString) => {
    if (!connectionString || connectionString.trim() === '') {
      console.log('❌ No connection string provided');
      rl.close();
      return;
    }
    
    // Validate connection string format
    if (!connectionString.startsWith('postgresql://')) {
      console.log('❌ Invalid connection string format. Should start with "postgresql://"');
      rl.close();
      return;
    }
    
    try {
      // Read current .env file
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update the DATABASE_URL
      envContent = envContent.replace(
        /EXPO_PUBLIC_DATABASE_URL=.*/,
        `EXPO_PUBLIC_DATABASE_URL=${connectionString.trim()}`
      );
      
      // Write updated content
      fs.writeFileSync(envPath, envContent);
      
      console.log('\n✅ Connection string updated successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Test the connection: npm run test-railway-connection');
      console.log('2. Set up the database: npm run setup-railway');
      console.log('3. Test the database: npm run test-database');
      
    } catch (error) {
      console.error('❌ Error updating .env file:', error.message);
    }
    
    rl.close();
  });
}

// Run if called directly
if (require.main === module) {
  configureRailway();
}

module.exports = { configureRailway }; 