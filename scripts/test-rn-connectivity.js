#!/usr/bin/env node

/**
 * Test React Native connectivity using the same logic as the app
 */

// Simulate the React Native app's connectivity testing
async function testBackendConnectivity() {
  const possibleUrls = [
    'http://192.168.1.207:3001',
    'http://localhost:3001',
    'http://10.0.2.2:3001', // Android emulator
    'http://127.0.0.1:3001',
  ];

  console.log('🌐 Testing backend connectivity (React Native style)...');

  for (const baseUrl of possibleUrls) {
    try {
      console.log(`🔍 Testing connection to: ${baseUrl}`);
      const startTime = Date.now();
      
      // Use AbortController for timeout (like React Native)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend reachable at: ${baseUrl} (${latency}ms)`);
        console.log(`📊 Status: ${data.status}`);
        console.log(`📊 Uptime: ${data.uptime}s`);
        return { url: baseUrl, latency, data };
      }
    } catch (error) {
      console.log(`❌ Failed to connect to: ${baseUrl} - ${error.message}`);
    }
  }

  console.log('❌ No backend servers reachable');
  return null;
}

// Test the getBackendUrl function logic
async function getBackendUrl() {
  console.log('\n🔧 Testing getBackendUrl logic...');
  
  const connectivity = await testBackendConnectivity();
  if (connectivity) {
    console.log(`✅ Found backend at: ${connectivity.url}`);
    return connectivity.url;
  }

  // Fallback to configured URL
  const fallbackUrl = 'http://192.168.1.207:3001'; // Updated fallback
  console.log(`⚠️ Using fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
}

// Test video upload
async function testVideoUpload(baseUrl) {
  console.log(`\n📹 Testing video upload to: ${baseUrl}/api/videos/upload-file`);
  
  try {
    const response = await fetch(`${baseUrl}/api/videos/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Video',
        description: 'Connectivity test from React Native simulation'
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Video upload successful: ${data.message}`);
      console.log(`📊 Video ID: ${data.videoId}`);
      return data.videoId;
    } else {
      console.log(`❌ Video upload failed: HTTP ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Video upload error: ${error.message}`);
    return null;
  }
}

// Test video status
async function testVideoStatus(baseUrl, videoId) {
  if (!videoId) {
    console.log('❌ No video ID to test status');
    return;
  }
  
  console.log(`\n📊 Testing video status: ${baseUrl}/api/videos/status/${videoId}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/videos/status/${videoId}`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Video status: ${data.status}`);
      console.log(`📊 Progress: ${data.progress || 'N/A'}`);
      return data;
    } else {
      console.log(`❌ Video status failed: HTTP ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Video status error: ${error.message}`);
    return null;
  }
}

// Run the complete test
async function runCompleteTest() {
  console.log('🚀 Running complete React Native connectivity test...\n');
  
  // Step 1: Test connectivity
  const baseUrl = await getBackendUrl();
  
  // Step 2: Test video upload
  const videoId = await testVideoUpload(baseUrl);
  
  // Step 3: Test video status
  if (videoId) {
    await testVideoStatus(baseUrl, videoId);
  }
  
  console.log('\n✅ Complete test finished!');
  console.log(`💡 React Native app should use: ${baseUrl}`);
  
  if (videoId) {
    console.log(`🎬 Test video created with ID: ${videoId}`);
  }
}

runCompleteTest().catch(console.error); 