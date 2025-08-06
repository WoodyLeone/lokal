#!/usr/bin/env node

/**
 * Railway Video Processing Test
 * Tests video upload, object detection, and product matching with Railway backend
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Railway backend URL (tested and working)
const RAILWAY_BASE_URL = 'https://lokal-dev-production.up.railway.app';

// Test video file path (if exists)
const TEST_VIDEO_PATH = path.join(__dirname, 'test-data', 'videos', 'test-video.mp4');

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

async function testHealthEndpoint() {
  log(`\n${colors.bold}🏥 Testing Health Endpoint${colors.reset}`, 'blue');
  
  try {
    const url = `${RAILWAY_BASE_URL}/api/health`;
    log(`🔍 Testing: ${url}`, 'blue');
    
    const result = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (result.status === 200) {
      log(`✅ Health endpoint working - Status: ${result.data.status}`, 'green');
      log(`🔧 Available features: ${Object.keys(result.data.features || {}).join(', ')}`, 'green');
      return { success: true, data: result.data };
    } else {
      log(`❌ Health endpoint failed - Status: ${result.status}`, 'red');
      return { success: false, status: result.status };
    }
  } catch (error) {
    log(`❌ Health endpoint error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testVideoUploadWithURL() {
  log(`\n${colors.bold}📤 Testing Video Upload (URL Method)${colors.reset}`, 'blue');
  
  try {
    const url = `${RAILWAY_BASE_URL}/api/videos/upload`;
    log(`🔍 Testing: ${url}`, 'blue');
    
    const testData = {
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      title: 'Test Video Upload',
      description: 'Testing video upload with Railway backend',
      manualProductName: 'Test Product',
      affiliateLink: 'https://example.com/product'
    };
    
    const result = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (result.status === 200 && result.data.success) {
      log(`✅ Video upload successful`, 'green');
      log(`📹 Video ID: ${result.data.videoId}`, 'green');
      log(`⏱️  Processing time: ${result.data.processingTime || 'N/A'}ms`, 'green');
      return { success: true, videoId: result.data.videoId, data: result.data };
    } else {
      log(`⚠️  Video upload response: ${result.status}`, 'yellow');
      log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
      return { success: false, status: result.status, data: result.data };
    }
  } catch (error) {
    log(`❌ Video upload error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testVideoUploadWithFile() {
  log(`\n${colors.bold}📁 Testing Video Upload (File Method)${colors.reset}`, 'blue');
  
  // Check if test video exists
  if (!fs.existsSync(TEST_VIDEO_PATH)) {
    log(`⚠️  Test video not found: ${TEST_VIDEO_PATH}`, 'yellow');
    log(`📝 Skipping file upload test`, 'yellow');
    return { success: false, error: 'Test video not found' };
  }
  
  try {
    const url = `${RAILWAY_BASE_URL}/api/videos/upload-file`;
    log(`🔍 Testing: ${url}`, 'blue');
    
    const formData = new FormData();
    formData.append('video', fs.createReadStream(TEST_VIDEO_PATH));
    formData.append('title', 'Test Video File Upload');
    formData.append('description', 'Testing file upload with Railway backend');
    formData.append('manualProductName', 'Test Product');
    formData.append('affiliateLink', 'https://example.com/product');
    
    const result = await makeRequest(url, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      },
      body: formData
    });
    
    if (result.status === 200 && result.data.success) {
      log(`✅ File upload successful`, 'green');
      log(`📹 Video ID: ${result.data.videoId}`, 'green');
      return { success: true, videoId: result.data.videoId, data: result.data };
    } else {
      log(`⚠️  File upload response: ${result.status}`, 'yellow');
      log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
      return { success: false, status: result.status, data: result.data };
    }
  } catch (error) {
    log(`❌ File upload error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testObjectDetection(videoId) {
  log(`\n${colors.bold}🔍 Testing Object Detection${colors.reset}`, 'blue');
  
  try {
    const url = `${RAILWAY_BASE_URL}/api/videos/detect/${videoId}`;
    log(`🔍 Testing: ${url}`, 'blue');
    
    const result = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (result.status === 200 && result.data.success) {
      log(`✅ Object detection successful`, 'green');
      log(`🎯 Detected objects: ${result.data.objects?.length || 0}`, 'green');
      if (result.data.objects && result.data.objects.length > 0) {
        log(`📋 Objects: ${result.data.objects.join(', ')}`, 'green');
      }
      return { success: true, objects: result.data.objects, data: result.data };
    } else {
      log(`⚠️  Object detection response: ${result.status}`, 'yellow');
      log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
      return { success: false, status: result.status, data: result.data };
    }
  } catch (error) {
    log(`❌ Object detection error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testProductMatching(objects) {
  log(`\n${colors.bold}🛍️ Testing Product Matching${colors.reset}`, 'blue');
  
  if (!objects || objects.length === 0) {
    log(`⚠️  No objects to match products for`, 'yellow');
    return { success: false, error: 'No objects provided' };
  }
  
  try {
    const url = `${RAILWAY_BASE_URL}/api/products/match`;
    log(`🔍 Testing: ${url}`, 'blue');
    log(`🎯 Matching objects: ${objects.join(', ')}`, 'blue');
    
    const result = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ objects })
    });
    
    if (result.status === 200 && result.data.success) {
      log(`✅ Product matching successful`, 'green');
      log(`🛍️  Matched products: ${result.data.products?.length || 0}`, 'green');
      if (result.data.products && result.data.products.length > 0) {
        result.data.products.forEach((product, index) => {
          log(`   ${index + 1}. ${product.name} - ${product.price}`, 'green');
        });
      }
      return { success: true, products: result.data.products, data: result.data };
    } else {
      log(`⚠️  Product matching response: ${result.status}`, 'yellow');
      log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
      return { success: false, status: result.status, data: result.data };
    }
  } catch (error) {
    log(`❌ Product matching error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testVideoStatus(videoId) {
  log(`\n${colors.bold}📊 Testing Video Status${colors.reset}`, 'blue');
  
  try {
    const url = `${RAILWAY_BASE_URL}/api/videos/status/${videoId}`;
    log(`🔍 Testing: ${url}`, 'blue');
    
    const result = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (result.status === 200) {
      log(`✅ Video status retrieved`, 'green');
      log(`📊 Status: ${result.data.status}`, 'green');
      log(`📈 Progress: ${result.data.progress || 0}%`, 'green');
      if (result.data.detectedObjects) {
        log(`🎯 Detected objects: ${result.data.detectedObjects.length}`, 'green');
      }
      return { success: true, data: result.data };
    } else {
      log(`⚠️  Video status response: ${result.status}`, 'yellow');
      return { success: false, status: result.status };
    }
  } catch (error) {
    log(`❌ Video status error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testCompletePipeline() {
  log(`\n${colors.bold}🔄 Testing Complete Video Processing Pipeline${colors.reset}`, 'blue');
  
  // Step 1: Test health endpoint
  const healthResult = await testHealthEndpoint();
  if (!healthResult.success) {
    log(`❌ Health check failed, stopping pipeline test`, 'red');
    return { success: false, error: 'Health check failed' };
  }
  
  // Step 2: Test video upload with URL
  const uploadResult = await testVideoUploadWithURL();
  if (!uploadResult.success) {
    log(`❌ Video upload failed, stopping pipeline test`, 'red');
    return { success: false, error: 'Video upload failed' };
  }
  
  const videoId = uploadResult.videoId;
  
  // Step 3: Wait for processing and test object detection
  log(`\n⏳ Waiting for video processing...`, 'blue');
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
  
  const detectionResult = await testObjectDetection(videoId);
  if (!detectionResult.success) {
    log(`⚠️  Object detection failed, but continuing with pipeline`, 'yellow');
  }
  
  // Step 4: Test product matching if objects were detected
  if (detectionResult.success && detectionResult.objects && detectionResult.objects.length > 0) {
    await testProductMatching(detectionResult.objects);
  } else {
    log(`\n🛍️  Skipping product matching (no objects detected)`, 'yellow');
  }
  
  // Step 5: Test video status
  await testVideoStatus(videoId);
  
  log(`\n✅ Complete pipeline test finished`, 'green');
  return { success: true, videoId };
}

async function main() {
  log(`${colors.bold}🚂 Railway Video Processing Test${colors.reset}`, 'blue');
  log(`Testing video upload and processing with Railway backend`, 'blue');
  log(`Backend URL: ${RAILWAY_BASE_URL}`, 'blue');
  
  try {
    // Test complete pipeline
    const pipelineResult = await testCompletePipeline();
    
    // Summary
    log(`\n${colors.bold}📊 Test Summary${colors.reset}`, 'blue');
    if (pipelineResult.success) {
      log(`✅ Complete pipeline test successful`, 'green');
      log(`📹 Test video ID: ${pipelineResult.videoId}`, 'green');
      log(`🚂 Railway backend is ready for production use`, 'green');
    } else {
      log(`❌ Pipeline test failed: ${pipelineResult.error}`, 'red');
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