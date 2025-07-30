#!/usr/bin/env node

/**
 * Test script for video processing with backend
 * Tests the actual video upload and object detection pipeline
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testVideoProcessing() {
  console.log('🧪 Testing Video Processing Pipeline\n');

  const demoVideosDir = path.join(__dirname, '../assets/demo-videos');
  const videoFiles = fs.readdirSync(demoVideosDir)
    .filter(file => file.endsWith('.mp4') && !file.startsWith('._'));

  console.log(`📹 Found ${videoFiles.length} demo videos to test\n`);

  for (const videoFile of videoFiles) {
    console.log(`🎬 Testing: ${videoFile}`);
    
    try {
      // Test 1: Upload video
      console.log('   📤 Uploading video...');
      const videoPath = path.join(demoVideosDir, videoFile);
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoPath));
      formData.append('title', `Test: ${videoFile.replace('.mp4', '')}`);
      formData.append('description', `Testing video processing for ${videoFile}`);

      const uploadResponse = await axios.post(`${API_BASE_URL}/videos/upload-file`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5 minutes
      });

      if (uploadResponse.data.success) {
        console.log('   ✅ Upload successful');
        console.log(`   🆔 Video ID: ${uploadResponse.data.videoId}`);
        
        // Test 2: Wait for processing
        console.log('   ⏳ Waiting for object detection...');
        const videoId = uploadResponse.data.videoId;
        
        // Poll for processing completion
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes with 10-second intervals
        
        while (!processingComplete && attempts < maxAttempts) {
          try {
            const statusResponse = await axios.get(`${API_BASE_URL}/videos/${videoId}/status`);
            
            if (statusResponse.data.status === 'completed') {
              console.log('   ✅ Processing completed');
              console.log(`   🎯 Detected objects: ${statusResponse.data.detectedObjects.join(', ')}`);
              processingComplete = true;
            } else if (statusResponse.data.status === 'failed') {
              console.log('   ❌ Processing failed');
              console.log(`   💥 Error: ${statusResponse.data.error}`);
              break;
            } else {
              console.log(`   ⏳ Status: ${statusResponse.data.status} (${statusResponse.data.progress || 0}%)`);
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            }
          } catch (error) {
            console.log(`   ⚠️ Status check failed: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          attempts++;
        }
        
        if (!processingComplete) {
          console.log('   ⏰ Processing timeout');
        }
        
      } else {
        console.log('   ❌ Upload failed');
        console.log(`   💥 Error: ${uploadResponse.data.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    
    console.log(''); // Empty line between tests
  }

  console.log('✅ Video processing tests completed!');
}

// Check if backend is running
async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    if (response.data.status === 'ok') {
      console.log('✅ Backend is running and healthy');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not available');
    console.log('   Please start the backend server first:');
    console.log('   cd backend && npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const backendHealthy = await checkBackendHealth();
  if (backendHealthy) {
    await testVideoProcessing();
  }
}

main().catch(console.error); 