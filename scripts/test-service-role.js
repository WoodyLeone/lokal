#!/usr/bin/env node

/**
 * Test if service role key can insert into videos table
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Use the service role key directly
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = 'sb_secret_5tztihAKL0L_5Aj7rWkdnQ_YVlkpDN3';

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testServiceRole() {
  console.log('🧪 Testing service role key access...\n');
  
  try {
    // Test 1: Check if we can read from videos table
    console.log('1️⃣ Testing read access...');
    const { data: videos, error: readError } = await supabase
      .from('videos')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('❌ Read error:', readError);
      return;
    }
    
    console.log(`✅ Read successful. Found ${videos.length} videos`);
    
    // Test 2: Try to insert a test video
    console.log('\n2️⃣ Testing insert access...');
    const testVideoId = uuidv4();
    const insertData = {
      id: testVideoId,
      title: 'Service Role Test Video',
      description: 'Testing service role key access',
      video_url: 'demo://test-video',
      // Try without user_id to see if it's optional
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Inserting data:', JSON.stringify(insertData, null, 2));
    
    const { data: insertedVideo, error: insertError } = await supabase
      .from('videos')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
      return;
    }
    
    console.log('✅ Insert successful!');
    console.log('✅ Inserted video:', JSON.stringify(insertedVideo, null, 2));
    
    // Test 3: Clean up - delete the test video
    console.log('\n3️⃣ Cleaning up test video...');
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', testVideoId);
    
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
    } else {
      console.log('✅ Test video deleted successfully');
    }
    
    console.log('\n🎉 Service role key test completed successfully!');
    console.log('✅ The backend should now be able to save videos to the database');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testServiceRole().catch(console.error); 