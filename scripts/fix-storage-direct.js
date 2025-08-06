#!/usr/bin/env node

/**
 * Direct Storage Fix Script
 * Uses service role key to directly execute SQL statements
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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixStorageDirect() {
  log.header('Direct Storage Fix with Service Role Key');
  
  if (!supabaseUrl || !serviceRoleKey) {
    log.error('Service role key not configured');
    log.info('Current service role key:', serviceRoleKey ? 'Present' : 'Missing');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);
  
  try {
    // Create client with service role key for admin privileges
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    log.info('Testing service role key access...');
    
    // Test 1: Try to access storage buckets
    log.header('Test 1: Accessing Storage Buckets');
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
    
    // Test 2: Try to access storage.objects table directly
    log.header('Test 2: Accessing Storage Objects Table');
    try {
      const { data, error } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);
      
      if (error) {
        log.error(`Cannot access storage.objects: ${error.message}`);
      } else {
        log.success('Successfully accessed storage.objects table');
        log.debug(`Found ${data.length} objects`);
      }
    } catch (error) {
      log.error(`Exception accessing storage.objects: ${error.message}`);
    }
    
    // Test 3: Try to create a simple policy using RPC
    log.header('Test 3: Creating Storage Policies');
    
    // Try to create a simple function to execute SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    try {
      // Try to execute SQL through a different approach
      log.info('Attempting to create storage policies...');
      
      // Try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
        })
      });
      
      if (response.ok) {
        log.success('Successfully enabled RLS');
      } else {
        log.warning(`REST API call failed: ${response.status}`);
        const errorText = await response.text();
        log.debug(`Error details: ${errorText}`);
      }
      
    } catch (error) {
      log.warning(`Direct SQL execution failed: ${error.message}`);
    }
    
    // Test 4: Check if policies exist
    log.header('Test 4: Checking Existing Policies');
    try {
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'storage')
        .eq('tablename', 'objects');
      
      if (error) {
        log.error(`Cannot check policies: ${error.message}`);
      } else {
        log.success(`Found ${policies.length} existing policies`);
        policies.forEach(policy => {
          log.info(`- ${policy.policyname} (${policy.cmd})`);
        });
      }
    } catch (error) {
      log.error(`Exception checking policies: ${error.message}`);
    }
    
  } catch (error) {
    log.error(`Failed to fix storage: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Direct Storage Fix${colors.reset}\n`);
  
  await fixStorageDirect();
  
  log.header('Manual SQL Execution Required');
  log.warning('The service role key cannot execute DDL statements through the client.');
  log.info('You must run the SQL manually in your Supabase SQL Editor.');
  log.info('');
  log.info('Go to: https://supabase.com/dashboard');
  log.info('Select your project and go to SQL Editor');
  log.info('Run the SQL from: scripts/fix-storage-simple.sql');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixStorageDirect }; 