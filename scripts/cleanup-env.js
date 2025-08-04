#!/usr/bin/env node

/**
 * Cleanup Environment File
 * This script removes all Supabase references from the .env file
 */

const fs = require('fs');
const path = require('path');

function cleanupEnv() {
  console.log('🧹 Cleaning up environment file...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Read current .env file
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Remove all Supabase-related lines
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => {
      // Keep lines that don't contain Supabase references
      return !line.includes('SUPABASE') && 
             !line.includes('supabase') && 
             !line.includes('Supabase') &&
             !line.includes('migration only') &&
             !line.includes('remove after migration');
    });
    
    // Write cleaned content
    const cleanedContent = cleanedLines.join('\n');
    fs.writeFileSync(envPath, cleanedContent);
    
    console.log('✅ Environment file cleaned successfully!');
    console.log('📋 Removed all Supabase references');
    
  } catch (error) {
    console.error('❌ Error cleaning environment file:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupEnv();
}

module.exports = { cleanupEnv }; 