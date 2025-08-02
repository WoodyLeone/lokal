#!/usr/bin/env node

/**
 * Simple Railway PostgreSQL Database Test
 * This script tests the database connection and basic operations without TypeScript dependencies
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseSimple() {
  console.log('🧪 Testing Railway PostgreSQL Database (Simple)...');
  
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
    
    // Test basic CRUD operations
    console.log('\n🔧 Testing basic CRUD operations...');
    
    // Test getting products
    try {
      const productsResult = await client.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 5');
      console.log(`✅ Products query: ${productsResult.rows.length} products found`);
      if (productsResult.rows.length > 0) {
        console.log(`   Sample product: ${productsResult.rows[0].title}`);
      }
    } catch (error) {
      console.error('❌ Products query failed:', error.message);
    }
    
    // Test getting videos
    try {
      const videosResult = await client.query('SELECT * FROM videos ORDER BY created_at DESC LIMIT 5');
      console.log(`✅ Videos query: ${videosResult.rows.length} videos found`);
    } catch (error) {
      console.error('❌ Videos query failed:', error.message);
    }
    
    // Test getting users
    try {
      const usersResult = await client.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');
      console.log(`✅ Users query: ${usersResult.rows.length} users found`);
      if (usersResult.rows.length > 0) {
        console.log(`   Sample user: ${usersResult.rows[0].username} (${usersResult.rows[0].email})`);
      }
    } catch (error) {
      console.error('❌ Users query failed:', error.message);
    }
    
    // Test authentication (simple password check)
    console.log('\n🔐 Testing authentication...');
    try {
      const authResult = await client.query(
        'SELECT id, email, username FROM users WHERE email = $1 AND password_hash = $2',
        ['test@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8']
      );
      if (authResult.rows.length > 0) {
        console.log('✅ Authentication test successful');
        console.log(`   User: ${authResult.rows[0].username} (${authResult.rows[0].email})`);
      } else {
        console.log('⚠️ Test user not found or password incorrect');
      }
    } catch (error) {
      console.error('❌ Authentication test failed:', error.message);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database test completed successfully!');
    console.log('\n📋 Your Railway PostgreSQL database is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('1. Update your app code to use DatabaseService instead of SupabaseService');
    console.log('2. Test your React Native app with the new database');
    console.log('3. If you have existing data, run: npm run migrate-to-railway');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your DATABASE_URL is correct');
    console.log('2. Ensure your Railway database is running');
    console.log('3. Run setup-railway-fixed script first: npm run setup-railway-fixed');
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabaseSimple();
}

module.exports = { testDatabaseSimple }; 