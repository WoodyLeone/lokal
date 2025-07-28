#!/usr/bin/env node

/**
 * Schema Check Script for Lokal App
 * This script gets the complete schema for all tables
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

async function getTableSchemas() {
  log.header('Getting Complete Table Schemas');
  
  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not configured');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const tables = ['profiles', 'videos', 'products'];
    const schemas = {};
    
    for (const tableName of tables) {
      log.info(`Getting schema for table: ${tableName}`);
      
      try {
        // Get sample data to infer schema
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(10);
        
        if (error) {
          log.error(`Error querying '${tableName}': ${error.message}`);
          continue;
        }
        
        if (data.length === 0) {
          log.warning(`Table '${tableName}' is empty, cannot infer schema`);
          continue;
        }
        
        // Get the first row to see all columns
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        
        // Get data types by examining values
        const columnTypes = {};
        columns.forEach(column => {
          const value = firstRow[column];
          if (value === null) {
            columnTypes[column] = 'unknown';
          } else if (typeof value === 'string') {
            // Check if it's a UUID
            if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              columnTypes[column] = 'uuid';
            } else if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              columnTypes[column] = 'timestamp';
            } else {
              columnTypes[column] = 'text';
            }
          } else if (typeof value === 'number') {
            columnTypes[column] = 'numeric';
          } else if (typeof value === 'boolean') {
            columnTypes[column] = 'boolean';
          } else if (Array.isArray(value)) {
            columnTypes[column] = 'array';
          } else if (typeof value === 'object') {
            columnTypes[column] = 'json';
          } else {
            columnTypes[column] = typeof value;
          }
        });
        
        schemas[tableName] = {
          columns,
          types: columnTypes,
          sampleData: data[0],
          rowCount: data.length
        };
        
        log.success(`✓ Schema for '${tableName}':`);
        columns.forEach(col => {
          log.debug(`  - ${col}: ${columnTypes[col]}`);
        });
        
      } catch (error) {
        log.error(`Exception getting schema for '${tableName}': ${error.message}`);
      }
    }
    
    return schemas;
    
  } catch (error) {
    log.error(`Failed to get schemas: ${error.message}`);
    return null;
  }
}

async function generateTypeScriptTypes(schemas) {
  log.header('Generating TypeScript Types');
  
  if (!schemas) return;
  
  let typesCode = '// Generated TypeScript types based on actual database schema\n\n';
  
  for (const [tableName, schema] of Object.entries(schemas)) {
    const interfaceName = tableName.charAt(0).toUpperCase() + tableName.slice(1, -1); // Remove 's' and capitalize
    
    typesCode += `export interface ${interfaceName} {\n`;
    
    schema.columns.forEach(column => {
      const type = schema.types[column];
      let tsType = 'any';
      
      switch (type) {
        case 'uuid':
          tsType = 'string';
          break;
        case 'text':
          tsType = 'string';
          break;
        case 'numeric':
          tsType = 'number';
          break;
        case 'boolean':
          tsType = 'boolean';
          break;
        case 'timestamp':
          tsType = 'string'; // ISO date string
          break;
        case 'array':
          tsType = 'string[]';
          break;
        case 'json':
          tsType = 'any'; // Could be more specific
          break;
        default:
          tsType = 'any';
      }
      
      typesCode += `  ${column}: ${tsType};\n`;
    });
    
    typesCode += `}\n\n`;
  }
  
  log.info('Generated TypeScript types:');
  log.debug(typesCode);
  
  return typesCode;
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Lokal App - Schema Analysis${colors.reset}\n`);
  
  const schemas = await getTableSchemas();
  
  if (schemas) {
    log.header('Schema Summary');
    
    for (const [tableName, schema] of Object.entries(schemas)) {
      log.success(`Table: ${tableName}`);
      log.info(`  Columns: ${schema.columns.length}`);
      log.info(`  Sample rows: ${schema.rowCount}`);
      log.debug(`  Sample data: ${JSON.stringify(schema.sampleData, null, 2)}`);
    }
    
    // Generate TypeScript types
    const typesCode = await generateTypeScriptTypes(schemas);
    
    log.header('Next Steps');
    log.info('1. Update your TypeScript types with the generated code above');
    log.info('2. Update your database queries to match the actual schema');
    log.info('3. Update your Supabase configuration files');
    log.info('4. Test your queries with the actual table structure');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getTableSchemas, generateTypeScriptTypes }; 