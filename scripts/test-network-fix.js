#!/usr/bin/env node

/**
 * Test the network error handling fix
 */

async function testNetworkFix() {
  console.log('🧪 Testing network error handling fix...\n');
  
  // Test 1: Basic connectivity
  console.log('1️⃣ Testing basic connectivity...');
  try {
    const response = await fetch('http://192.168.1.207:3001/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Basic connectivity: OK');
      console.log(`📊 Backend status: ${data.status}`);
    } else {
      console.log(`❌ Basic connectivity failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Basic connectivity error:', error.message);
  }
  
  // Test 2: Video upload
  console.log('\n2️⃣ Testing video upload...');
  try {
    const response = await fetch('http://192.168.1.207:3001/api/videos/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Network Test Video',
        description: 'Testing network error handling'
      }),
      signal: AbortSignal.timeout(15000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video upload: OK');
      console.log(`📊 Video ID: ${data.videoId}`);
      
      // Test 3: Video status with the uploaded video
      console.log('\n3️⃣ Testing video status...');
      await testVideoStatus(data.videoId);
      
    } else {
      console.log(`❌ Video upload failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Video upload error:', error.message);
  }
  
  // Test 4: Invalid video status (should handle gracefully)
  console.log('\n4️⃣ Testing invalid video status...');
  await testVideoStatus('invalid-video-id');
  
  console.log('\n🏁 Network fix test completed!');
}

async function testVideoStatus(videoId) {
  try {
    console.log(`📊 Testing status for video: ${videoId}`);
    
    const response = await fetch(`http://192.168.1.207:3001/api/videos/status/${videoId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video status: OK');
      console.log(`📊 Status: ${data.status}`);
      console.log(`📊 Progress: ${data.progress || 'N/A'}`);
      return data;
    } else {
      console.log(`❌ Video status failed: HTTP ${response.status}`);
      const errorText = await response.text();
      console.log(`📄 Error response: ${errorText}`);
      return null;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('⏰ Video status timeout');
    } else {
      console.log('❌ Video status error:', error.message);
    }
    return null;
  }
}

// Test 5: Simulate network polling
async function testNetworkPolling() {
  console.log('\n5️⃣ Testing network polling simulation...');
  
  const videoId = 'test-polling-video';
  const maxAttempts = 5;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`\n📊 Polling attempt ${attempt}/${maxAttempts}...`);
    
    try {
      const status = await testVideoStatus(videoId);
      if (status) {
        console.log(`✅ Poll successful: ${status.status}`);
        if (status.status === 'completed' || status.status === 'error') {
          console.log('🏁 Polling completed');
          break;
        }
      } else {
        console.log('⚠️ Poll returned null, continuing...');
      }
    } catch (error) {
      console.log(`❌ Poll error: ${error.message}`);
    }
    
    // Wait between polls
    if (attempt < maxAttempts) {
      console.log('⏳ Waiting 2 seconds before next poll...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Run all tests
async function runAllTests() {
  await testNetworkFix();
  await testNetworkPolling();
}

runAllTests().catch(console.error); 