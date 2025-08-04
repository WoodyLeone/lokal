const fetch = require('node-fetch');

async function testLocalConnection() {
  console.log('🧪 Testing local backend connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://192.168.1.207:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    
    // Test product matching
    const productResponse = await fetch('http://192.168.1.207:3001/api/products/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objects: ['sneakers', 'shirt', 'person'],
        manualProductName: null
      })
    });
    const productData = await productResponse.json();
    console.log('✅ Product matching:', productData.success ? 'Working' : 'Failed');
    console.log('📦 Matched products:', productData.count);
    
    // Test demo products
    const demoResponse = await fetch('http://192.168.1.207:3001/api/products/demo');
    const demoData = await demoResponse.json();
    console.log('✅ Demo products:', demoData.success ? 'Working' : 'Failed');
    console.log('📦 Demo products count:', demoData.count);
    
    // Test videos endpoint
    const videosResponse = await fetch('http://192.168.1.207:3001/api/videos');
    const videosData = await videosResponse.json();
    console.log('✅ Videos endpoint:', videosData.success ? 'Working' : 'Failed');
    console.log('🎬 Videos count:', videosData.videos?.length || 0);
    
    console.log('\n🎉 All local backend tests passed!');
    console.log('📱 React Native app should now be able to connect.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testLocalConnection(); 