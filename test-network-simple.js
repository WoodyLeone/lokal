const https = require('https');
const http = require('http');

// Test URLs
const RAILWAY_URLS = [
  'https://lokal-prod-production.up.railway.app',
  'https://lokal-backend-production.up.railway.app',
  'https://lokal-backend.up.railway.app',
];

const LOCAL_URLS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(`${url}/api/health`, (res) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            url,
            status: res.statusCode,
            latency,
            connected: res.statusCode === 200,
            data: jsonData
          });
        } catch (e) {
          resolve({
            url,
            status: res.statusCode,
            latency,
            connected: res.statusCode === 200,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        latency: 0,
        connected: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        latency: 0,
        connected: false,
        error: 'Timeout'
      });
    });
  });
}

async function testAllConnections() {
  console.log('🔍 Testing network connectivity...\n');
  
  // Test Railway URLs
  console.log('🌐 Testing Railway Backend URLs:');
  for (const url of RAILWAY_URLS) {
    const result = await testUrl(url);
    if (result.connected) {
      console.log(`✅ ${url} - ${result.status} (${result.latency}ms)`);
      if (result.data && result.data.status) {
        console.log(`   Status: ${result.data.status}`);
      }
    } else {
      console.log(`❌ ${url} - ${result.error || result.status}`);
    }
  }
  
  console.log('\n🏠 Testing Local Backend URLs:');
  for (const url of LOCAL_URLS) {
    const result = await testUrl(url);
    if (result.connected) {
      console.log(`✅ ${url} - ${result.status} (${result.latency}ms)`);
    } else {
      console.log(`❌ ${url} - ${result.error || 'Connection failed'}`);
    }
  }
  
  console.log('\n📊 Summary:');
  const allUrls = [...RAILWAY_URLS, ...LOCAL_URLS];
  const results = await Promise.all(allUrls.map(url => testUrl(url)));
  const workingUrls = results.filter(r => r.connected);
  
  if (workingUrls.length > 0) {
    console.log(`✅ Network connectivity: WORKING`);
    console.log(`🌐 Available backends: ${workingUrls.length}/${allUrls.length}`);
    workingUrls.forEach(r => console.log(`   - ${r.url} (${r.latency}ms)`));
  } else {
    console.log(`❌ Network connectivity: FAILED`);
    console.log(`🌐 No backends available: ${workingUrls.length}/${allUrls.length}`);
  }
}

testAllConnections().catch(console.error); 