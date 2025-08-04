#!/usr/bin/env node

/**
 * Debug Storage Buckets Script
 * This script lists all storage buckets in the Supabase project
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function debugStorageBuckets() {
  console.log('🔍 Debugging Storage Buckets...\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not configured');
    return;
  }
  
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...\n`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📋 Listing all storage buckets...\n');
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log('📦 Current Storage Buckets:');
    console.log('============================');
    
    if (!data || data.length === 0) {
      console.log('❌ No buckets found');
    } else {
      data.forEach((bucket, index) => {
        console.log(`${index + 1}. ${bucket.name} (${bucket.id})`);
        console.log(`   - Public: ${bucket.public ? 'Yes' : 'No'}`);
        console.log(`   - File size limit: ${bucket.file_size_limit || 'No limit'}`);
        console.log(`   - Created: ${bucket.created_at}`);
        console.log('');
      });
    }
    
    console.log('🎯 Required Buckets:');
    console.log('====================');
    console.log('1. videos (public, 500MB limit)');
    console.log('2. thumbnails (public, 10MB limit)');
    
    const requiredBuckets = ['videos', 'thumbnails'];
    const foundBuckets = data ? data.map(b => b.id) : [];
    
    console.log('\n✅ Status:');
    console.log('==========');
    requiredBuckets.forEach(bucketId => {
      if (foundBuckets.includes(bucketId)) {
        console.log(`✅ ${bucketId} - Found`);
      } else {
        console.log(`❌ ${bucketId} - Missing`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
  }
}

if (require.main === module) {
  debugStorageBuckets().catch(console.error);
}

module.exports = { debugStorageBuckets }; 