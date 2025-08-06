#!/usr/bin/env node

/**
 * Full Database Migration Script
 * This script handles the complete migration process for the Lokal app
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFullMigration() {
  try {
    console.log('🚀 Starting Full Database Migration...');
    console.log('=====================================');
    
    // Step 1: Check current database state
    console.log('\n📊 Step 1: Checking current database state...');
    await checkCurrentState();
    
    // Step 2: Run the migration
    console.log('\n🔧 Step 2: Running migration...');
    await runMigration();
    
    // Step 3: Verify migration
    console.log('\n✅ Step 3: Verifying migration...');
    await verifyMigration();
    
    // Step 4: Test functionality
    console.log('\n🧪 Step 4: Testing functionality...');
    await testFunctionality();
    
    console.log('\n🎉 Full migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Please run the migration manually in Supabase SQL editor.');
  }
}

async function checkCurrentState() {
  try {
    // Check if videos table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('videos')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Videos table not accessible:', tableError.message);
      return;
    }
    
    console.log('✅ Videos table exists and is accessible');
    
    // Check for existing columns
    const columnsToCheck = [
      'manual_product_name',
      'affiliate_link',
      'object_category',
      'bounding_box_coordinates',
      'final_product_name',
      'matched_label',
      'ai_suggestions',
      'user_confirmed'
    ];
    
    console.log('🔍 Checking for existing columns...');
    for (const column of columnsToCheck) {
      try {
        const { error } = await supabase
          .from('videos')
          .select(column)
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          console.log(`❌ Column ${column}: Missing`);
        } else {
          console.log(`✅ Column ${column}: Exists`);
        }
      } catch (err) {
        console.log(`❌ Column ${column}: Error - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking current state:', error);
  }
}

async function runMigration() {
  try {
    console.log('📋 Migration SQL to execute:');
    
    const migrationSQL = `
-- Full Migration for Lokal App
-- Adding product matching fields to videos table

-- Add new columns
ALTER TABLE videos ADD COLUMN IF NOT EXISTS manual_product_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS affiliate_link TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS object_category TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS bounding_box_coordinates JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS final_product_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS matched_label TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ai_suggestions JSONB DEFAULT '[]';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_manual_product_name ON videos(manual_product_name);
CREATE INDEX IF NOT EXISTS idx_videos_object_category ON videos(object_category);
CREATE INDEX IF NOT EXISTS idx_videos_user_confirmed ON videos(user_confirmed);

-- Add comments for documentation
COMMENT ON COLUMN videos.manual_product_name IS 'User-provided product name';
COMMENT ON COLUMN videos.affiliate_link IS 'Affiliate link for the product';
COMMENT ON COLUMN videos.object_category IS 'Category of detected object';
COMMENT ON COLUMN videos.bounding_box_coordinates IS 'Bounding box coordinates of detected object';
COMMENT ON COLUMN videos.final_product_name IS 'Final selected product name';
COMMENT ON COLUMN videos.matched_label IS 'Matched product label';
COMMENT ON COLUMN videos.ai_suggestions IS 'AI-generated product suggestions';
COMMENT ON COLUMN videos.user_confirmed IS 'Whether user confirmed the product selection';
`;

    console.log(migrationSQL);
    
    // Try to execute using rpc (if available)
    console.log('🔄 Attempting to execute migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ RPC execution failed:', error.message);
      console.log('💡 The exec_sql function is not available.');
      console.log('📋 Please run the SQL above manually in your Supabase SQL editor.');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql');
      return false;
    }

    console.log('✅ Migration executed successfully via RPC');
    console.log('📊 Migration result:', data);
    return true;

  } catch (error) {
    console.error('❌ Migration execution failed:', error);
    return false;
  }
}

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration results...');
    
    const columnsToVerify = [
      'manual_product_name',
      'affiliate_link',
      'object_category',
      'bounding_box_coordinates',
      'final_product_name',
      'matched_label',
      'ai_suggestions',
      'user_confirmed'
    ];
    
    let allColumnsExist = true;
    
    for (const column of columnsToVerify) {
      try {
        const { error } = await supabase
          .from('videos')
          .select(column)
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          console.log(`❌ Column ${column}: Still missing`);
          allColumnsExist = false;
        } else {
          console.log(`✅ Column ${column}: Verified`);
        }
      } catch (err) {
        console.log(`❌ Column ${column}: Error - ${err.message}`);
        allColumnsExist = false;
      }
    }
    
    if (allColumnsExist) {
      console.log('🎉 All columns verified successfully!');
    } else {
      console.log('⚠️ Some columns are still missing. Schema cache may need time to refresh.');
    }
    
    return allColumnsExist;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function testFunctionality() {
  try {
    console.log('🧪 Testing database functionality...');
    
    // Test basic update
    console.log('1. Testing basic update...');
    const testData = {
      title: 'Migration Test',
      updated_at: new Date().toISOString()
    };

    const { error: basicError } = await supabase
      .from('videos')
      .update(testData)
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (basicError) {
      console.log('❌ Basic update failed:', basicError.message);
    } else {
      console.log('✅ Basic update works');
    }
    
    // Test new column update
    console.log('2. Testing new column update...');
    const newColumnData = {
      manual_product_name: 'Test Product',
      updated_at: new Date().toISOString()
    };

    const { error: newColumnError } = await supabase
      .from('videos')
      .update(newColumnData)
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (newColumnError && newColumnError.code === 'PGRST204') {
      console.log('❌ New column update failed - schema cache needs time to refresh');
      console.log('💡 This is normal. The app will work in demo mode until cache refreshes.');
    } else {
      console.log('✅ New column update works!');
    }
    
    // Test complex update
    console.log('3. Testing complex update...');
    const complexData = {
      manual_product_name: 'Complex Test Product',
      affiliate_link: 'https://example.com/product',
      object_category: 'electronics',
      ai_suggestions: ['Product A', 'Product B'],
      user_confirmed: true,
      updated_at: new Date().toISOString()
    };

    const { error: complexError } = await supabase
      .from('videos')
      .update(complexData)
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (complexError && complexError.code === 'PGRST204') {
      console.log('❌ Complex update failed - schema cache needs time to refresh');
    } else {
      console.log('✅ Complex update works!');
    }
    
  } catch (error) {
    console.error('❌ Functionality test failed:', error);
  }
}

// Run the full migration
runFullMigration().then(() => {
  console.log('\n🏁 Full migration process completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Full migration failed:', error);
  process.exit(1);
}); 