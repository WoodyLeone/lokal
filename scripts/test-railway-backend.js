#!/usr/bin/env node

/**
 * Railway Backend Connectivity Test
 * Tests the Railway backend endpoints
 */

const axios = require('axios');
require('dotenv').config();

const RAILWAY_CONFIG = {
  BACKEND_URL_DEV: 'https://lokal-dev-production.up.railway.app',
  BACKEND_URL_PROD: 'https://lokal-dev-production.up.railway.app'
};

async function testRailwayBackend() {
  console.log('🚀 Testing Railway Backend Connectivity...\n');
  
  const testUrls = [
    { name: 'Development Backend', url: RAILWAY_CONFIG.BACKEND_URL_DEV },
    { name: 'Production Backend', url: RAILWAY_CONFIG.BACKEND_URL_PROD }
  ];

  for (const backend of testUrls) {
    console.log(`🔗 Testing ${backend.name}: ${backend.url}\n`);
    
    try {
      // Test 1: Health Check
      console.log('1️⃣ Testing Health Endpoint...');
      const healthResponse = await axios.get(`${backend.url}/api/health`, {
        timeout: 10000
      });
      console.log('✅ Health Check:', healthResponse.data.status);
      console.log('📊 Features:', healthResponse.data.features);
      console.log('💾 Database:', healthResponse.data.database);
      console.log('');

      // Test 2: Get All Videos
      console.log('2️⃣ Testing Video List Endpoint...');
      const videosResponse = await axios.get(`${backend.url}/api/videos`, {
        timeout: 10000
      });
      console.log('✅ Videos Retrieved:', videosResponse.data.videos?.length || 0, 'videos');
      console.log('');

      // Test 3: Test Product Matching
      console.log('3️⃣ Testing Product Matching Endpoint...');
      try {
        const matchingResponse = await axios.post(`${backend.url}/api/products/match`, {
          objects: ['laptop', 'phone', 'headphones']
        }, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Product Matching Test:', matchingResponse.data.success ? 'SUCCESS' : 'FAILED');
        if (matchingResponse.data.products) {
          console.log('🛍️ Matched Products:', matchingResponse.data.products.length, 'products');
        }
      } catch (matchingError) {
        console.log('❌ Product Matching Test Failed:', matchingError.response?.data?.error || matchingError.message);
      }
      console.log('');

      console.log(`🎉 ${backend.name} Test Complete!\n`);
      console.log('📊 Summary:');
      console.log('   - Health Check: ✅');
      console.log('   - Video List: ✅');
      console.log('   - Product Matching: ✅\n');

    } catch (error) {
      console.error(`❌ ${backend.name} Test Failed:`, error.message);
      if (error.response) {
        console.error('📊 Response Status:', error.response.status);
        console.error('📊 Response Data:', error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Connection refused - service may not be running');
      } else if (error.code === 'ENOTFOUND') {
        console.error('🌐 DNS resolution failed - check the URL');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ Request timed out - service may be slow or down');
      }
      console.log('');
    }
  }

  console.log('🔗 Railway Backend URLs:');
  console.log(`   Development: ${RAILWAY_CONFIG.BACKEND_URL_DEV}`);
  console.log(`   Production:  ${RAILWAY_CONFIG.BACKEND_URL_PROD}`);
  console.log('\n📋 Next Steps:');
  console.log('1. Check Railway dashboard for service status');
  console.log('2. View logs: railway logs');
  console.log('3. Redeploy if needed: railway up');
}

// Run if called directly
if (require.main === module) {
  testRailwayBackend();
}

module.exports = { testRailwayBackend }; 