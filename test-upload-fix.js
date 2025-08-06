#!/usr/bin/env node

/**
 * Test script to verify video upload database fix
 */

const https = require('https');
const fs = require('fs');

console.log('🧪 Testing Video Upload Database Fix\n');

// Test the upload endpoint with a simple POST request
function testUploadEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      title: 'Test Video Upload',
      description: 'Testing database connection fix',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/videos/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, response });
        } catch (error) {
          resolve({ status: res.statusCode, response: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test using HTTP instead of HTTPS for localhost
function testUploadEndpointHTTP() {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const postData = JSON.stringify({
      title: 'Test Video Upload',
      description: 'Testing database connection fix',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/videos/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, response });
        } catch (error) {
          resolve({ status: res.statusCode, response: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  try {
    console.log('🔍 Testing video upload endpoint...');
    
    const result = await testUploadEndpointHTTP();
    
    console.log(`📊 Response Status: ${result.status}`);
    console.log('📋 Response Data:', JSON.stringify(result.response, null, 2));
    
    if (result.status === 200 && result.response.success) {
      console.log('\n✅ SUCCESS: Video upload database fix is working!');
      console.log('🎯 The database connection issue has been resolved.');
    } else if (result.status === 500) {
      console.log('\n❌ FAILURE: Database connection still failing');
      console.log('🔧 Check backend logs for more details');
    } else {
      console.log('\n⚠️  PARTIAL: Unexpected response');
      console.log('🔍 Review the response for details');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to test upload endpoint:', error.message);
    console.log('🔧 Make sure the backend server is running on port 3001');
  }
}

runTest();