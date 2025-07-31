#!/usr/bin/env node

const axios = require('axios');

// Update this with your Railway URL
const RAILWAY_URL = process.argv[2] || 'https://your-app-name.up.railway.app';

async function quickTest() {
    console.log('🚂 Quick Railway Test');
    console.log('====================');
    console.log(`Testing: ${RAILWAY_URL}\n`);
    
    try {
        const response = await axios.get(`${RAILWAY_URL}/api/health`, {
            timeout: 10000
        });
        
        console.log('✅ Health check passed!');
        console.log('Response:', response.data);
        console.log('\n🎉 Your Railway deployment is working!');
        console.log(`🌐 Production URL: ${RAILWAY_URL}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

if (RAILWAY_URL === 'https://your-app-name.up.railway.app') {
    console.log('Usage: node quick-test-railway.js <your-railway-url>');
    console.log('Example: node quick-test-railway.js https://lokal-backend.up.railway.app');
} else {
    quickTest();
}
