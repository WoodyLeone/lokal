const { checkNetworkStatus } = require('./src/services/api.ts');

async function testConnection() {
  console.log('🔍 Testing frontend-backend connection...');
  
  try {
    const status = await checkNetworkStatus();
    console.log('📊 Connection status:', status);
    
    if (status.connected) {
      console.log('✅ Backend connection successful!');
      console.log(`🌐 URL: ${status.url}`);
      console.log(`⏱️ Latency: ${status.latency}ms`);
    } else {
      console.log('❌ Backend connection failed');
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
  }
}

testConnection(); 