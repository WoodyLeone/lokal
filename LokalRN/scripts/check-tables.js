#!/usr/bin/env node

/**
 * Table Check Script for Lokal App
 * This script checks what tables actually exist in the Supabase database
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

async function checkTables() {
  log.header('Checking Database Tables');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // List of tables to check (both expected and potential variations)
    const tablesToCheck = [
      'profiles', 'profile', 'users', 'user',
      'videos', 'video', 'media', 'uploads',
      'products', 'product', 'items', 'goods',
      'auth.users', 'storage.objects'
    ];
    
    const existingTables = [];
    const tableSchemas = {};
    
    log.info('Checking table access...');
    
    for (const tableName of tablesToCheck) {
      try {
        // Try to query the table
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          log.debug(`Table '${tableName}' not accessible: ${error.message}`);
        } else {
          log.success(`✓ Table '${tableName}' exists and is accessible`);
          existingTables.push(tableName);
          
          // Get table schema by trying to select all columns
          try {
            const { data: sampleData, error: schemaError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!schemaError && sampleData.length > 0) {
              const columns = Object.keys(sampleData[0]);
              tableSchemas[tableName] = columns;
              log.debug(`  Columns: ${columns.join(', ')}`);
            }
          } catch (schemaErr) {
            log.debug(`  Could not get schema for '${tableName}': ${schemaErr.message}`);
          }
        }
      } catch (error) {
        log.debug(`Exception checking '${tableName}': ${error.message}`);
      }
    }
    
    // Check for any tables we might have missed
    log.header('Checking for Additional Tables');
    
    // Try some common table discovery queries
    const additionalChecks = [
      'categories', 'category',
      'tags', 'tag',
      'comments', 'comment',
      'likes', 'like',
      'followers', 'follower',
      'posts', 'post',
      'content', 'contents'
    ];
    
    for (const tableName of additionalChecks) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          log.success(`✓ Found additional table: '${tableName}'`);
          existingTables.push(tableName);
          
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            tableSchemas[tableName] = columns;
            log.debug(`  Columns: ${columns.join(', ')}`);
          }
        }
      } catch (error) {
        // Ignore errors for additional checks
      }
    }
    
    // Summary
    log.header('Table Summary');
    log.success(`Found ${existingTables.length} accessible table(s):`);
    
    existingTables.forEach(table => {
      log.info(`- ${table}`);
      if (tableSchemas[table]) {
        log.debug(`  Schema: ${tableSchemas[table].join(', ')}`);
      }
    });
    
    // Check for expected tables
    const expectedTables = ['profiles', 'videos', 'products'];
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      log.warning(`Missing expected tables: ${missingTables.join(', ')}`);
    } else {
      log.success('All expected tables are present!');
    }
    
    return { existingTables, tableSchemas };
    
  } catch (error) {
    log.error(`Failed to check tables: ${error.message}`);
    return null;
  }
}

async function checkTableData() {
  log.header('Checking Table Data');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check data in existing tables
    const { existingTables } = await checkTables();
    
    if (!existingTables) return;
    
    for (const tableName of existingTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (error) {
          log.error(`Error querying '${tableName}': ${error.message}`);
        } else {
          log.success(`Table '${tableName}': ${data.length} row(s)`);
          
          if (data.length > 0) {
            log.debug(`Sample data from '${tableName}':`);
            log.debug(JSON.stringify(data[0], null, 2));
          }
        }
      } catch (error) {
        log.error(`Exception querying '${tableName}': ${error.message}`);
      }
    }
    
  } catch (error) {
    log.error(`Failed to check table data: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Database Table Check${colors.reset}\n`);
  
  const result = await checkTables();
  await checkTableData();
  
  if (result) {
    log.header('Recommendations');
    log.info('Based on the found tables, you may need to:');
    log.info('1. Update table names in your code');
    log.info('2. Update column names to match the actual schema');
    log.info('3. Update queries to use the correct table structure');
    
    log.info('\nNext steps:');
    log.info('1. Review the table schemas above');
    log.info('2. Update your TypeScript types');
    log.info('3. Update your database queries');
    log.info('4. Update your Supabase configuration');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkTables, checkTableData }; 