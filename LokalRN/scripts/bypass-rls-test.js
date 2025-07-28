#!/usr/bin/env node

/**
 * Bypass RLS Test Script
 * Tests if we can upload files by authenticating first
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

async function bypassRLSTest() {
  log.header('Testing Authenticated Upload to Bypass RLS');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Try to sign up a test user
    log.header('Test 1: Create Test User');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: 'testuser'
          }
        }
      });
      
      if (error) {
        log.error(`Sign up failed: ${error.message}`);
        log.info('Trying to sign in with existing user...');
        
        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (signInError) {
          log.error(`Sign in failed: ${signInError.message}`);
          return;
        } else {
          log.success('Signed in successfully');
        }
      } else {
        log.success('Test user created successfully');
      }
    } catch (error) {
      log.error(`Exception during auth: ${error.message}`);
      return;
    }
    
    // Test 2: Try uploading with authenticated user
    log.header('Test 2: Authenticated Upload Test');
    try {
      const testVideoContent = Buffer.from('fake video content for testing');
      const testFileName = `test-video-${Date.now()}.mp4`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(testFileName, testVideoContent, {
          contentType: 'video/mp4'
        });
      
      if (error) {
        log.error(`Authenticated upload failed: ${error.message}`);
        log.debug(`Error code: ${error.code}`);
      } else {
        log.success('Authenticated upload successful!');
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
      log.error(`Exception during authenticated upload test: ${error.message}`);
    }
    
    // Test 3: Check current user
    log.header('Test 3: Current User Check');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        log.error(`Get user failed: ${error.message}`);
      } else if (user) {
        log.success(`Current user: ${user.email}`);
        log.debug(`User ID: ${user.id}`);
      } else {
        log.warning('No current user');
      }
    } catch (error) {
      log.error(`Exception getting user: ${error.message}`);
    }
    
    // Test 4: Sign out
    log.header('Test 4: Sign Out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        log.error(`Sign out failed: ${error.message}`);
      } else {
        log.success('Signed out successfully');
      }
    } catch (error) {
      log.error(`Exception during sign out: ${error.message}`);
    }
    
  } catch (error) {
    log.error(`Failed to test authenticated upload: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Authenticated Upload Test${colors.reset}\n`);
  
  await bypassRLSTest();
  
  log.header('Analysis');
  log.info('If authenticated uploads work, the RLS policies require authentication.');
  log.info('If they still fail, we need to create proper RLS policies.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { bypassRLSTest }; 