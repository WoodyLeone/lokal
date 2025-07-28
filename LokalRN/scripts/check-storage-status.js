#!/usr/bin/env node

/**
 * Check Storage Status Script
 * This script checks the current status of storage buckets and policies
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  debug: (msg) => console.log(`${colors.magenta}🔍 ${msg}${colors.reset}`),
};

// Get Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function checkStorageStatus() {
  log.header('Checking Storage Status');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: List buckets
    log.header('Test 1: Storage Buckets');
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        log.error(`Cannot list buckets: ${error.message}`);
      } else {
        log.success(`Found ${buckets.length} bucket(s)`);
        buckets.forEach(bucket => {
          log.info(`- ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
        });
      }
    } catch (error) {
      log.error(`Exception listing buckets: ${error.message}`);
    }
    
    // Test 2: Try to upload a test file
    log.header('Test 2: Upload Test');
    try {
      const testContent = 'test file content';
      const testFileName = `test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        });
      
      if (error) {
        log.error(`Upload failed: ${error.message}`);
        log.debug(`Error code: ${error.code}`);
      } else {
        log.success('Upload successful!');
        log.debug(`Uploaded file: ${data.path}`);
        
        // Clean up test file
        try {
          await supabase.storage
            .from('videos')
            .remove([testFileName]);
          log.info('Test file cleaned up');
        } catch (cleanupError) {
          log.warning(`Could not clean up test file: ${cleanupError.message}`);
        }
      }
    } catch (error) {
      log.error(`Exception during upload test: ${error.message}`);
    }
    
    // Test 3: Try to download a file
    log.header('Test 3: Download Test');
    try {
      const { data, error } = await supabase.storage
        .from('videos')
        .download('test-file.txt');
      
      if (error) {
        log.warning(`Download test failed: ${error.message}`);
      } else {
        log.success('Download successful!');
      }
    } catch (error) {
      log.warning(`Exception during download test: ${error.message}`);
    }
    
    // Test 4: Check bucket access
    log.header('Test 4: Bucket Access');
    const buckets = ['videos', 'thumbnails'];
    
    for (const bucketId of buckets) {
      try {
        const { data: files, error } = await supabase.storage
          .from(bucketId)
          .list('', { limit: 1 });
        
        if (error) {
          log.error(`Cannot access '${bucketId}': ${error.message}`);
        } else {
          log.success(`Successfully accessed '${bucketId}'`);
          log.debug(`Files in bucket: ${files.length}`);
        }
      } catch (error) {
        log.error(`Exception accessing '${bucketId}': ${error.message}`);
      }
    }
    
  } catch (error) {
    log.error(`Failed to check storage status: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Storage Status Check${colors.reset}\n`);
  
  await checkStorageStatus();
  
  log.header('Analysis');
  log.info('If uploads work, your storage is already configured correctly!');
  log.info('If uploads fail, we need to check the bucket permissions.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkStorageStatus }; 