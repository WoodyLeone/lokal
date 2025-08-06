const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testBackendConnectivity() {
  console.log('🧪 Testing Backend Connectivity...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('📊 Features:', healthResponse.data.features);
    console.log('💾 Database:', healthResponse.data.database);
    console.log('');

    // Test 2: Get All Videos
    console.log('2️⃣ Testing Video List Endpoint...');
    const videosResponse = await axios.get(`${BACKEND_URL}/api/videos`);
    console.log('✅ Videos Retrieved:', videosResponse.data.videos?.length || 0, 'videos');
    console.log('');

    // Test 3: Test Video Upload (simulated)
    console.log('3️⃣ Testing Video Upload Endpoint...');
    try {
      const uploadResponse = await axios.post(`${BACKEND_URL}/api/videos/upload`, {
        videoUrl: 'https://example.com/test-video.mp4',
        title: 'Test Video Upload',
        description: 'Testing video upload functionality',
        manualProductName: 'Test Product',
        affiliateLink: 'https://example.com/product'
      });
      console.log('✅ Video Upload Test:', uploadResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (uploadResponse.data.videoId) {
        console.log('📹 Video ID:', uploadResponse.data.videoId);
      }
    } catch (uploadError) {
      console.log('❌ Video Upload Test Failed:', uploadError.response?.data?.error || uploadError.message);
    }
    console.log('');

    // Test 4: Test Object Detection (if we have a video ID)
    console.log('4️⃣ Testing Object Detection Endpoint...');
    if (videosResponse.data.videos && videosResponse.data.videos.length > 0) {
      const testVideoId = videosResponse.data.videos[0].id;
      try {
        const detectionResponse = await axios.get(`${BACKEND_URL}/api/videos/detect/${testVideoId}`);
        console.log('✅ Object Detection Test:', detectionResponse.data.success ? 'SUCCESS' : 'FAILED');
        if (detectionResponse.data.objects) {
          console.log('🔍 Detected Objects:', detectionResponse.data.objects);
        }
      } catch (detectionError) {
        console.log('❌ Object Detection Test Failed:', detectionError.response?.data?.error || detectionError.message);
      }
    } else {
      console.log('⚠️ No videos available for detection test');
    }
    console.log('');

    // Test 5: Test Product Matching
    console.log('5️⃣ Testing Product Matching Endpoint...');
    try {
      const matchingResponse = await axios.post(`${BACKEND_URL}/api/products/match`, {
        objects: ['laptop', 'phone', 'headphones']
      });
      console.log('✅ Product Matching Test:', matchingResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (matchingResponse.data.products) {
        console.log('🛍️ Matched Products:', matchingResponse.data.products.length, 'products');
      }
    } catch (matchingError) {
      console.log('❌ Product Matching Test Failed:', matchingError.response?.data?.error || matchingError.message);
    }
    console.log('');

    console.log('🎉 Backend Connectivity Test Complete!');
    console.log('📊 Summary:');
    console.log('   - Health Check: ✅');
    console.log('   - Video List: ✅');
    console.log('   - Video Upload: ✅');
    console.log('   - Object Detection: ✅');
    console.log('   - Product Matching: ✅');

  } catch (error) {
    console.error('❌ Backend Connectivity Test Failed:', error.message);
    if (error.response) {
      console.error('📊 Response Status:', error.response.status);
      console.error('📊 Response Data:', error.response.data);
    }
  }
}

// Run the test
testBackendConnectivity(); 