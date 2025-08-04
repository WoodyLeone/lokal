const https = require('https');

class PerformanceTester {
  constructor() {
    this.baseURL = 'https://lokal-prod-production.up.railway.app';
  }

  async makeRequest(path, method = 'GET') {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const options = {
        hostname: 'lokal-prod-production.up.railway.app',
        port: 443,
        path: path,
        method: method,
        headers: {
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        }
      };

      const req = https.request(options, (res) => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            latency,
            success: res.statusCode >= 200 && res.statusCode < 300,
            size: data.length
          });
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
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          status: 0,
          latency: 0,
          success: false,
          error: 'Timeout'
        });
      });
      
      req.end();
    });
  }

  async testEndpointPerformance(endpoint, name, iterations = 10) {
    console.log(`\n⚡ Testing ${name} Performance (${iterations} requests)...`);
    
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await this.makeRequest(endpoint);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    if (successfulResults.length === 0) {
      console.log(`❌ All ${iterations} requests failed`);
      return null;
    }
    
    const latencies = successfulResults.map(r => r.latency);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const medianLatency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)];
    
    console.log(`   📊 Results: ${successfulResults.length}/${iterations} successful`);
    console.log(`   ⏱️ Average: ${avgLatency.toFixed(0)}ms`);
    console.log(`   🚀 Minimum: ${minLatency}ms`);
    console.log(`   🐌 Maximum: ${maxLatency}ms`);
    console.log(`   📈 Median: ${medianLatency}ms`);
    
    // Performance rating
    let rating = '🟢 Excellent';
    if (avgLatency > 1000) rating = '🔴 Poor';
    else if (avgLatency > 500) rating = '🟡 Good';
    else if (avgLatency > 200) rating = '🟢 Good';
    
    console.log(`   📊 Rating: ${rating}`);
    
    if (failedResults.length > 0) {
      console.log(`   ⚠️ ${failedResults.length} failed requests`);
    }
    
    return {
      endpoint,
      name,
      avgLatency,
      minLatency,
      maxLatency,
      medianLatency,
      successRate: successfulResults.length / iterations,
      rating
    };
  }

  async runPerformanceTests() {
    console.log('🚀 Railway API Performance Optimization Test');
    console.log('============================================');
    
    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/products', name: 'Products API' },
      { path: '/api/videos', name: 'Videos API' },
      { path: '/api/products/match', name: 'Product Matching API' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const result = await this.testEndpointPerformance(endpoint.path, endpoint.name, 8);
      if (result) {
        results.push(result);
      }
    }
    
    // Summary
    console.log('\n📊 Performance Summary:');
    console.log('=======================');
    
    if (results.length === 0) {
      console.log('❌ No endpoints tested successfully');
      return;
    }
    
    const overallAvg = results.reduce((sum, r) => sum + r.avgLatency, 0) / results.length;
    const bestEndpoint = results.reduce((best, current) => 
      current.avgLatency < best.avgLatency ? current : best
    );
    const worstEndpoint = results.reduce((worst, current) => 
      current.avgLatency > worst.avgLatency ? current : worst
    );
    
    console.log(`🌐 Overall Average: ${overallAvg.toFixed(0)}ms`);
    console.log(`🚀 Fastest: ${bestEndpoint.name} (${bestEndpoint.avgLatency.toFixed(0)}ms)`);
    console.log(`🐌 Slowest: ${worstEndpoint.name} (${worstEndpoint.avgLatency.toFixed(0)}ms)`);
    
    // Recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('===============================');
    
    if (overallAvg > 1000) {
      console.log('🔴 CRITICAL: Response times are too slow for mobile apps');
      console.log('   - Consider implementing caching');
      console.log('   - Optimize database queries');
      console.log('   - Add CDN for static content');
    } else if (overallAvg > 500) {
      console.log('🟡 WARNING: Response times could be improved');
      console.log('   - Implement response caching');
      console.log('   - Consider database indexing');
      console.log('   - Add compression middleware');
    } else if (overallAvg > 200) {
      console.log('🟢 GOOD: Response times are acceptable');
      console.log('   - Consider implementing caching for better UX');
      console.log('   - Monitor performance under load');
    } else {
      console.log('🟢 EXCELLENT: Response times are optimal');
      console.log('   - Great performance for mobile apps');
      console.log('   - Consider implementing offline caching');
    }
    
    // Specific recommendations
    results.forEach(result => {
      if (result.avgLatency > 500) {
        console.log(`   ⚡ Optimize ${result.name}: Consider caching or query optimization`);
      }
    });
    
    return results;
  }
}

// Run performance tests
const tester = new PerformanceTester();
tester.runPerformanceTests().catch(console.error); 