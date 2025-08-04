#!/usr/bin/env node

/**
 * Script to refresh Supabase schema cache
 * This helps resolve PGRST204 errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchemaCache() {
  console.log('🔄 Attempting to refresh Supabase schema cache...');
  
  try {
    // Method 1: Try to get table information
    console.log('📋 Method 1: Getting table information...');
    const { data: tables, error: tablesError } = await supabase
      .from('videos')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.log('⚠️ Tables query failed:', tablesError.message);
    } else {
      console.log('✅ Tables query successful');
    }

    // Method 2: Try to describe the table structure
    console.log('📋 Method 2: Checking table structure...');
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'videos' });
    
    if (structureError) {
      console.log('⚠️ Structure query failed:', structureError.message);
    } else {
      console.log('✅ Structure query successful');
      console.log('📊 Available columns:', structure);
    }

    // Method 3: Try a simple update to trigger cache refresh
    console.log('📋 Method 3: Testing update operation...');
    const testVideoId = '00000000-0000-0000-0000-000000000000';
    
    const { data: updateData, error: updateError } = await supabase
      .from('videos')
      .update({ 
        updated_at: new Date().toISOString(),
        title: 'Schema Cache Test'
      })
      .eq('id', testVideoId)
      .select();
    
    if (updateError) {
      console.log('⚠️ Update test failed:', updateError.message);
    } else {
      console.log('✅ Update test successful');
    }

    console.log('🎯 Schema cache refresh attempt completed');
    console.log('💡 If the React Native app still shows PGRST204 errors,');
    console.log('   try restarting the Supabase client in the app.');

  } catch (error) {
    console.error('❌ Error refreshing schema cache:', error);
  }
}

refreshSchemaCache(); 