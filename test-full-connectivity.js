const https = require('https');

// Railway backend URL
const RAILWAY_URL = 'https://lokal-prod-production.up.railway.app';

// Test endpoints
const ENDPOINTS = [
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/products', method: 'GET', name: 'Products API' },
  { path: '/api/videos', method: 'GET', name: 'Videos API' },
  { path: '/api/products/match', method: 'POST', name: 'Product Matching API', body: JSON.stringify({ objects: ['laptop', 'phone'] }) },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'lokal-prod-production.up.railway.app',
      port: 443,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    if (endpoint.body) {
      options.headers['Content-Length'] = Buffer.byteLength(endpoint.body);
    }

    const req = https.request(options, (res) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            name: endpoint.name,
            status: res.statusCode,
            latency,
            success: res.statusCode === 200,
            data: jsonData,
            endpoint: endpoint.path
          });
        } catch (e) {
          resolve({
            name: endpoint.name,
            status: res.statusCode,
            latency,
            success: res.statusCode === 200,
            data: data,
            endpoint: endpoint.path
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        status: 0,
        latency: 0,
        success: false,
        error: error.message,
        endpoint: endpoint.path
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        status: 0,
        latency: 0,
        success: false,
        error: 'Timeout',
        endpoint: endpoint.path
      });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing Full Railway Backend Connectivity...\n');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    console.log(`Testing ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${endpoint.name}: ${result.status} (${result.latency}ms)`);
      
      // Show some data for successful endpoints
      if (result.data && result.data.success) {
        if (result.data.products) {
          console.log(`   📦 Products: ${result.data.count || result.data.products.length} items`);
        }
        if (result.data.videos) {
          console.log(`   🎥 Videos: ${result.data.videos.length} items`);
        }
        if (result.data.status) {
          console.log(`   🏥 Status: ${result.data.status}`);
        }
      }
    } else {
      console.log(`❌ ${endpoint.name}: ${result.error || result.status}`);
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Full Connectivity Test Results:');
  console.log('=====================================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n✅ Working Endpoints:');
    successfulTests.forEach(r => {
      console.log(`   - ${r.name} (${r.latency}ms)`);
    });
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failedTests.forEach(r => {
      console.log(`   - ${r.name}: ${r.error || r.status}`);
    });
  }
  
  // Overall status
  const overallSuccess = successfulTests.length === results.length;
  console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ FULLY CONNECTED' : '⚠️ PARTIALLY CONNECTED'}`);
  
  if (overallSuccess) {
    console.log('🚀 Your React Native app is ready to connect to Railway!');
    console.log('🌐 Backend URL: https://lokal-prod-production.up.railway.app');
    console.log('📱 All API endpoints are working correctly.');
  } else {
    console.log('⚠️ Some endpoints are not working. Check the failed endpoints above.');
  }
  
  return results;
}

// Run the test
testAllEndpoints().catch(console.error); 