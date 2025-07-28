#!/usr/bin/env node

/**
 * Supabase Setup Script for Lokal App
 * This script helps set up the Supabase project with the required database schema and storage buckets.
 */

const { execSync } = require('child_process');
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
};

async function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

async function installSupabaseCLI() {
  log.info('Installing Supabase CLI...');
  
  try {
    // Check if npm is available
    execSync('npm --version', { stdio: 'pipe' });
    
    // Install Supabase CLI globally
    execSync('npm install -g supabase', { stdio: 'inherit' });
    log.success('Supabase CLI installed successfully');
    return true;
  } catch (error) {
    log.error('Failed to install Supabase CLI via npm');
    log.info('Please install Supabase CLI manually:');
    log.info('Visit: https://supabase.com/docs/guides/cli');
    return false;
  }
}

async function initializeSupabase() {
  log.header('Initializing Supabase Project');
  
  try {
    // Check if supabase directory already exists
    if (fs.existsSync('supabase')) {
      log.warning('Supabase directory already exists. Skipping initialization.');
      return true;
    }
    
    // Initialize Supabase project
    execSync('supabase init', { stdio: 'inherit' });
    log.success('Supabase project initialized');
    return true;
  } catch (error) {
    log.error('Failed to initialize Supabase project');
    return false;
  }
}

async function setupDatabaseSchema() {
  log.header('Setting up Database Schema');
  
  try {
    const sqlPath = path.join(__dirname, 'supabase-setup.sql');
    
    if (!fs.existsSync(sqlPath)) {
      log.error('Database schema file not found');
      return false;
    }
    
    log.info('Database schema file found. You can run this manually in your Supabase SQL editor:');
    log.info(`File: ${sqlPath}`);
    
    // Copy the SQL file to the supabase directory if it exists
    if (fs.existsSync('supabase')) {
      const targetPath = path.join('supabase', 'migrations', '001_initial_schema.sql');
      
      // Create migrations directory if it doesn't exist
      const migrationsDir = path.dirname(targetPath);
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }
      
      fs.copyFileSync(sqlPath, targetPath);
      log.success('Database schema copied to supabase/migrations/');
    }
    
    return true;
  } catch (error) {
    log.error('Failed to setup database schema');
    return false;
  }
}

async function createStorageBuckets() {
  log.header('Creating Storage Buckets');
  
  try {
    // Create storage buckets SQL
    const storageSQL = `
-- Create storage buckets for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;
    `;
    
    const storagePath = path.join('supabase', 'migrations', '002_storage_buckets.sql');
    
    // Create migrations directory if it doesn't exist
    const migrationsDir = path.dirname(storagePath);
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    fs.writeFileSync(storagePath, storageSQL);
    log.success('Storage buckets configuration created');
    
    return true;
  } catch (error) {
    log.error('Failed to create storage buckets configuration');
    return false;
  }
}

async function setupEnvironmentVariables() {
  log.header('Setting up Environment Variables');
  
  try {
    const envExample = `# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal
EXPO_PUBLIC_APP_VERSION=1.0.0
`;
    
    const envPath = path.join(process.cwd(), '.env.example');
    fs.writeFileSync(envPath, envExample);
    log.success('Environment variables template created (.env.example)');
    
    log.info('Please create a .env file with your actual Supabase credentials:');
    log.info('1. Copy .env.example to .env');
    log.info('2. Replace the placeholder values with your Supabase project URL and anon key');
    
    return true;
  } catch (error) {
    log.error('Failed to setup environment variables');
    return false;
  }
}

async function main() {
  log.header('Lokal App - Supabase Setup');
  
  // Check if Supabase CLI is installed
  const hasSupabaseCLI = await checkSupabaseCLI();
  if (!hasSupabaseCLI) {
    log.warning('Supabase CLI not found');
    const installed = await installSupabaseCLI();
    if (!installed) {
      log.error('Cannot proceed without Supabase CLI');
      process.exit(1);
    }
  } else {
    log.success('Supabase CLI found');
  }
  
  // Initialize Supabase project
  const initialized = await initializeSupabase();
  if (!initialized) {
    log.error('Failed to initialize Supabase project');
    process.exit(1);
  }
  
  // Setup database schema
  const schemaSetup = await setupDatabaseSchema();
  if (!schemaSetup) {
    log.error('Failed to setup database schema');
    process.exit(1);
  }
  
  // Create storage buckets
  const bucketsCreated = await createStorageBuckets();
  if (!bucketsCreated) {
    log.error('Failed to create storage buckets');
    process.exit(1);
  }
  
  // Setup environment variables
  const envSetup = await setupEnvironmentVariables();
  if (!envSetup) {
    log.error('Failed to setup environment variables');
    process.exit(1);
  }
  
  log.header('Setup Complete!');
  log.success('Supabase project has been initialized successfully');
  
  log.info('Next steps:');
  log.info('1. Create a Supabase project at https://supabase.com');
  log.info('2. Copy your project URL and anon key to .env file');
  log.info('3. Run the SQL migrations in your Supabase SQL editor');
  log.info('4. Create storage buckets for videos and thumbnails');
  log.info('5. Test the connection by running the app');
  
  log.info('\nFor detailed instructions, see: README.md');
}

// Run the setup
if (require.main === module) {
  main().catch((error) => {
    log.error('Setup failed with error:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  checkSupabaseCLI,
  installSupabaseCLI,
  initializeSupabase,
  setupDatabaseSchema,
  createStorageBuckets,
  setupEnvironmentVariables,
}; 