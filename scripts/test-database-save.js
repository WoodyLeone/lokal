#!/usr/bin/env node

/**
 * Test if videos are being saved to the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSave() {
  console.log('🧪 Testing database save functionality...\n');
  
  try {
    // First, check current video count
    const { data: videos, error: selectError } = await supabase
      .from('videos')
      .select('*');
    
    if (selectError) {
      console.error('❌ Error selecting videos:', selectError);
      return;
    }
    
    console.log(`📊 Current videos in database: ${videos.length}`);
    
    // Upload a test video
    console.log('\n📤 Uploading test video...');
    const uploadResponse = await fetch('http://192.168.1.207:3001/api/videos/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Database Test Video',
        description: 'Testing if videos are saved to database',
        userEmail: 'woodypabai@icloud.com'
      }),
      signal: AbortSignal.timeout(15000),
    });
    
    if (!uploadResponse.ok) {
      console.error('❌ Upload failed:', uploadResponse.status);
      return;
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadData.videoId);
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if video was saved to database
    console.log('\n🔍 Checking if video was saved to database...');
    const { data: newVideos, error: newSelectError } = await supabase
      .from('videos')
      .select('*');
    
    if (newSelectError) {
      console.error('❌ Error selecting videos after upload:', newSelectError);
      return;
    }
    
    console.log(`📊 Videos in database after upload: ${newVideos.length}`);
    
    if (newVideos.length > videos.length) {
      console.log('✅ SUCCESS: Video was saved to database!');
      console.log('📝 New video details:', newVideos[newVideos.length - 1]);
    } else {
      console.log('❌ FAILED: Video was not saved to database');
      console.log('🔍 This means the RLS issue is still present');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testDatabaseSave().catch(console.error); 