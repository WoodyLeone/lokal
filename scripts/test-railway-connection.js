#!/usr/bin/env node

/**
 * Test Railway Connection
 * This script helps test and configure Railway PostgreSQL connection
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testRailwayConnection() {
  console.log('🔧 Testing Railway PostgreSQL connection...');
  
  // Get connection string from environment
  const connectionString = process.env.EXPO_PUBLIC_DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ EXPO_PUBLIC_DATABASE_URL not found in environment');
    console.log('💡 Run: npm run configure-railway to set up your connection string');
    return;
  }
  
  console.log(`🔗 Connection string: ${connectionString.replace(/:[^:@]*@/, ':***@')}`);
  
  console.log('\n🔗 Testing connection...');
  
  try {
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log(`⏰ Current time: ${result.rows[0].current_time}`);
    console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📋 Existing tables: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Railway PostgreSQL is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with the connection string:');
    console.log(`   EXPO_PUBLIC_DATABASE_URL=${connectionString}`);
    console.log('2. Run: npm run setup-railway');
    console.log('3. Run: npm run test-database');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 You need to set your Railway credentials:');
      console.log('1. Go to your Railway dashboard');
      console.log('2. Click on your PostgreSQL database');
      console.log('3. Go to "Connect" tab');
      console.log('4. Copy the full connection string');
      console.log('5. Set it as EXPO_PUBLIC_DATABASE_URL in your .env file');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused. Check:');
      console.log('1. Is your Railway database running?');
      console.log('2. Are the host and port correct?');
      console.log('3. Is your IP whitelisted?');
    }
  }
}

// Run if called directly
if (require.main === module) {
  testRailwayConnection();
}

module.exports = { testRailwayConnection }; 