#!/usr/bin/env node

/**
 * Script to run the database migration for product matching columns
 * This adds the missing columns to the videos table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running database migration...');
    
    // Migration SQL to add missing columns
    const migrationSQL = `
-- Add product matching fields to videos table
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
`;

    console.log('📋 Executing migration SQL...');
    console.log(migrationSQL);

    // Execute the migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('💡 The exec_sql function might not be available.');
      console.log('🔧 Please run this SQL manually in your Supabase SQL editor:');
      console.log(migrationSQL);
      return;
    }

    console.log('✅ Migration executed successfully!');
    console.log('📊 Migration result:', data);

    // Test the new columns
    console.log('🧪 Testing new columns...');
    await testNewColumns();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Please run the migration manually in your Supabase SQL editor.');
  }
}

async function testNewColumns() {
  try {
    const columnsToTest = [
      'manual_product_name',
      'affiliate_link',
      'object_category',
      'bounding_box_coordinates',
      'final_product_name',
      'matched_label',
      'ai_suggestions',
      'user_confirmed'
    ];

    for (const column of columnsToTest) {
      try {
        const { error } = await supabase
          .from('videos')
          .select(column)
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          console.log(`❌ Column ${column}: Still missing`);
        } else {
          console.log(`✅ Column ${column}: Available`);
        }
      } catch (err) {
        console.log(`❌ Column ${column}: Error - ${err.message}`);
      }
    }

    // Test update operation
    console.log('🧪 Testing update operation...');
    const testData = {
      manual_product_name: 'Test Product',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('videos')
      .update(testData)
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID

    if (updateError && updateError.code === 'PGRST204') {
      console.log('❌ Update still failing - schema cache needs time to refresh');
    } else {
      console.log('✅ Update operation working!');
    }

  } catch (error) {
    console.error('❌ Column test failed:', error);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('🏁 Migration process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
}); 