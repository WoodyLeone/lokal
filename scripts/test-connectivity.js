#!/usr/bin/env node

/**
 * Test connectivity between React Native app and backend
 */

// Using built-in fetch (Node.js 18+)

async function testConnectivity() {
  console.log('🌐 Testing backend connectivity...');
  
  const possibleUrls = [
    'http://192.168.1.207:3001',
    'http://localhost:3001',
    'http://10.0.2.2:3001', // Android emulator
    'http://127.0.0.1:3001',
  ];

  for (const baseUrl of possibleUrls) {
    try {
      console.log(`🔍 Testing connection to: ${baseUrl}`);
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend reachable at: ${baseUrl} (${latency}ms)`);
        console.log(`📊 Status: ${data.status}`);
        console.log(`📊 Uptime: ${data.uptime}s`);
        console.log(`📊 Memory: ${Math.round(data.memory.heapUsed / 1024 / 1024)}MB`);
        return { url: baseUrl, latency, data };
      } else {
        console.log(`❌ HTTP ${response.status} from: ${baseUrl}`);
      }
    } catch (error) {
      console.log(`❌ Failed to connect to: ${baseUrl} - ${error.message}`);
    }
  }

  console.log('❌ No backend servers reachable');
  return null;
}

// Test video upload endpoint
async function testVideoUpload(baseUrl) {
  console.log(`\n📹 Testing video upload endpoint: ${baseUrl}/api/videos/upload-file`);
  
  try {
    const response = await fetch(`${baseUrl}/api/videos/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Video',
        description: 'Connectivity test'
      }),
      timeout: 10000,
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Video upload endpoint working: ${data.message}`);
      return true;
    } else {
      console.log(`❌ Video upload endpoint failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Video upload endpoint error: ${error.message}`);
    return false;
  }
}

// Test video status endpoint
async function testVideoStatus(baseUrl) {
  console.log(`\n📊 Testing video status endpoint: ${baseUrl}/api/videos/status/test-id`);
  
  try {
    const response = await fetch(`${baseUrl}/api/videos/status/test-id`, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Video status endpoint working: ${data.status}`);
      return true;
    } else {
      console.log(`❌ Video status endpoint failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Video status endpoint error: ${error.message}`);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting connectivity tests...\n');
  
  const connectivity = await testConnectivity();
  if (!connectivity) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure the backend is running: npm run start:backend');
    console.log('2. Check if your device is on the same network as the Mac');
    console.log('3. Try using the Mac\'s IP address in the React Native app');
    console.log('4. Check firewall settings on your Mac');
    return;
  }
  
  console.log(`\n🎯 Backend found at: ${connectivity.url}`);
  
  // Test specific endpoints
  await testVideoUpload(connectivity.url);
  await testVideoStatus(connectivity.url);
  
  console.log('\n✅ Connectivity tests completed!');
  console.log(`💡 Use this URL in your React Native app: ${connectivity.url}`);
}

runTests().catch(console.error); 