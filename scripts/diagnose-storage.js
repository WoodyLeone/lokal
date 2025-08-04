#!/usr/bin/env node

/**
 * Storage Diagnostic Script for Lokal App
 * This script helps diagnose storage bucket access issues
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

async function diagnoseStorage() {
  log.header('Storage Bucket Diagnosis');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: List all buckets
    log.header('Test 1: Listing All Storage Buckets');
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        log.error(`Failed to list buckets: ${error.message}`);
        log.debug(`Error code: ${error.code}`);
        log.debug(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else {
        log.success(`Found ${buckets.length} bucket(s)`);
        
        if (buckets.length === 0) {
          log.warning('No buckets found');
        } else {
          buckets.forEach(bucket => {
            log.info(`- ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
            if (bucket.file_size_limit) {
              log.debug(`  File size limit: ${bucket.file_size_limit} bytes`);
            }
            if (bucket.allowed_mime_types) {
              log.debug(`  Allowed types: ${bucket.allowed_mime_types.join(', ')}`);
            }
          });
        }
      }
    } catch (error) {
      log.error(`Exception listing buckets: ${error.message}`);
    }
    
    // Test 2: Try to access specific buckets
    log.header('Test 2: Testing Specific Bucket Access');
    const requiredBuckets = ['videos', 'thumbnails'];
    
    for (const bucketId of requiredBuckets) {
      log.info(`Testing access to bucket: ${bucketId}`);
      
      try {
        // Try to list files in the bucket
        const { data: files, error } = await supabase.storage
          .from(bucketId)
          .list('', { limit: 1 });
        
        if (error) {
          log.error(`  Cannot access '${bucketId}': ${error.message}`);
          log.debug(`  Error code: ${error.code}`);
        } else {
          log.success(`  Successfully accessed '${bucketId}'`);
          log.debug(`  Files in bucket: ${files.length}`);
        }
      } catch (error) {
        log.error(`  Exception accessing '${bucketId}': ${error.message}`);
      }
    }
    
    // Test 3: Check RLS policies
    log.header('Test 3: Checking RLS Policies');
    try {
      // Try to get bucket info (this might be blocked by RLS)
      const { data, error } = await supabase.storage.getBucket('videos');
      
      if (error) {
        log.warning(`RLS might be blocking bucket access: ${error.message}`);
        log.info('This is normal if buckets are newly created');
      } else {
        log.success('Bucket access allowed by RLS');
        log.debug(`Bucket info: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      log.error(`Exception checking RLS: ${error.message}`);
    }
    
    // Test 4: Try to upload a test file
    log.header('Test 4: Testing File Upload Permission');
    try {
      const testContent = 'test file content';
      const testFileName = `test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        });
      
      if (error) {
        log.error(`Upload test failed: ${error.message}`);
        log.debug(`Error code: ${error.code}`);
      } else {
        log.success('Upload test successful');
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
    
  } catch (error) {
    log.error(`Failed to diagnose storage: ${error.message}`);
  }
}

async function checkBucketNames() {
  log.header('Checking for Common Bucket Name Variations');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      log.error(`Cannot list buckets: ${error.message}`);
      return;
    }
    
    const bucketNames = buckets.map(b => b.id);
    log.info(`Available buckets: ${bucketNames.join(', ')}`);
    
    // Check for common variations
    const variations = [
      'video', 'videos', 'Video', 'Videos',
      'thumbnail', 'thumbnails', 'Thumbnail', 'Thumbnails',
      'media', 'uploads', 'files'
    ];
    
    for (const variation of variations) {
      if (bucketNames.includes(variation)) {
        log.success(`Found bucket: ${variation}`);
      }
    }
    
  } catch (error) {
    log.error(`Error checking bucket names: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Storage Diagnosis${colors.reset}\n`);
  
  await diagnoseStorage();
  await checkBucketNames();
  
  log.header('Recommendations');
  log.info('If buckets are not found, check:');
  log.info('1. Bucket names are exactly "videos" and "thumbnails"');
  log.info('2. Buckets are set to public');
  log.info('3. RLS policies allow access');
  log.info('4. Service role key is used for admin operations');
  
  log.info('\nTo fix RLS issues, run this SQL in Supabase SQL editor:');
  log.info(`
-- Allow public read access to storage
CREATE POLICY "Public read access to videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Allow authenticated users to upload
CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
  `);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnoseStorage, checkBucketNames }; 