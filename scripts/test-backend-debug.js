const axios = require('axios');

async function testBackendDebug() {
  console.log('🧪 Testing backend debug...');
  
  try {
    // Test upload with detailed logging
    const response = await axios.post('http://192.168.1.207:3001/api/videos/upload-file', {
      title: 'Debug Test Video',
      description: 'Testing backend debug output',
      videoUrl: 'demo://test-video'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', response.data);
    
    if (response.data.success) {
      const videoId = response.data.videoId;
      console.log('🎯 Video ID:', videoId);
      
      // Wait a moment for processing
      console.log('⏳ Waiting for processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check video status
      const statusResponse = await axios.get(`http://192.168.1.207:3001/api/videos/status/${videoId}`);
      console.log('📊 Status response:', statusResponse.data);
      
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
  }
}

testBackendDebug()
  .then(() => {
    console.log('🏁 Debug test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug test failed:', error);
    process.exit(1);
  }); 