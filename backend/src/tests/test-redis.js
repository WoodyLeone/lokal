#!/usr/bin/env node
/**
 * Simple Redis Connection Test
 */

require('dotenv').config({ path: './config.env' });
const Redis = require('ioredis');

async function testRedisConnection() {
  console.log('🧪 Testing Redis Connection...\n');

  try {
    // Test 1: Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    console.log('📊 Upstash URL:', upstashUrl);
    console.log('📊 Upstash Token:', upstashToken ? 'Present' : 'Missing');
    
    if (!upstashUrl || !upstashToken) {
      console.log('❌ Missing Upstash credentials');
      return;
    }
    console.log('✅ Environment variables found\n');

    // Test 2: Parse URL
    console.log('2️⃣ Parsing Upstash URL...');
    const url = new URL(upstashUrl);
    const host = url.hostname;
    const port = parseInt(url.port) || 6379;
    
    console.log('📊 Host:', host);
    console.log('📊 Port:', port);
    console.log('✅ URL parsed successfully\n');

    // Test 3: Create Redis connection
    console.log('3️⃣ Creating Redis connection...');
    const redis = new Redis({
      host: host,
      port: port,
      password: upstashToken,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 30000,
      commandTimeout: 5000,
      tls: {
        rejectUnauthorized: false
      },
      enableReadyCheck: false
    });

    // Handle Redis events
    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redis.on('error', (error) => {
      console.log('❌ Redis error:', error.message);
    });

    redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // Test 4: Test connection
    console.log('4️⃣ Testing Redis operations...');
    
    try {
      // Test ping
      const pingResult = await redis.ping();
      console.log('✅ Ping successful:', pingResult);
      
      // Test set/get
      await redis.set('test_key', 'test_value', 'EX', 60);
      const value = await redis.get('test_key');
      console.log('✅ Set/Get successful:', value);
      
      // Clean up
      await redis.del('test_key');
      console.log('✅ Cleanup successful');
      
      console.log('🎉 Redis connection test successful!');
      
    } catch (error) {
      console.log('❌ Redis operation failed:', error.message);
    }

    // Close connection
    await redis.quit();
    console.log('✅ Redis connection closed');

  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

// Run test
testRedisConnection().then(() => {
  console.log('\n🏁 Redis test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}); 