#!/usr/bin/env node

/**
 * Update App Code for Railway PostgreSQL
 * This script helps update your app code from SupabaseService to DatabaseService
 */

const fs = require('fs');
const path = require('path');

function updateAppCode() {
  console.log('🔧 Updating app code for Railway PostgreSQL...');
  
  const filesToUpdate = [
    'src/screens/HomeScreen.tsx',
    'src/screens/AuthScreen.tsx',
    'src/screens/ProfileScreen.tsx',
    'src/screens/UploadScreen.tsx',
    'App.tsx'
  ];
  
  let updatedFiles = 0;
  
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let updated = false;
        
        // Update imports
        if (content.includes("import { SupabaseService } from")) {
          content = content.replace(
            /import \{ SupabaseService \} from ['"]\.\.\/services\/supabase['"];?/g,
            "import { DatabaseService } from '../services/databaseService';"
          );
          content = content.replace(
            /import \{ SupabaseService \} from ['"]\.\/src\/services\/supabase['"];?/g,
            "import { DatabaseService } from './src/services/databaseService';"
          );
          updated = true;
        }
        
        // Update service calls
        if (content.includes('SupabaseService.')) {
          content = content.replace(/SupabaseService\./g, 'DatabaseService.');
          updated = true;
        }
        
        if (updated) {
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Updated ${filePath}`);
          updatedFiles++;
        } else {
          console.log(`ℹ️ No changes needed for ${filePath}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  });
  
  console.log(`\n📋 Updated ${updatedFiles} files`);
  console.log('\n📋 Manual steps you may need to do:');
  console.log('1. Check for any remaining SupabaseService references');
  console.log('2. Update any Supabase-specific code (like storage uploads)');
  console.log('3. Test your app thoroughly');
  console.log('4. Remove the old supabase.ts file if no longer needed');
  
  console.log('\n📋 Files that were updated:');
  filesToUpdate.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  console.log('\n🎉 App code update completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test your app: npm start');
  console.log('2. Check for any errors in the console');
  console.log('3. Test authentication, video uploads, and data loading');
}

// Run if called directly
if (require.main === module) {
  updateAppCode();
}

module.exports = { updateAppCode }; 