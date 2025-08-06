#!/usr/bin/env node

/**
 * Complete Railway Backend Test
 * Demonstrates the full working pipeline with Railway backend
 */

const https = require('https');

// Railway backend URL (tested and working)
const RAILWAY_BASE_URL = 'https://lokal-dev-production.up.railway.app';

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
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testCompletePipeline() {
  log(`${colors.bold}🚂 Railway Backend Complete Test${colors.reset}`, 'blue');
  log(`Testing all functionality with Railway backend`, 'blue');
  log(`Backend URL: ${RAILWAY_BASE_URL}`, 'blue');
  log(``, 'blue');
  
  // Test 1: Health Check
  log(`${colors.bold}1. Health Check${colors.reset}`, 'blue');
  try {
    const healthResult = await makeRequest(`${RAILWAY_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (healthResult.status === 200) {
      log(`✅ Health endpoint working - Status: ${healthResult.data.status}`, 'green');
      log(`🔧 Available features: ${Object.keys(healthResult.data.features || {}).join(', ')}`, 'green');
    } else {
      log(`❌ Health check failed`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
  
  // Test 2: Video Upload
  log(`\n${colors.bold}2. Video Upload Test${colors.reset}`, 'blue');
  try {
    const uploadData = {
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      title: 'Railway Backend Test Video',
      description: 'Testing complete Railway backend pipeline',
      manualProductName: 'Test Product',
      affiliateLink: 'https://example.com/product'
    };
    
    const uploadResult = await makeRequest(`${RAILWAY_BASE_URL}/api/videos/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(uploadData)
    });
    
    if (uploadResult.status === 200 && uploadResult.data.success) {
      log(`✅ Video upload successful`, 'green');
      log(`📹 Video ID: ${uploadResult.data.videoId}`, 'green');
      log(`⏱️  Processing time: ${uploadResult.data.processingTime || 'N/A'}ms`, 'green');
    } else {
      log(`❌ Video upload failed: ${uploadResult.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Video upload error: ${error.message}`, 'red');
    return false;
  }
  
  // Test 3: Object Detection (using existing processed video)
  log(`\n${colors.bold}3. Object Detection Test${colors.reset}`, 'blue');
  try {
    // Use a video that's already been processed
    const testVideoId = '3d6606a3-bc01-41d1-9579-4642bb936fc0';
    
    const detectionResult = await makeRequest(`${RAILWAY_BASE_URL}/api/videos/detect/${testVideoId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (detectionResult.status === 200 && detectionResult.data.success) {
      log(`✅ Object detection successful`, 'green');
      log(`🎯 Detected objects: ${detectionResult.data.objects?.length || 0}`, 'green');
      if (detectionResult.data.objects && detectionResult.data.objects.length > 0) {
        log(`📋 Objects: ${detectionResult.data.objects.join(', ')}`, 'green');
      }
      log(`🛍️  Matched products: ${detectionResult.data.matchedProducts?.length || 0}`, 'green');
    } else {
      log(`❌ Object detection failed: ${detectionResult.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Object detection error: ${error.message}`, 'red');
    return false;
  }
  
  // Test 4: Product Matching
  log(`\n${colors.bold}4. Product Matching Test${colors.reset}`, 'blue');
  try {
    const matchData = { objects: ['laptop', 'chair', 'car'] };
    
    const matchResult = await makeRequest(`${RAILWAY_BASE_URL}/api/products/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(matchData)
    });
    
    if (matchResult.status === 200 && matchResult.data.success) {
      log(`✅ Product matching successful`, 'green');
      log(`🛍️  Matched products: ${matchResult.data.products?.length || 0}`, 'green');
      if (matchResult.data.products && matchResult.data.products.length > 0) {
        matchResult.data.products.forEach((product, index) => {
          log(`   ${index + 1}. ${product.title} - $${product.price}`, 'green');
        });
      }
    } else {
      log(`❌ Product matching failed: ${matchResult.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Product matching error: ${error.message}`, 'red');
    return false;
  }
  
  // Test 5: Video Status
  log(`\n${colors.bold}5. Video Status Test${colors.reset}`, 'blue');
  try {
    const testVideoId = '3d6606a3-bc01-41d1-9579-4642bb936fc0';
    
    const statusResult = await makeRequest(`${RAILWAY_BASE_URL}/api/videos/status/${testVideoId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (statusResult.status === 200) {
      log(`✅ Video status retrieved`, 'green');
      log(`📊 Status: ${statusResult.data.status}`, 'green');
      log(`📈 Progress: ${statusResult.data.progress || 0}%`, 'green');
      if (statusResult.data.detectedObjects) {
        log(`🎯 Detected objects: ${statusResult.data.detectedObjects.length}`, 'green');
      }
    } else {
      log(`❌ Video status failed: ${statusResult.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Video status error: ${error.message}`, 'red');
    return false;
  }
  
  // Test 6: Get All Videos
  log(`\n${colors.bold}6. Get All Videos Test${colors.reset}`, 'blue');
  try {
    const videosResult = await makeRequest(`${RAILWAY_BASE_URL}/api/videos`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (videosResult.status === 200 && videosResult.data.success) {
      log(`✅ Get all videos successful`, 'green');
      log(`📹 Total videos: ${videosResult.data.videos?.length || 0}`, 'green');
    } else {
      log(`❌ Get all videos failed: ${videosResult.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Get all videos error: ${error.message}`, 'red');
    return false;
  }
  
  return true;
}

async function main() {
  try {
    const success = await testCompletePipeline();
    
    log(`\n${colors.bold}📊 Final Test Summary${colors.reset}`, 'blue');
    if (success) {
      log(`✅ All tests passed! Railway backend is fully operational`, 'green');
      log(`🚂 Your React Native app is ready to use Railway backend`, 'green');
      log(``, 'blue');
      log(`${colors.bold}🎯 Configuration for React Native App:${colors.reset}`, 'blue');
      log(`EXPO_PUBLIC_API_BASE_URL=https://lokal-dev-production.up.railway.app/api`, 'green');
      log(``, 'blue');
      log(`${colors.bold}🔧 Available Endpoints:${colors.reset}`, 'blue');
      log(`• POST /api/videos/upload - Video upload`, 'green');
      log(`• GET /api/videos/detect/:videoId - Object detection`, 'green');
      log(`• POST /api/products/match - Product matching`, 'green');
      log(`• GET /api/videos/status/:videoId - Video status`, 'green');
      log(`• GET /api/videos - Get all videos`, 'green');
      log(`• GET /api/health - Health check`, 'green');
    } else {
      log(`❌ Some tests failed. Please check Railway deployment`, 'red');
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  log(`❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
}); 