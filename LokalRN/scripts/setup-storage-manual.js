#!/usr/bin/env node

/**
 * Manual Storage Setup Helper for Lokal App
 * This script provides instructions and verification for manual storage bucket setup
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
  step: (msg) => console.log(`${colors.magenta}→ ${msg}${colors.reset}`),
};

// Get Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function displayManualInstructions() {
  log.header('Manual Storage Bucket Setup Instructions');
  
  log.info('The automatic bucket creation failed due to Row Level Security (RLS) policies.');
  log.info('Please follow these manual steps to create the required storage buckets:');
  
  console.log('\n');
  
  log.step('1. Open your Supabase Dashboard');
  log.info(`   URL: ${supabaseUrl.replace('/rest/v1', '')}`);
  
  log.step('2. Navigate to Storage Section');
  log.info('   Click on "Storage" in the left sidebar');
  
  log.step('3. Create "videos" Bucket');
  log.info('   • Click "New bucket"');
  log.info('   • Name: videos');
  log.info('   • Public bucket: ✓ (checked)');
  log.info('   • File size limit: 500 MB');
  log.info('   • Allowed MIME types: video/mp4, video/mov, video/avi, video/mkv');
  
  log.step('4. Create "thumbnails" Bucket');
  log.info('   • Click "New bucket"');
  log.info('   • Name: thumbnails');
  log.info('   • Public bucket: ✓ (checked)');
  log.info('   • File size limit: 10 MB');
  log.info('   • Allowed MIME types: image/jpeg, image/png, image/webp');
  
  log.step('5. Set RLS Policies (Optional)');
  log.info('   • Go to Storage > Policies');
  log.info('   • For each bucket, ensure public read access is enabled');
  log.info('   • For authenticated users, enable insert/update/delete');
  
  console.log('\n');
  log.warning('After creating the buckets, run: npm run verify-supabase');
}

async function verifyStorageBuckets() {
  log.header('Verifying Storage Buckets');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      log.error(`Failed to list buckets: ${error.message}`);
      return false;
    }
    
    const requiredBuckets = ['videos', 'thumbnails'];
    const foundBuckets = buckets.map(b => b.id);
    
    let allFound = true;
    
    for (const bucketId of requiredBuckets) {
      if (foundBuckets.includes(bucketId)) {
        log.success(`Bucket '${bucketId}' exists`);
      } else {
        log.error(`Bucket '${bucketId}' not found`);
        allFound = false;
      }
    }
    
    if (allFound) {
      log.success('All required storage buckets are present!');
    } else {
      log.warning('Some buckets are missing. Please follow the manual setup instructions.');
    }
    
    return allFound;
  } catch (error) {
    log.error(`Failed to verify storage: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Manual Storage Setup Helper${colors.reset}\n`);
  
  // Display manual instructions
  await displayManualInstructions();
  
  // Ask if user wants to verify
  console.log('\n');
  log.info('Would you like to verify the storage buckets now? (y/n)');
  
  // For now, just verify
  const verified = await verifyStorageBuckets();
  
  if (verified) {
    log.success('Storage setup is complete! Your app should work properly now.');
  } else {
    log.warning('Please complete the manual setup and run verification again.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { displayManualInstructions, verifyStorageBuckets }; 