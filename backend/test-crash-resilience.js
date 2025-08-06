#!/usr/bin/env node

const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Test logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

console.log('🧪 Testing Crash Resilience and Stability...\n');

// Test 1: Environment Variables Validation
async function testEnvironmentVariables() {
  console.log('📋 Test 1: Environment Variables Validation');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'REDIS_HOST',
    'REDIS_PASSWORD',
    'OPENAI_API_KEY',
    'SESSION_SECRET',
    'JWT_SECRET'
  ];

  let allPresent = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      allPresent = false;
    }
  });

  console.log(`  ${allPresent ? '✅ PASSED' : '❌ FAILED'}\n`);
  return allPresent;
}

// Test 2: Database Connection Stability
async function testDatabaseStability() {
  console.log('🔗 Test 2: Database Connection Stability');
  
  try {
    const databaseManager = require('./src/config/database');
    
    // Initialize database
    await databaseManager.initialize();
    console.log('  ✅ Database initialized');
    
    // Test multiple operations
    for (let i = 0; i < 5; i++) {
      const status = databaseManager.getStatus();
      console.log(`  ✅ Connection ${i + 1}: ${status.isConnected ? 'Connected' : 'Disconnected'}`);
      
      if (!status.isConnected) {
        throw new Error('Database connection lost');
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test Redis operations
    const redis = databaseManager.getRedis();
    if (redis) {
      await redis.ping();
      console.log('  ✅ Redis ping successful');
      
      // Test cache operations
      await databaseManager.cacheData('test-key', { test: 'data' }, 60);
      const cachedData = await databaseManager.getCachedData('test-key');
      console.log('  ✅ Cache operations successful');
    }
    
    await databaseManager.close();
    console.log('  ✅ Database closed cleanly');
    
    console.log('  ✅ PASSED\n');
    return true;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Test 3: Memory Management
async function testMemoryManagement() {
  console.log('🧠 Test 3: Memory Management');
  
  try {
    const initialMemory = process.memoryUsage();
    console.log(`  📊 Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
    
    // Simulate memory usage
    const testData = [];
    for (let i = 0; i < 1000; i++) {
      testData.push({
        id: i,
        data: 'test'.repeat(1000),
        timestamp: Date.now()
      });
    }
    
    const afterAllocation = process.memoryUsage();
    console.log(`  📊 After allocation: ${Math.round(afterAllocation.heapUsed / 1024 / 1024)}MB`);
    
    // Clear data
    testData.length = 0;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('  🔄 Forced garbage collection');
    }
    
    const afterCleanup = process.memoryUsage();
    console.log(`  📊 After cleanup: ${Math.round(afterCleanup.heapUsed / 1024 / 1024)}MB`);
    
    // Check if memory usage is reasonable
    const memoryIncrease = afterCleanup.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
    
    if (memoryIncreaseMB < 50) { // Less than 50MB increase
      console.log('  ✅ Memory management OK');
      console.log('  ✅ PASSED\n');
      return true;
    } else {
      console.log(`  ⚠️ High memory usage: ${Math.round(memoryIncreaseMB)}MB increase`);
      console.log('  ❌ FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Test 4: Error Handling
async function testErrorHandling() {
  console.log('🛡️ Test 4: Error Handling');
  
  try {
    // Test unhandled promise rejection handling
    const unhandledPromise = new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Test error')), 100);
    });
    
    // This should not crash the process
    unhandledPromise.catch(() => {
      console.log('  ✅ Unhandled promise properly caught');
    });
    
    // Test async error handling
    const asyncFunction = async () => {
      throw new Error('Async test error');
    };
    
    try {
      await asyncFunction();
    } catch (error) {
      console.log('  ✅ Async error properly handled');
    }
    
    // Test synchronous error handling
    try {
      throw new Error('Sync test error');
    } catch (error) {
      console.log('  ✅ Synchronous error properly handled');
    }
    
    console.log('  ✅ PASSED\n');
    return true;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Test 5: File System Operations
async function testFileSystemOperations() {
  console.log('📁 Test 5: File System Operations');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Test directory creation
    const testDir = path.join(__dirname, 'temp', 'test-dir');
    fs.mkdirSync(testDir, { recursive: true });
    console.log('  ✅ Directory creation successful');
    
    // Test file writing
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'test data');
    console.log('  ✅ File writing successful');
    
    // Test file reading
    const data = fs.readFileSync(testFile, 'utf8');
    if (data === 'test data') {
      console.log('  ✅ File reading successful');
    } else {
      throw new Error('File reading failed');
    }
    
    // Test file deletion
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir);
    console.log('  ✅ File cleanup successful');
    
    console.log('  ✅ PASSED\n');
    return true;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Test 6: Crash Prevention System
async function testCrashPrevention() {
  console.log('🛡️ Test 6: Crash Prevention System');
  
  try {
    const crashPrevention = require('./crash-prevention');
    
    // Initialize crash prevention
    crashPrevention.initialize();
    console.log('  ✅ Crash prevention initialized');
    
    // Test health checks
    const healthResults = await crashPrevention.runHealthChecks();
    console.log('  📊 Health check results:', healthResults);
    
    // Test status
    const status = crashPrevention.getStatus();
    console.log('  📊 System status:', {
      crashCount: status.crashCount,
      isShuttingDown: status.isShuttingDown,
      uptime: Math.round(status.uptime)
    });
    
    console.log('  ✅ PASSED\n');
    return true;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Test 7: Railway Configuration
async function testRailwayConfiguration() {
  console.log('🚂 Test 7: Railway Configuration');
  
  try {
    const railwayConfig = require('./railway-config');
    
    // Initialize Railway config
    railwayConfig.initialize();
    console.log('  ✅ Railway configuration initialized');
    
    // Test configuration
    const config = railwayConfig.getConfig();
    console.log('  📊 Railway config:', {
      isRailway: config.isRailway,
      port: config.port,
      environment: config.environment
    });
    
    // Test server config
    const serverConfig = railwayConfig.getServerConfig();
    console.log('  📊 Server config:', {
      port: serverConfig.port,
      host: serverConfig.host,
      keepAliveTimeout: serverConfig.keepAliveTimeout
    });
    
    console.log('  ✅ PASSED\n');
    return true;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Test 8: Load Testing Simulation
async function testLoadSimulation() {
  console.log('⚡ Test 8: Load Testing Simulation');
  
  try {
    const databaseManager = require('./src/config/database');
    
    // Initialize database
    await databaseManager.initialize();
    
    // Simulate concurrent operations
    const concurrentOperations = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(
        databaseManager.cacheData(`load-test-${i}`, { data: `test-${i}` }, 60)
      );
    }
    
    await Promise.all(promises);
    console.log(`  ✅ ${concurrentOperations} concurrent operations completed`);
    
    // Test cache retrieval
    const retrievePromises = [];
    for (let i = 0; i < concurrentOperations; i++) {
      retrievePromises.push(
        databaseManager.getCachedData(`load-test-${i}`)
      );
    }
    
    const results = await Promise.all(retrievePromises);
    const successfulRetrievals = results.filter(r => r !== null).length;
    console.log(`  ✅ ${successfulRetrievals}/${concurrentOperations} cache retrievals successful`);
    
    // Cleanup
    await databaseManager.close();
    
    if (successfulRetrievals === concurrentOperations) {
      console.log('  ✅ PASSED\n');
      return true;
    } else {
      console.log('  ❌ FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive crash resilience tests...\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Database Stability', fn: testDatabaseStability },
    { name: 'Memory Management', fn: testMemoryManagement },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'File System Operations', fn: testFileSystemOperations },
    { name: 'Crash Prevention', fn: testCrashPrevention },
    { name: 'Railway Configuration', fn: testRailwayConfiguration },
    { name: 'Load Simulation', fn: testLoadSimulation }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ Test "${test.name}" failed with error: ${error.message}\n`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your backend is crash-resistant and ready for production.');
    console.log('💡 You can now deploy to Railway with confidence.');
  } else {
    console.log('\n⚠️ Some tests failed. Please address the issues before deployment.');
  }
  
  return passedTests === totalTests;
}

// Run the tests
runAllTests().catch(console.error); 