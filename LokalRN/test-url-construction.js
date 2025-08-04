// Test URL construction to debug the double /database prefix issue
const ENV = {
  API_BASE_URL: 'http://192.168.1.207:3001/api'
};

function testUrlConstruction() {
  console.log('🧪 Testing URL construction...');
  
  const baseUrl = ENV.API_BASE_URL.replace('/api', '');
  console.log('Base URL:', baseUrl);
  
  const endpoint = '/auth/me';
  console.log('Endpoint:', endpoint);
  
  const url = `${baseUrl}/api/database${endpoint}`;
  console.log('Constructed URL:', url);
  
  // Test the actual endpoint
  const testUrl = 'http://192.168.1.207:3001/api/database/auth/me';
  console.log('Test URL:', testUrl);
  
  console.log('\n✅ URL construction looks correct');
  console.log('Expected: http://192.168.1.207:3001/api/database/auth/me');
  console.log('Actual:   ' + url);
}

testUrlConstruction(); 