const https = require('https');

// Simulate React Native app API calls
class ReactNativeAPITester {
  constructor() {
    this.baseURL = 'https://lokal-prod-production.up.railway.app';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'LokalReactNative/1.0.0'
    };
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const options = {
        hostname: 'lokal-prod-production.up.railway.app',
        port: 443,
        path: path,
        method: method,
        headers: this.headers
      };

      if (body) {
        options.headers['Content-Length'] = Buffer.byteLength(body);
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
              status: res.statusCode,
              latency,
              success: res.statusCode >= 200 && res.statusCode < 300,
              data: jsonData,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              latency,
              success: res.statusCode >= 200 && res.statusCode < 300,
              data: data,
              headers: res.headers
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          status: 0,
          latency: 0,
          success: false,
          error: error.message
        });
      });
      
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({
          status: 0,
          latency: 0,
          success: false,
          error: 'Timeout'
        });
      });

      if (body) {
        req.write(body);
      }
      
      req.end();
    });
  }

  // Test app initialization
  async testAppInitialization() {
    console.log('📱 Testing React Native App Initialization...');
    
    const healthCheck = await this.makeRequest('/api/health');
    
    if (healthCheck.success) {
      console.log('✅ App can connect to Railway backend');
      console.log(`   🏥 Backend Status: ${healthCheck.data.status}`);
      console.log(`   ⏱️ Response Time: ${healthCheck.latency}ms`);
      console.log(`   🗄️ Database: ${healthCheck.data.database.postgresql}`);
      console.log(`   🔴 Redis: ${healthCheck.data.database.redis}`);
      return true;
    } else {
      console.log('❌ App cannot connect to Railway backend');
      return false;
    }
  }

  // Test product browsing (like HomeScreen)
  async testProductBrowsing() {
    console.log('\n🛍️ Testing Product Browsing (HomeScreen)...');
    
    const products = await this.makeRequest('/api/products');
    
    if (products.success) {
      console.log('✅ Product browsing working');
      console.log(`   📦 Total Products: ${products.data.count || products.data.products.length}`);
      console.log(`   ⏱️ Response Time: ${products.latency}ms`);
      
      // Test product categories
      const categories = [...new Set(products.data.products.map(p => p.category))];
      console.log(`   📂 Categories: ${categories.slice(0, 5).join(', ')}...`);
      
      return true;
    } else {
      console.log('❌ Product browsing failed');
      return false;
    }
  }

  // Test video upload simulation
  async testVideoUploadSimulation() {
    console.log('\n🎥 Testing Video Upload Simulation...');
    
    // Test video status endpoint
    const videos = await this.makeRequest('/api/videos');
    
    if (videos.success) {
      console.log('✅ Video management working');
      console.log(`   🎬 Total Videos: ${videos.data.videos.length}`);
      console.log(`   ⏱️ Response Time: ${videos.latency}ms`);
      
      // Check video statuses
      const statuses = videos.data.videos.reduce((acc, video) => {
        acc[video.status] = (acc[video.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   📊 Status Distribution: ${Object.entries(statuses).map(([k,v]) => `${k}:${v}`).join(', ')}`);
      
      return true;
    } else {
      console.log('❌ Video management failed');
      return false;
    }
  }

  // Test product matching (like object detection)
  async testProductMatching() {
    console.log('\n🔍 Testing Product Matching (Object Detection)...');
    
    const testObjects = ['laptop', 'phone', 'headphones', 'watch'];
    const matchResults = await this.makeRequest('/api/products/match', 'POST', JSON.stringify({
      objects: testObjects
    }));
    
    if (matchResults.success) {
      console.log('✅ Product matching working');
      console.log(`   🎯 Matched Products: ${matchResults.data.count || matchResults.data.products.length}`);
      console.log(`   ⏱️ Response Time: ${matchResults.latency}ms`);
      
      // Show some matched products
      const productNames = matchResults.data.products.slice(0, 3).map(p => p.title);
      console.log(`   📱 Sample Matches: ${productNames.join(', ')}...`);
      
      return true;
    } else {
      console.log('❌ Product matching failed');
      return false;
    }
  }

  // Test authentication endpoints
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication Endpoints...');
    
    // Test database auth endpoint
    const authTest = await this.makeRequest('/api/database/auth/me', 'GET');
    
    if (authTest.status === 401) {
      console.log('✅ Authentication properly secured (401 Unauthorized expected)');
      return true;
    } else if (authTest.success) {
      console.log('✅ Authentication working');
      return true;
    } else {
      console.log('⚠️ Authentication endpoint response unexpected');
      return false;
    }
  }

  // Performance test
  async testPerformance() {
    console.log('\n⚡ Testing API Performance...');
    
    const tests = [];
    const testCount = 5;
    
    for (let i = 0; i < testCount; i++) {
      const start = Date.now();
      const result = await this.makeRequest('/api/health');
      const latency = Date.now() - start;
      tests.push({ latency, success: result.success });
    }
    
    const successfulTests = tests.filter(t => t.success);
    const avgLatency = successfulTests.reduce((sum, t) => sum + t.latency, 0) / successfulTests.length;
    const minLatency = Math.min(...successfulTests.map(t => t.latency));
    const maxLatency = Math.max(...successfulTests.map(t => t.latency));
    
    console.log(`   📊 Performance Results (${successfulTests.length}/${testCount} successful):`);
    console.log(`   ⏱️ Average Latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`   🚀 Best Latency: ${minLatency}ms`);
    console.log(`   🐌 Worst Latency: ${maxLatency}ms`);
    
    // Performance rating
    let rating = '🟢 Excellent';
    if (avgLatency > 1000) rating = '🔴 Poor';
    else if (avgLatency > 500) rating = '🟡 Good';
    
    console.log(`   📈 Performance Rating: ${rating}`);
    
    return avgLatency < 1000;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 React Native App Connectivity Test Suite');
    console.log('==========================================\n');
    
    const results = {
      initialization: await this.testAppInitialization(),
      productBrowsing: await this.testProductBrowsing(),
      videoUpload: await this.testVideoUploadSimulation(),
      productMatching: await this.testProductMatching(),
      authentication: await this.testAuthentication(),
      performance: await this.testPerformance()
    };
    
    // Summary
    console.log('\n📊 React Native App Test Results:');
    console.log('==================================');
    
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').trim()}`);
    });
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Your React Native app is fully ready for Railway!');
      console.log('📱 All functionality is working correctly.');
    } else {
      console.log('⚠️ Some functionality needs attention.');
    }
    
    return results;
  }
}

// Run the tests
const tester = new ReactNativeAPITester();
tester.runAllTests().catch(console.error); 