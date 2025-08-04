#!/usr/bin/env node

/**
 * Supabase Verification Script for Lokal App
 * This script verifies that the Supabase connection and database setup are working correctly.
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

// Get Supabase configuration from environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function checkEnvironmentVariables() {
  log.header('Checking Environment Variables');
  
  if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    log.error('EXPO_PUBLIC_SUPABASE_URL is not configured');
    return false;
  }
  
  if (!supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
    log.error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured');
    return false;
  }
  
  log.success('Environment variables are configured');
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  return true;
}

async function testSupabaseConnection() {
  log.header('Testing Supabase Connection');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error) {
      log.error('Failed to connect to Supabase');
      log.error(`Error: ${error.message}`);
      return false;
    }
    
    log.success('Successfully connected to Supabase');
    return true;
  } catch (error) {
    log.error('Failed to create Supabase client');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

async function verifyDatabaseTables() {
  log.header('Verifying Database Tables');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if required tables exist
    const tables = ['profiles', 'videos', 'products'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          log.error(`Table '${table}' not found or not accessible`);
          results[table] = false;
        } else {
          log.success(`Table '${table}' exists and is accessible`);
          results[table] = true;
        }
      } catch (error) {
        log.error(`Error checking table '${table}': ${error.message}`);
        results[table] = false;
      }
    }
    
    const allTablesExist = Object.values(results).every(exists => exists);
    
    if (allTablesExist) {
      log.success('All required tables are present');
    } else {
      log.warning('Some tables are missing. Please run the database setup script.');
    }
    
    return allTablesExist;
  } catch (error) {
    log.error('Failed to verify database tables');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

async function verifyStorageBuckets() {
  log.header('Verifying Storage Buckets');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if required storage buckets exist
    const buckets = ['videos', 'thumbnails'];
    const results = {};
    
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage.getBucket(bucket);
        
        if (error) {
          log.error(`Storage bucket '${bucket}' not found`);
          results[bucket] = false;
        } else {
          log.success(`Storage bucket '${bucket}' exists`);
          results[bucket] = true;
        }
      } catch (error) {
        log.error(`Error checking storage bucket '${bucket}': ${error.message}`);
        results[bucket] = false;
      }
    }
    
    const allBucketsExist = Object.values(results).every(exists => exists);
    
    if (allBucketsExist) {
      log.success('All required storage buckets are present');
    } else {
      log.warning('Some storage buckets are missing. Please create them in your Supabase dashboard.');
    }
    
    return allBucketsExist;
  } catch (error) {
    log.error('Failed to verify storage buckets');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

async function testSampleData() {
  log.header('Testing Sample Data');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      log.error('Failed to query products table');
      log.error(`Error: ${productsError.message}`);
      return false;
    }
    
    log.success(`Found ${products.length} products in database`);
    
    if (products.length > 0) {
      log.info('Sample product:');
      log.info(`  Title: ${products[0].title}`);
      log.info(`  Price: ${products[0].price} ${products[0].currency}`);
      log.info(`  Category: ${products[0].category}`);
    }
    
    // Test videos table
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .limit(5);
    
    if (videosError) {
      log.warning('Failed to query videos table (this is normal if no videos exist yet)');
    } else {
      log.success(`Found ${videos.length} videos in database`);
    }
    
    return true;
  } catch (error) {
    log.error('Failed to test sample data');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  log.header('Testing Authentication');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test getting current user (should be null if not authenticated)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error && error.message?.includes('Auth session missing')) {
      log.info('No active session (this is normal)');
      return true;
    }
    
    if (error) {
      log.error('Authentication test failed');
      log.error(`Error: ${error.message}`);
      return false;
    }
    
    if (user) {
      log.success('User is authenticated');
      log.info(`User ID: ${user.id}`);
      log.info(`Email: ${user.email}`);
    } else {
      log.info('No user is currently authenticated');
    }
    
    return true;
  } catch (error) {
    log.error('Failed to test authentication');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

async function generateTestCredentials() {
  log.header('Generating Test Credentials');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testUsername = `testuser-${Date.now()}`;
    
    log.info('Creating test user account...');
    log.info(`Email: ${testEmail}`);
    log.info(`Username: ${testUsername}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
        },
      },
    });
    
    if (error) {
      log.error('Failed to create test user');
      log.error(`Error: ${error.message}`);
      return false;
    }
    
    log.success('Test user created successfully');
    log.info('Test credentials:');
    log.info(`  Email: ${testEmail}`);
    log.info(`  Password: ${testPassword}`);
    log.info(`  Username: ${testUsername}`);
    
    // Clean up - sign out
    await supabase.auth.signOut();
    log.info('Signed out from test account');
    
    return true;
  } catch (error) {
    log.error('Failed to generate test credentials');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  log.header('Lokal App - Supabase Verification');
  
  // Check environment variables
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    log.error('Environment variables are not properly configured');
    process.exit(1);
  }
  
  // Test Supabase connection
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    log.error('Cannot connect to Supabase');
    process.exit(1);
  }
  
  // Verify database tables
  const tablesOk = await verifyDatabaseTables();
  
  // Verify storage buckets
  const bucketsOk = await verifyStorageBuckets();
  
  // Test sample data
  const dataOk = await testSampleData();
  
  // Test authentication
  const authOk = await testAuthentication();
  
  // Generate test credentials (optional)
  log.info('\nWould you like to create a test user account? (y/n)');
  // For now, we'll skip this interactive part and just show the option
  log.info('You can run this script with --create-test-user to generate test credentials');
  
  // Summary
  log.header('Verification Summary');
  
  const results = {
    'Environment Variables': envOk,
    'Supabase Connection': connectionOk,
    'Database Tables': tablesOk,
    'Storage Buckets': bucketsOk,
    'Sample Data': dataOk,
    'Authentication': authOk,
  };
  
  for (const [test, passed] of Object.entries(results)) {
    if (passed) {
      log.success(`${test}: ✓`);
    } else {
      log.error(`${test}: ✗`);
    }
  }
  
  const allPassed = Object.values(results).every(passed => passed);
  
  if (allPassed) {
    log.success('\n🎉 All tests passed! Your Supabase setup is working correctly.');
  } else {
    log.warning('\n⚠️  Some tests failed. Please check the issues above and fix them.');
    log.info('You may need to:');
    log.info('1. Run the database setup script');
    log.info('2. Create storage buckets in your Supabase dashboard');
    log.info('3. Check your environment variables');
  }
  
  return allPassed;
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--create-test-user')) {
  generateTestCredentials().then(() => {
    process.exit(0);
  }).catch((error) => {
    log.error('Failed to create test user:');
    console.error(error);
    process.exit(1);
  });
} else {
  // Run the main verification
  main().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    log.error('Verification failed with error:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  checkEnvironmentVariables,
  testSupabaseConnection,
  verifyDatabaseTables,
  verifyStorageBuckets,
  testSampleData,
  testAuthentication,
  generateTestCredentials,
}; 