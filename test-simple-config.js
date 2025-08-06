// Simple configuration test
console.log('🔧 Testing Frontend Configuration:');
console.log('==================================');

// Check environment variables
const EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const EXPO_PUBLIC_DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL;

console.log(`EXPO_PUBLIC_API_BASE_URL: ${EXPO_PUBLIC_API_BASE_URL || 'Not set'}`);
console.log(`EXPO_PUBLIC_DATABASE_URL: ${EXPO_PUBLIC_DATABASE_URL || 'Not set'}`);

// Default values from env.ts
const DEFAULT_API_BASE_URL = 'https://lokal-dev-production.up.railway.app/api';
const DEFAULT_DATABASE_URL = ''; // Not required for frontend

const API_BASE_URL = EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
const DATABASE_URL = EXPO_PUBLIC_DATABASE_URL || DEFAULT_DATABASE_URL;

console.log(`\nFinal Configuration:`);
console.log(`API_BASE_URL: ${API_BASE_URL}`);
console.log(`DATABASE_URL: ${DATABASE_URL}`);

// Check if using Railway
const isRailwayMode = () => {
  return API_BASE_URL.includes('railway.app');
};

const isDemoMode = () => {
  return !isRailwayMode();
};

console.log(`\nMode Detection:`);
console.log(`isRailwayMode(): ${isRailwayMode()}`);
console.log(`isDemoMode(): ${isDemoMode()}`);

// Test the API call
async function testApiCall() {
  try {
    console.log('\n🌐 Testing API call to Railway backend...');
    console.log(`URL: ${API_BASE_URL}/database/auth/email-verification`);
    
    const response = await fetch(`${API_BASE_URL}/database/auth/email-verification`, {
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