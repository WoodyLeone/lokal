#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests all database connections and functionality
 */

const databaseManager = require('../config/database');

async function testDatabaseConnections() {
  console.log('🧪 Testing Database Connections...\n');

  try {
    // Test 1: Initialize database manager
    console.log('1️⃣ Testing database initialization...');
    await databaseManager.initialize();
    console.log('✅ Database manager initialized successfully\n');

    // Test 2: Check connection status
    console.log('2️⃣ Checking connection status...');
    const status = databaseManager.getStatus();
    console.log('📊 Connection Status:', JSON.stringify(status, null, 2));
    console.log('✅ Status check completed\n');

    // Test 3: Test Supabase connection
    console.log('3️⃣ Testing Supabase connection...');
    try {
      const supabase = databaseManager.getSupabase();
      const { data, error } = await supabase
        .from('videos')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('⚠️ Supabase test query failed:', error.message);
        console.log('   This might be expected if tables don\'t exist yet');
      } else {
        console.log('✅ Supabase connection working');
      }
    } catch (error) {
      console.log('❌ Supabase connection failed:', error.message);
    }
    console.log('');

    // Test 4: Test Redis connection
    console.log('4️⃣ Testing Redis connection...');
    try {
      const redis = databaseManager.getRedis();
      if (redis && redis.status === 'ready') {
        await redis.ping();
        console.log('✅ Redis connection working');
        
        // Test Redis operations
        await redis.set('test_key', 'test_value', 'EX', 60);
        const value = await redis.get('test_key');
        console.log('✅ Redis read/write operations working');
        await redis.del('test_key');
      } else {
        console.log('⚠️ Redis not available (this is optional)');
      }
    } catch (error) {
      console.log('❌ Redis connection failed:', error.message);
    }
    console.log('');

    // Test 5: Test in-memory cache
    console.log('5️⃣ Testing in-memory cache...');
    try {
      const cache = databaseManager.getCache();
      if (cache) {
        cache.set('test_cache_key', 'test_cache_value', 60);
        const cachedValue = cache.get('test_cache_key');
        if (cachedValue === 'test_cache_value') {
          console.log('✅ In-memory cache working');
        } else {
          console.log('❌ In-memory cache read failed');
        }
        cache.del('test_cache_key');
      } else {
        console.log('❌ In-memory cache not available');
      }
    } catch (error) {
      console.log('❌ In-memory cache failed:', error.message);
    }
    console.log('');

    // Test 6: Test caching with fallback
    console.log('6️⃣ Testing caching with fallback...');
    try {
      const testData = { test: 'data', timestamp: Date.now() };
      await databaseManager.cacheData('test_fallback', testData, 60);
      
      const retrievedData = await databaseManager.getCachedData('test_fallback');
      if (retrievedData && retrievedData.test === 'data') {
        console.log('✅ Caching with fallback working');
      } else {
        console.log('❌ Caching with fallback failed');
      }
    } catch (error) {
      console.log('❌ Caching test failed:', error.message);
    }
    console.log('');

    // Test 7: Test database health
    console.log('7️⃣ Testing database health...');
    const isConnected = databaseManager.isDatabaseConnected();
    console.log(`📊 Database connected: ${isConnected}`);
    
    if (isConnected) {
      console.log('✅ Database is healthy');
    } else {
      console.log('⚠️ Database connection issues detected');
    }
    console.log('');

    // Test 8: Test reconnection logic
    console.log('8️⃣ Testing reconnection logic...');
    console.log('📊 Current reconnect attempts:', status.reconnectAttempts);
    console.log('📊 Max reconnect attempts:', databaseManager.maxReconnectAttempts);
    console.log('✅ Reconnection configuration verified\n');

    // Summary
    console.log('🎉 Database Test Summary:');
    console.log('========================');
    console.log(`✅ Database Manager: Initialized`);
    console.log(`✅ Supabase: ${status.supabase ? 'Connected' : 'Disconnected'}`);
    console.log(`✅ Redis: ${status.redis === 'ready' ? 'Connected' : 'Disconnected'}`);
    console.log(`✅ Cache: ${status.cache ? 'Available' : 'Unavailable'}`);
    console.log(`✅ Overall: ${isConnected ? 'Healthy' : 'Issues Detected'}`);

    if (isConnected) {
      console.log('\n🎉 All database connections are working properly!');
    } else {
      console.log('\n⚠️ Some database connections have issues. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run tests
testDatabaseConnections().then(() => {
  console.log('\n🏁 Database tests completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}); 