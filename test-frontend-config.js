// Test frontend configuration
const { ENV, isDemoMode, isRailwayMode } = require('./src/config/env.ts');

console.log('🔧 Frontend Configuration Test:');
console.log('==============================');
console.log(`DATABASE_URL: ${ENV.DATABASE_URL}`);
console.log(`API_BASE_URL: ${ENV.API_BASE_URL}`);
console.log(`isDemoMode(): ${isDemoMode()}`);
console.log(`isRailwayMode(): ${isRailwayMode()}`);

// Test the actual API call
async function testApiCall() {
  try {
    console.log('\n🌐 Testing API call to Railway backend...');
    
    const response = await fetch(`${ENV.API_BASE_URL}/database/auth/email-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed:', errorText);
    }
  } catch (error) {
    console.log('❌ API call error:', error.message);
  }
}

testApiCall(); 