#!/usr/bin/env node

const axios = require('axios');

// Replace this with your actual Railway URL once deployed
const RAILWAY_URL = 'https://your-app-name.up.railway.app'; // UPDATE THIS

async function testRailwayDeployment() {
  console.log('🚂 Testing Railway Deployment...\n');
  
  try {
    // Test 1: Basic health check
    console.log('1️⃣ Testing basic health endpoint...');
    const healthResponse = await axios.get(`${RAILWAY_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Database health
    console.log('\n2️⃣ Testing database health...');
    const dbHealthResponse = await axios.get(`${RAILWAY_URL}/api/health/database`);
    console.log('✅ Database health passed:', dbHealthResponse.data);
    
    // Test 3: Cache health
    console.log('\n3️⃣ Testing cache health...');
    const cacheHealthResponse = await axios.get(`${RAILWAY_URL}/api/health/cache`);
    console.log('✅ Cache health passed:', cacheHealthResponse.data);
    
    // Test 4: Products endpoint
    console.log('\n4️⃣ Testing products endpoint...');
    const productsResponse = await axios.get(`${RAILWAY_URL}/api/products`);
    console.log('✅ Products endpoint passed:', productsResponse.data.length, 'products found');
    
    console.log('\n🎉 All tests passed! Railway deployment is working correctly!');
    console.log(`🌐 Your production URL: ${RAILWAY_URL}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Update the URL and run the test
if (RAILWAY_URL === 'https://your-app-name.up.railway.app') {
  console.log('⚠️  Please update the RAILWAY_URL in this script with your actual Railway URL');
  console.log('Then run: node test-railway-deployment.js');
} else {
  testRailwayDeployment();
} 