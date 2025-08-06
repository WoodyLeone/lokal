#!/usr/bin/env node

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

// Load environment variables
dotenv.config();

console.log('🔍 Testing Lokal Backend Connections...\n');

// Test 1: Environment Variables
console.log('📋 Checking Environment Variables:');
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'REDIS_HOST',
  'REDIS_PASSWORD',
  'OPENAI_API_KEY'
];

let envCheckPassed = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    envCheckPassed = false;
  }
});

console.log('');

// Test 2: Supabase Connection
async function testSupabase() {
  console.log('🔗 Testing Supabase Connection:');
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials missing');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying a table
    const { data, error } = await supabase
      .from('videos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log(`❌ Supabase connection error: ${error.message}`);
    return false;
  }
}

// Test 3: Redis Connection
async function testRedis() {
  console.log('\n🔗 Testing Redis Connection:');
  try {
    const isUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
    
    let redisConfig;
    
    if (isUpstash) {
      const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      
      const url = new URL(upstashUrl);
      const host = url.hostname;
      const port = parseInt(url.port) || 6379;
      
      redisConfig = {
        host: host,
        port: port,
        password: upstashToken,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 30000,
        commandTimeout: 5000,
        tls: {
          rejectUnauthorized: false
        },
        enableReadyCheck: false,
        maxRetriesPerRequest: 1
      };
    } else {
      redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 30000,
        commandTimeout: 5000
      };
    }

    const redis = new Redis(redisConfig);
    
    // Test connection
    await redis.ping();
    console.log('✅ Redis connection successful');
    
    // Test basic operations
    await redis.set('test-key', 'test-value');
    const value = await redis.get('test-key');
    await redis.del('test-key');
    
    if (value === 'test-value') {
      console.log('✅ Redis read/write operations successful');
    }
    
    await redis.quit();
    return true;
  } catch (error) {
    console.log(`❌ Redis connection error: ${error.message}`);
    return false;
  }
}

// Test 4: File System
function testFileSystem() {
  console.log('\n📁 Testing File System:');
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check if logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('✅ Created logs directory');
    } else {
      console.log('✅ Logs directory exists');
    }
    
    // Check if temp directory exists
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('✅ Created temp directory');
    } else {
      console.log('✅ Temp directory exists');
    }
    
    // Test write permissions
    const testFile = path.join(tempDir, 'test-write.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ File write permissions OK');
    
    return true;
  } catch (error) {
    console.log(`❌ File system error: ${error.message}`);
    return false;
  }
}

// Test 5: Database Manager
async function testDatabaseManager() {
  console.log('\n🔧 Testing Database Manager:');
  try {
    const databaseManager = require('./src/config/database');
    
    // Initialize database manager
    await databaseManager.initialize();
    
    const status = databaseManager.getStatus();
    console.log('✅ Database manager initialized');
    console.log(`   - Supabase: ${status.supabase ? 'Connected' : 'Not connected'}`);
    console.log(`   - Redis: ${status.redis}`);
    console.log(`   - Cache: ${status.cache ? 'Available' : 'Not available'}`);
    console.log(`   - Overall: ${status.isConnected ? 'Connected' : 'Not connected'}`);
    
    await databaseManager.close();
    return true;
  } catch (error) {
    console.log(`❌ Database manager error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting connection tests...\n');
  
  const results = {
    env: envCheckPassed,
    supabase: await testSupabase(),
    redis: await testRedis(),
    filesystem: testFileSystem(),
    databaseManager: await testDatabaseManager()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your backend is ready to run.');
    console.log('💡 You can now start the server with: npm start');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }
  
  return allPassed;
}

// Run the tests
runTests().catch(console.error); 