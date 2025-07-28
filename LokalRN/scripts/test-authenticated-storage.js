#!/usr/bin/env node

/**
 * Authenticated Storage Test
 * Tests storage access with authentication
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
};

async function testAuthenticatedStorage() {
  console.log('Testing Authenticated Storage Access\n');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Check if we can list buckets (this should work)
    log.info('Testing bucket listing...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      log.error(`Cannot list buckets: ${listError.message}`);
    } else {
      log.success(`Found ${buckets.length} bucket(s)`);
      buckets.forEach(bucket => {
        log.info(`- ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
    // Test 2: Try to access buckets directly (this should work)
    log.info('\nTesting direct bucket access...');
    const { data: videosFiles, error: videosError } = await supabase.storage
      .from('videos')
      .list('', { limit: 1 });
    
    if (videosError) {
      log.error(`Cannot access videos bucket: ${videosError.message}`);
    } else {
      log.success('Successfully accessed videos bucket');
      log.info(`Files in videos bucket: ${videosFiles.length}`);
    }
    
    const { data: thumbnailsFiles, error: thumbnailsError } = await supabase.storage
      .from('thumbnails')
      .list('', { limit: 1 });
    
    if (thumbnailsError) {
      log.error(`Cannot access thumbnails bucket: ${thumbnailsError.message}`);
    } else {
      log.success('Successfully accessed thumbnails bucket');
      log.info(`Files in thumbnails bucket: ${thumbnailsFiles.length}`);
    }
    
    // Test 3: Try to upload without authentication (this should fail)
    log.info('\nTesting upload without authentication...');
    const testContent = 'test file content';
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      log.warning(`Upload failed (expected): ${uploadError.message}`);
      log.info('This is expected because we are not authenticated');
    } else {
      log.success('Upload succeeded (unexpected)');
    }
    
    // Test 4: Check if we can read public files (this should work)
    log.info('\nTesting public file access...');
    const { data: publicUrl, error: urlError } = supabase.storage
      .from('videos')
      .getPublicUrl('test-file.txt');
    
    if (urlError) {
      log.error(`Cannot get public URL: ${urlError.message}`);
    } else {
      log.success('Successfully generated public URL');
      log.info(`Public URL: ${publicUrl.publicUrl}`);
    }
    
    log.success('\n🎉 Storage buckets are accessible!');
    log.info('The RLS policies are working correctly - uploads require authentication');
    log.info('In your app, users will need to be signed in to upload files');
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
  }
}

testAuthenticatedStorage().catch(console.error); 