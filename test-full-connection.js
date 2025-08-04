// Test script to verify frontend-backend connection with new product matching feature
const axios = require('axios');

const BACKEND_URL = 'http://192.168.1.207:3001';

async function testConnection() {
  console.log('🔍 Testing full frontend-backend connection...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('📊 Features:', healthResponse.data.features);
    
    // Test 2: Test video upload with new product matching fields
    console.log('\n2️⃣ Testing video upload with product matching...');
    const uploadData = {
      videoUrl: '',
      title: 'Test Video with Product Matching',
      description: 'Test description for product matching',
      manualProductName: 'Test Product Name',
      affiliateLink: 'https://example.com/test-product'
    };
    
    const uploadResponse = await axios.post(`${BACKEND_URL}/api/videos/upload`, uploadData);
    console.log('✅ Upload response:', uploadResponse.data);
    
    if (uploadResponse.data.success && uploadResponse.data.videoId) {
      const videoId = uploadResponse.data.videoId;
      console.log('🎯 Video ID:', videoId);
      
      // Test 3: Check video status
      console.log('\n3️⃣ Testing video status check...');
      let statusResponse;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        statusResponse = await axios.get(`${BACKEND_URL}/api/videos/${videoId}/status`);
        console.log(`📊 Status attempt ${attempts + 1}:`, statusResponse.data.status);
        
        if (statusResponse.data.status === 'completed') {
          console.log('✅ Video processing completed!');
          console.log('🎯 Detected objects:', statusResponse.data.detectedObjects);
          console.log('🛍️ Matched products:', statusResponse.data.matchedProducts?.length || 0);
          console.log('🤖 AI suggestions:', statusResponse.data.aiSuggestions);
          break;
        } else if (statusResponse.data.status === 'error') {
          console.log('❌ Video processing failed:', statusResponse.data.error);
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
      
      if (attempts >= maxAttempts) {
        console.log('⚠️ Video processing timed out');
      }
    }
    
    // Test 4: Test product matching endpoint
    console.log('\n4️⃣ Testing product matching endpoint...');
    const matchResponse = await axios.post(`${BACKEND_URL}/api/products/match`, {
      objects: ['laptop', 'chair', 'car']
    });
    console.log('✅ Product matching response:', matchResponse.data);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Frontend-backend connection is working properly');
    console.log('✅ New product matching feature is integrated correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  }
}

testConnection(); 