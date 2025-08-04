#!/usr/bin/env node

/**
 * Storage Setup Script for Lokal App
 * This script helps create the required storage buckets in Supabase
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
};

// Get Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function setupStorageBuckets() {
  log.header('Setting up Storage Buckets');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Define required buckets
    const buckets = [
      {
        id: 'videos',
        name: 'Videos',
        public: true,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/mkv']
      },
      {
        id: 'thumbnails',
        name: 'Thumbnails',
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    ];
    
    for (const bucket of buckets) {
      log.info(`Creating bucket: ${bucket.name} (${bucket.id})`);
      
      try {
        // Check if bucket already exists
        const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          log.warning(`Could not list buckets: ${listError.message}`);
        } else {
          const exists = existingBuckets.some(b => b.id === bucket.id);
          if (exists) {
            log.success(`Bucket '${bucket.id}' already exists`);
            continue;
          }
        }
        
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });
        
        if (error) {
          log.error(`Failed to create bucket '${bucket.id}': ${error.message}`);
        } else {
          log.success(`Created bucket '${bucket.id}' successfully`);
        }
        
      } catch (error) {
        log.error(`Error creating bucket '${bucket.id}': ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to setup storage: ${error.message}`);
    return false;
  }
}

async function verifyStorageBuckets() {
  log.header('Verifying Storage Buckets');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      log.error(`Failed to list buckets: ${error.message}`);
      return false;
    }
    
    const requiredBuckets = ['videos', 'thumbnails'];
    const foundBuckets = buckets.map(b => b.id);
    
    for (const bucketId of requiredBuckets) {
      if (foundBuckets.includes(bucketId)) {
        log.success(`Bucket '${bucketId}' exists`);
      } else {
        log.error(`Bucket '${bucketId}' not found`);
      }
    }
    
    return requiredBuckets.every(bucketId => foundBuckets.includes(bucketId));
  } catch (error) {
    log.error(`Failed to verify storage: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Storage Setup${colors.reset}\n`);
  
  const setupSuccess = await setupStorageBuckets();
  
  if (setupSuccess) {
    log.success('Storage setup completed');
    
    // Verify the setup
    const verifySuccess = await verifyStorageBuckets();
    
    if (verifySuccess) {
      log.success('All storage buckets are properly configured');
    } else {
      log.warning('Some storage buckets may need manual setup');
      log.info('Please check your Supabase dashboard > Storage');
    }
  } else {
    log.error('Storage setup failed');
    log.info('You may need to create storage buckets manually in your Supabase dashboard');
  }
  
  log.header('Manual Setup Instructions');
  log.info('If automatic setup fails, follow these steps:');
  log.info('1. Go to your Supabase dashboard');
  log.info('2. Navigate to Storage section');
  log.info('3. Create two buckets:');
  log.info('   - videos (public, 500MB limit)');
  log.info('   - thumbnails (public, 10MB limit)');
  log.info('4. Set appropriate file type restrictions');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupStorageBuckets, verifyStorageBuckets }; 