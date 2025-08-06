#!/usr/bin/env node

/**
 * Test Video Upload Script
 * Tests video upload with proper MIME types
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

async function testVideoUpload() {
  log.header('Testing Video Upload with Proper MIME Types');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Try uploading with video MIME type
    log.header('Test 1: Video Upload Test');
    try {
      // Create a minimal video file content (this is just for testing)
      const testVideoContent = Buffer.from('fake video content for testing');
      const testFileName = `test-video-${Date.now()}.mp4`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(testFileName, testVideoContent, {
          contentType: 'video/mp4'
        });
      
      if (error) {
        log.error(`Video upload failed: ${error.message}`);
        log.debug(`Error code: ${error.code}`);
      } else {
        log.success('Video upload successful!');
        log.debug(`Uploaded file: ${data.path}`);
        
        // Clean up test file
        try {
          await supabase.storage
            .from('videos')
            .remove([testFileName]);
          log.info('Test video file cleaned up');
        } catch (cleanupError) {
          log.warning(`Could not clean up test video file: ${cleanupError.message}`);
        }
      }
    } catch (error) {
      log.error(`Exception during video upload test: ${error.message}`);
    }
    
    // Test 2: Try uploading image to thumbnails bucket
    log.header('Test 2: Thumbnail Upload Test');
    try {
      const testImageContent = Buffer.from('fake image content for testing');
      const testFileName = `test-thumbnail-${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(testFileName, testImageContent, {
          contentType: 'image/jpeg'
        });
      
      if (error) {
        log.error(`Thumbnail upload failed: ${error.message}`);
        log.debug(`Error code: ${error.code}`);
      } else {
        log.success('Thumbnail upload successful!');
        log.debug(`Uploaded file: ${data.path}`);
        
        // Clean up test file
        try {
          await supabase.storage
            .from('thumbnails')
            .remove([testFileName]);
          log.info('Test thumbnail file cleaned up');
        } catch (cleanupError) {
          log.warning(`Could not clean up test thumbnail file: ${cleanupError.message}`);
        }
      }
    } catch (error) {
      log.error(`Exception during thumbnail upload test: ${error.message}`);
    }
    
    // Test 3: Check if we can get public URLs
    log.header('Test 3: Public URL Test');
    try {
      const { data: { publicUrl }, error } = supabase.storage
        .from('videos')
        .getPublicUrl('test-file.mp4');
      
      if (error) {
        log.error(`Public URL generation failed: ${error.message}`);
      } else {
        log.success('Public URL generation successful!');
        log.debug(`Public URL: ${publicUrl}`);
      }
    } catch (error) {
      log.error(`Exception during public URL test: ${error.message}`);
    }
    
  } catch (error) {
    log.error(`Failed to test video upload: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Video Upload Test${colors.reset}\n`);
  
  await testVideoUpload();
  
  log.header('Summary');
  log.info('If video uploads work, your storage is functional!');
  log.info('If they fail, we may need to adjust bucket permissions.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testVideoUpload }; 