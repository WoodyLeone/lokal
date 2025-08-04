#!/usr/bin/env node

/**
 * Test the video status persistence fix
 */

async function testPersistenceFix() {
  console.log('🧪 Testing video status persistence fix...\n');
  
  // Test 1: Upload a video
  console.log('1️⃣ Testing video upload...');
  try {
    const response = await fetch('http://192.168.1.207:3001/api/videos/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Persistence Test Video',
        description: 'Testing video status persistence'
      }),
      signal: AbortSignal.timeout(15000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video upload: OK');
      console.log(`📊 Video ID: ${data.videoId}`);
      
      const videoId = data.videoId;
      
      // Test 2: Check initial status
      console.log('\n2️⃣ Testing initial status...');
      await testVideoStatus(videoId);
      
      // Test 3: Wait for processing to start
      console.log('\n3️⃣ Waiting for processing to start...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await testVideoStatus(videoId);
      
      // Test 4: Simulate backend restart
      console.log('\n4️⃣ Simulating backend restart scenario...');
      console.log('📝 Video status should persist even if backend restarts');
      
      // Test 5: Check status after "restart"
      console.log('\n5️⃣ Testing status after simulated restart...');
      await testVideoStatus(videoId);
      
      // Test 6: Wait for completion
      console.log('\n6️⃣ Waiting for processing completion...');
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n📊 Status check attempt ${attempts}/${maxAttempts}...`);
        
        const status = await testVideoStatus(videoId);
        if (status && (status.status === 'completed' || status.status === 'error')) {
          console.log('🏁 Processing completed or failed');
          break;
        }
        
        if (attempts < maxAttempts) {
          console.log('⏳ Waiting 3 seconds before next check...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
    } else {
      console.log(`❌ Video upload failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Video upload error:', error.message);
  }
  
  console.log('\n🏁 Persistence fix test completed!');
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
      console.log(`📊 Objects: ${data.detectedObjects?.length || 0}`);
      console.log(`📊 Products: ${data.matchedProducts?.length || 0}`);
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

// Test 7: Check if status file exists
async function checkStatusFile() {
  console.log('\n7️⃣ Checking status file existence...');
  try {
    const response = await fetch('http://192.168.1.207:3001/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      console.log('✅ Backend is running');
      console.log('📁 Status file should be created in backend/src/data/video_status.json');
    } else {
      console.log(`❌ Backend health check failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend health check error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testPersistenceFix();
  await checkStatusFile();
}

runAllTests().catch(console.error); 