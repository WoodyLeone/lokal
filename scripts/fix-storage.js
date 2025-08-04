#!/usr/bin/env node

/**
 * Fix Storage Issues Script
 * This script helps fix Supabase Storage bucket issues
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function fixStorage() {
  log.header('Fixing Supabase Storage Issues');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    log.info('Please check your .env file');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Check current status
    log.header('Step 1: Checking Current Status');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      log.error(`Cannot list buckets: ${listError.message}`);
    } else {
      log.info(`Found ${buckets.length} bucket(s)`);
      buckets.forEach(bucket => {
        log.info(`- ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
    // Step 2: Provide manual setup instructions
    log.header('Step 2: Manual Setup Required');
    log.warning('Storage buckets need to be created manually in Supabase Dashboard');
    log.info('Please follow these steps:');
    log.info('');
    log.info('1. Go to: https://supabase.com/dashboard');
    log.info('2. Select your project');
    log.info('3. Click "Storage" in the left sidebar');
    log.info('4. Click "Create a new bucket"');
    log.info('');
    log.info('Create these two buckets:');
    log.info('');
    log.info('📦 Videos Bucket:');
    log.info('   - Name: videos');
    log.info('   - Public: ✅ Yes');
    log.info('   - File size limit: 500 MB');
    log.info('   - Allowed types: video/mp4,video/mov,video/avi,video/mkv,video/webm');
    log.info('');
    log.info('🖼️  Thumbnails Bucket:');
    log.info('   - Name: thumbnails');
    log.info('   - Public: ✅ Yes');
    log.info('   - File size limit: 10 MB');
    log.info('   - Allowed types: image/jpeg,image/png,image/webp,image/gif');
    log.info('');
    
    // Step 3: Provide SQL scripts
    log.header('Step 3: SQL Scripts to Run');
    log.info('After creating the buckets, run these SQL scripts in Supabase SQL Editor:');
    log.info('');
    
    const createBucketsSQL = fs.readFileSync(path.join(__dirname, 'create-storage-buckets.sql'), 'utf8');
    const storagePoliciesSQL = fs.readFileSync(path.join(__dirname, 'storage-policies.sql'), 'utf8');
    
    log.info('📄 Script 1: Create Storage Buckets');
    log.debug(createBucketsSQL);
    log.info('');
    log.info('📄 Script 2: Storage Policies');
    log.debug(storagePoliciesSQL);
    log.info('');
    
    // Step 4: Test after setup
    log.header('Step 4: Verification');
    log.info('After completing the manual setup, run:');
    log.info('node scripts/diagnose-storage.js');
    log.info('');
    log.info('Expected results:');
    log.info('✅ Found 2 bucket(s)');
    log.info('✅ Successfully accessed videos');
    log.info('✅ Successfully accessed thumbnails');
    log.info('✅ Upload test successful');
    
  } catch (error) {
    log.error(`Failed to fix storage: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Storage Fix${colors.reset}\n`);
  
  await fixStorage();
  
  log.header('Next Steps');
  log.info('1. Follow the manual setup instructions above');
  log.info('2. Run the SQL scripts in Supabase SQL Editor');
  log.info('3. Test with: node scripts/diagnose-storage.js');
  log.info('4. If successful, your app will be able to upload videos!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixStorage }; 