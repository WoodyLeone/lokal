#!/usr/bin/env node

/**
 * Simple test to upload a video and see the exact error
 */

async function testSimpleUpload() {
  console.log('🧪 Testing simple video upload...\n');
  
  try {
    const response = await fetch('http://192.168.1.207:3001/api/videos/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Simple Test Video',
        description: 'Testing simple upload'
      }),
      signal: AbortSignal.timeout(15000),
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📊 Response body: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ Upload successful!');
    } else {
      console.log('❌ Upload failed');
    }
    
  } catch (error) {
    console.log('❌ Upload error:', error.message);
  }
}

testSimpleUpload().catch(console.error); 