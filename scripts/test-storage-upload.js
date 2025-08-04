#!/usr/bin/env node

/**
 * Simple Storage Upload Test
 * Tests if we can upload files to the storage buckets
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

async function testStorageUpload() {
  console.log('Testing Storage Upload Functionality\n');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: List buckets
    log.info('Testing bucket access...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      log.error(`Cannot list buckets: ${listError.message}`);
      return;
    }
    
    log.success(`Found ${buckets.length} bucket(s)`);
    buckets.forEach(bucket => {
      log.info(`- ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 2: Try to upload a test file to thumbnails bucket (supports text)
    log.info('\nTesting file upload to thumbnails bucket...');
    const testContent = 'This is a test file for Lokal app';
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      log.error(`Upload failed: ${uploadError.message}`);
      log.warning('This usually means RLS policies need to be set up');
      return;
    }
    
    log.success(`File uploaded successfully: ${uploadData.path}`);
    
    // Test 3: Try to download the file
    log.info('\nTesting file download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('thumbnails')
      .download(testFileName);
    
    if (downloadError) {
      log.error(`Download failed: ${downloadError.message}`);
    } else {
      log.success('File downloaded successfully');
    }
    
    // Test 4: Clean up test file
    log.info('\nCleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('thumbnails')
      .remove([testFileName]);
    
    if (deleteError) {
      log.warning(`Could not delete test file: ${deleteError.message}`);
    } else {
      log.success('Test file cleaned up');
    }
    
    log.success('\n🎉 Storage is working correctly!');
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
  }
}

testStorageUpload().catch(console.error); 