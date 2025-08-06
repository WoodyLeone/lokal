#!/usr/bin/env node

/**
 * Railway Backend Connectivity Test
 * Tests all Railway backend endpoints and functionality
 */

const https = require('https');
const http = require('http');

// Railway URLs to test
const RAILWAY_URLS = [
  'https://lokal-dev-production.up.railway.app',
  'https://lokal-backend-production.up.railway.app',
  'https://lokal-backend.up.railway.app',
];

// Test endpoints
const ENDPOINTS = [
  '/api/health',
  '/api/videos',
  '/api/products',
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
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
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  
  try {
    log(`🔍 Testing: ${url}`, 'blue');
    const result = await makeRequest(url);
    
    if (result.status === 200) {
      log(`✅ ${endpoint} - Status: ${result.status}, Latency: ${result.latency}ms`, 'green');
      
      if (endpoint === '/api/health') {
        log(`   📊 Health Status: ${result.data.status || 'unknown'}`, 'green');
        if (result.data.features) {
          log(`   🔧 Features: ${Object.keys(result.data.features).join(', ')}`, 'green');
        }
      }
      
      return { success: true, latency: result.latency, data: result.data };
    } else {
      log(`⚠️  ${endpoint} - Status: ${result.status}`, 'yellow');
      return { success: false, status: result.status };
    }
  } catch (error) {
    log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testBackend(baseUrl) {
  log(`\n${colors.bold}🚂 Testing Railway Backend: ${baseUrl}${colors.reset}`, 'blue');
  
  const results = {
    baseUrl,
    endpoints: {},
    overall: { success: false, avgLatency: 0 }
  };
  
  let successfulEndpoints = 0;
  let totalLatency = 0;
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(baseUrl, endpoint);
    results.endpoints[endpoint] = result;
    
    if (result.success) {
      successfulEndpoints++;
      totalLatency += result.latency;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  results.overall.success = successfulEndpoints === ENDPOINTS.length;
  results.overall.avgLatency = successfulEndpoints > 0 ? Math.round(totalLatency / successfulEndpoints) : 0;
  
  if (results.overall.success) {
    log(`✅ Backend fully operational - Avg Latency: ${results.overall.avgLatency}ms`, 'green');
  } else {
    log(`⚠️  Backend partially operational - ${successfulEndpoints}/${ENDPOINTS.length} endpoints working`, 'yellow');
  }
  
  return results;
}

async function testVideoUpload(baseUrl) {
  log(`\n${colors.bold}📤 Testing Video Upload Endpoint${colors.reset}`, 'blue');
  
  try {
    const url = `${baseUrl}/api/videos/upload`;
    log(`🔍 Testing upload endpoint: ${url}`, 'blue');
    
    // Test with a simple POST request (without actual file)
    const testData = {
      title: 'Test Video',
      description: 'Test upload endpoint',
      videoUrl: 'https://example.com/test-video.mp4'
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.status === 400) {
      log(`✅ Upload endpoint responding (expected 400 for test data)`, 'green');
      return { success: true, status: response.status };
    } else if (response.status === 200) {
      log(`✅ Upload endpoint working`, 'green');
      return { success: true, status: response.status };
    } else {
      log(`⚠️  Upload endpoint status: ${response.status}`, 'yellow');
      return { success: false, status: response.status };
    }
  } catch (error) {
    log(`❌ Upload endpoint error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  log(`${colors.bold}🚂 Railway Backend Connectivity Test${colors.reset}`, 'blue');
  log(`Testing ${RAILWAY_URLS.length} Railway URLs...`, 'blue');
  
  const allResults = [];
  
  for (const baseUrl of RAILWAY_URLS) {
    const results = await testBackend(baseUrl);
    allResults.push(results);
    
    // Test video upload for the first working backend
    if (results.overall.success) {
      await testVideoUpload(baseUrl);
      break;
    }
  }
  
  // Summary
  log(`\n${colors.bold}📊 Test Summary${colors.reset}`, 'blue');
  
  const workingBackends = allResults.filter(r => r.overall.success);
  const bestBackend = workingBackends.sort((a, b) => a.overall.avgLatency - b.overall.avgLatency)[0];
  
  if (workingBackends.length > 0) {
    log(`✅ ${workingBackends.length}/${RAILWAY_URLS.length} backends are operational`, 'green');
    log(`🏆 Best performing backend: ${bestBackend.baseUrl}`, 'green');
    log(`⚡ Average latency: ${bestBackend.overall.avgLatency}ms`, 'green');
    
    log(`\n${colors.bold}🎯 Recommended Configuration${colors.reset}`, 'blue');
    log(`EXPO_PUBLIC_API_BASE_URL=${bestBackend.baseUrl}/api`, 'green');
  } else {
    log(`❌ No operational backends found`, 'red');
    log(`🔧 Please check Railway deployment status`, 'yellow');
  }
  
  // Detailed results
  log(`\n${colors.bold}📋 Detailed Results${colors.reset}`, 'blue');
  allResults.forEach((result, index) => {
    const status = result.overall.success ? '✅' : '❌';
    log(`${status} ${result.baseUrl} - Latency: ${result.overall.avgLatency}ms`, result.overall.success ? 'green' : 'red');
  });
}

// Run the test
main().catch(error => {
  log(`❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
}); 