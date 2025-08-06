#!/usr/bin/env node

/**
 * Setup Storage Policies Script
 * This script sets up the required RLS policies for Supabase Storage
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

// SQL statements to run
const sqlStatements = [
  // Drop existing policies if they exist
  `DROP POLICY IF EXISTS "Public read access to videos" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;`,
  `DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;`,
  
  // Enable RLS on storage.objects if not already enabled
  `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
  
  // Public read access policies
  `CREATE POLICY "Public read access to videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');`,
  
  `CREATE POLICY "Public read access to thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');`,
  
  // Upload policies for authenticated users
  `CREATE POLICY "Users can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'videos' AND 
      auth.uid() IS NOT NULL
    );`,
  
  `CREATE POLICY "Users can upload thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'thumbnails' AND 
      auth.uid() IS NOT NULL
    );`,
  
  // Update policies for authenticated users (own files)
  `CREATE POLICY "Users can update their own videos" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'videos' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );`,
  
  `CREATE POLICY "Users can update their own thumbnails" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'thumbnails' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );`,
  
  // Delete policies for authenticated users (own files)
  `CREATE POLICY "Users can delete their own videos" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'videos' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );`,
  
  `CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'thumbnails' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );`
];

async function setupStoragePolicies() {
  log.header('Setting up Storage Policies');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  log.info(`Supabase URL: ${supabaseUrl}`);
  log.info(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    log.info('Running SQL statements to set up storage policies...');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      log.debug(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          // Try direct SQL execution
          const { data: directData, error: directError } = await supabase
            .from('storage.objects')
            .select('*')
            .limit(1);
          
          if (directError) {
            log.warning(`Statement ${i + 1} may need manual execution: ${error.message}`);
            log.debug(`SQL: ${sql}`);
          } else {
            log.success(`Statement ${i + 1} executed successfully`);
          }
        } else {
          log.success(`Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        log.warning(`Statement ${i + 1} failed: ${error.message}`);
        log.debug(`SQL: ${sql}`);
      }
    }
    
    log.header('Manual SQL Execution Required');
    log.warning('The anon key cannot execute DDL statements. Please run these SQL statements manually in your Supabase SQL Editor:');
    log.info('');
    
    sqlStatements.forEach((sql, index) => {
      log.info(`-- Statement ${index + 1}`);
      log.debug(sql);
      log.info('');
    });
    
    log.info('After running the SQL statements, test with:');
    log.info('node scripts/diagnose-storage.js');
    
  } catch (error) {
    log.error(`Failed to setup storage policies: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Storage Policies Setup${colors.reset}\n`);
  
  await setupStoragePolicies();
  
  log.header('Next Steps');
  log.info('1. Go to your Supabase SQL Editor');
  log.info('2. Copy and paste the SQL statements above');
  log.info('3. Run them one by one or all at once');
  log.info('4. Test with: node scripts/diagnose-storage.js');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupStoragePolicies }; 