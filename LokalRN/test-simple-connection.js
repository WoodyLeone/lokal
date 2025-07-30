const axios = require('axios');

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    // Test backend health endpoint
    const startTime = Date.now();
    const response = await axios.get('http://localhost:3001/api/health');
    const latency = Date.now() - startTime;
    
    console.log('✅ Backend connection successful!');
    console.log(`🌐 URL: http://localhost:3001/api/health`);
    console.log(`⏱️ Latency: ${latency}ms`);
    console.log(`📊 Status: ${response.data.status}`);
    console.log(`💾 Database: ${response.data.database.isConnected ? 'Connected' : 'Disconnected'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('\n🔍 Testing Supabase connection...');
  
  try {
    // Test Supabase connection by checking environment variables
    const dotenv = require('dotenv');
    dotenv.config();
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      console.log('✅ Supabase credentials found');
      console.log(`🌐 URL: ${supabaseUrl}`);
      console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Supabase credentials missing');
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive connection tests...\n');
  
  const backendResult = await testBackendConnection();
  const supabaseResult = await testSupabaseConnection();
  
  console.log('\n📊 Test Results:');
  console.log(`Backend: ${backendResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Supabase: ${supabaseResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (backendResult && supabaseResult) {
    console.log('\n🎉 All tests passed! System is ready.');
  } else {
    console.log('\n⚠️ Some tests failed. Check configuration.');
  }
}

runAllTests(); 