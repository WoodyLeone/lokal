#!/usr/bin/env node

/**
 * Railway Performance Monitor
 * Monitors Railway backend performance and provides insights
 */

const https = require('https');

// Railway backend URL
const RAILWAY_BASE_URL = 'https://lokal-dev-production.up.railway.app';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? require('https') : require('http');
    
    const req = protocol.request(url, options, (res) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            latency,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            latency,
            data: data,
            headers: res.headers,
            parseError: true
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testEndpoint(endpoint, method = 'GET', data = null) {
  const url = `${RAILWAY_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Accept': 'application/json' }
  };
  
  if (data && method === 'POST') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  
  try {
    const result = await makeRequest(url, options);
    return {
      success: result.status === 200,
      latency: result.latency,
      status: result.status,
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      latency: null
    };
  }
}

async function monitorPerformance() {
  log(`${colors.bold}🚂 Railway Performance Monitor${colors.reset}`, 'blue');
  log(`Monitoring Railway backend performance`, 'blue');
  log(`Backend URL: ${RAILWAY_BASE_URL}`, 'blue');
  log(``, 'blue');
  
  const results = {
    timestamp: new Date().toISOString(),
    endpoints: {},
    summary: {
      totalEndpoints: 0,
      successfulEndpoints: 0,
      averageLatency: 0,
      totalLatency: 0
    }
  };
  
  // Test all endpoints
  const endpoints = [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/videos', method: 'GET', name: 'Get All Videos' },
    { path: '/api/videos/status/3d6606a3-bc01-41d1-9579-4642bb936fc0', method: 'GET', name: 'Video Status' },
    { path: '/api/videos/detect/3d6606a3-bc01-41d1-9579-4642bb936fc0', method: 'GET', name: 'Object Detection' },
    { path: '/api/products/match', method: 'POST', name: 'Product Matching', data: { objects: ['laptop'] } }
  ];
  
  results.summary.totalEndpoints = endpoints.length;
  
  for (const endpoint of endpoints) {
    log(`🔍 Testing ${endpoint.name}...`, 'blue');
    
    const result = await testEndpoint(endpoint.path, endpoint.method, endpoint.data);
    results.endpoints[endpoint.name] = result;
    
    if (result.success) {
      log(`✅ ${endpoint.name} - ${result.latency}ms`, 'green');
      results.summary.successfulEndpoints++;
      results.summary.totalLatency += result.latency;
    } else {
      log(`❌ ${endpoint.name} - ${result.error || `HTTP ${result.status}`}`, 'red');
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Calculate average latency
  if (results.summary.successfulEndpoints > 0) {
    results.summary.averageLatency = Math.round(results.summary.totalLatency / results.summary.successfulEndpoints);
  }
  
  // Performance analysis
  log(`\n${colors.bold}📊 Performance Analysis${colors.reset}`, 'blue');
  log(`⏰ Timestamp: ${results.timestamp}`, 'cyan');
  log(`✅ Success Rate: ${results.summary.successfulEndpoints}/${results.summary.totalEndpoints} (${Math.round(results.summary.successfulEndpoints/results.summary.totalEndpoints*100)}%)`, 'green');
  log(`⚡ Average Latency: ${results.summary.averageLatency}ms`, 'green');
  
  // Latency analysis
  const latencies = Object.values(results.endpoints)
    .filter(r => r.success && r.latency)
    .map(r => r.latency)
    .sort((a, b) => a - b);
  
  if (latencies.length > 0) {
    log(`📈 Latency Range: ${latencies[0]}ms - ${latencies[latencies.length-1]}ms`, 'cyan');
    log(`📊 Median Latency: ${latencies[Math.floor(latencies.length/2)]}ms`, 'cyan');
  }
  
  // Performance recommendations
  log(`\n${colors.bold}💡 Performance Recommendations${colors.reset}`, 'blue');
  
  if (results.summary.averageLatency < 500) {
    log(`✅ Excellent performance! Average latency is very good`, 'green');
  } else if (results.summary.averageLatency < 1000) {
    log(`⚠️  Good performance, but consider optimization for better user experience`, 'yellow');
  } else {
    log(`❌ Performance needs improvement. Consider scaling or optimization`, 'red');
  }
  
  if (results.summary.successfulEndpoints === results.summary.totalEndpoints) {
    log(`✅ All endpoints are responding correctly`, 'green');
  } else {
    log(`⚠️  Some endpoints are failing. Check Railway deployment status`, 'yellow');
  }
  
  // Railway dashboard info
  log(`\n${colors.bold}🔗 Railway Dashboard${colors.reset}`, 'blue');
  log(`📊 Monitor your Railway deployment at: https://railway.app/dashboard`, 'cyan');
  log(`📈 Check metrics, logs, and performance data`, 'cyan');
  log(`🔧 Configure auto-scaling and resource allocation`, 'cyan');
  
  // Save results to file
  const fs = require('fs');
  const resultsFile = `railway-performance-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  log(`\n💾 Performance data saved to: ${resultsFile}`, 'cyan');
  
  return results;
}

async function continuousMonitoring(intervalMinutes = 5) {
  log(`${colors.bold}🔄 Starting Continuous Monitoring${colors.reset}`, 'blue');
  log(`Monitoring every ${intervalMinutes} minutes`, 'blue');
  log(`Press Ctrl+C to stop`, 'blue');
  log(``, 'blue');
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  while (true) {
    try {
      await monitorPerformance();
      log(`\n⏰ Next check in ${intervalMinutes} minutes...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      log(`❌ Monitoring error: ${error.message}`, 'red');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous') || args.includes('-c')) {
    const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 5;
    await continuousMonitoring(interval);
  } else {
    await monitorPerformance();
  }
}

// Run the monitor
main().catch(error => {
  log(`❌ Monitor failed: ${error.message}`, 'red');
  process.exit(1);
}); 