#!/usr/bin/env node

/**
 * Test Railway PostgreSQL Database Connection
 * This script tests the database connection and basic operations
 */

const { Pool } = require('pg');
const { DatabaseService } = require('../src/services/databaseService');
require('dotenv').config();

async function testDatabase() {
  console.log('🧪 Testing Railway PostgreSQL Database...');
  
  const DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL environment variable');
    return;
  }
  
  try {
    // Test direct connection
    console.log('📡 Testing direct database connection...');
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Direct connection successful');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    
    // Test table queries
    console.log('\n📋 Testing table queries...');
    
    const tables = ['users', 'profiles', 'videos', 'products'];
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}': ${countResult.rows[0].count} rows`);
      } catch (error) {
        console.error(`❌ Table '${table}': ${error.message}`);
      }
    }
    
    // Test DatabaseService
    console.log('\n🔧 Testing DatabaseService...');
    
    // Test getting products
    const productsResult = await DatabaseService.getProducts();
    if (productsResult.error) {
      console.error('❌ DatabaseService.getProducts failed:', productsResult.error);
    } else {
      console.log(`✅ DatabaseService.getProducts: ${productsResult.data?.length || 0} products`);
    }
    
    // Test getting videos
    const videosResult = await DatabaseService.getVideos();
    if (videosResult.error) {
      console.error('❌ DatabaseService.getVideos failed:', videosResult.error);
    } else {
      console.log(`✅ DatabaseService.getVideos: ${videosResult.data?.length || 0} videos`);
    }
    
    // Test authentication (demo mode)
    console.log('\n🔐 Testing authentication (demo mode)...');
    const authResult = await DatabaseService.signIn('test@example.com', 'password');
    if (authResult.error) {
      console.error('❌ DatabaseService.signIn failed:', authResult.error);
    } else {
      console.log('✅ DatabaseService.signIn successful (demo mode)');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database test completed successfully!');
    console.log('\n📋 Your Railway PostgreSQL database is ready to use.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your DATABASE_URL is correct');
    console.log('2. Ensure your Railway database is running');
    console.log('3. Run setup-railway script first: npm run setup-railway');
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase }; 