#!/usr/bin/env node

/**
 * Script to add missing columns to the videos table
 * This fixes the PGRST204 errors about missing columns
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingColumns() {
  try {
    console.log('🔧 Checking and fixing missing columns in videos table...');
    
    // Test each column to see which ones are missing
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

    const missingColumns = [];

    for (const column of columnsToTest) {
      try {
        console.log(`🧪 Testing column: ${column}`);
        const { error } = await supabase
          .from('videos')
          .select(column)
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          console.log(`❌ Column missing: ${column}`);
          missingColumns.push(column);
        } else {
          console.log(`✅ Column exists: ${column}`);
        }
      } catch (err) {
        console.log(`❌ Column missing: ${column}`);
        missingColumns.push(column);
      }
    }

    if (missingColumns.length === 0) {
      console.log('✅ All columns exist!');
      return;
    }

    console.log(`🔧 Missing columns: ${missingColumns.join(', ')}`);
    console.log('⚠️  You need to run the migration manually in Supabase dashboard');
    console.log('📋 Run this SQL in your Supabase SQL editor:');
    
    const migrationSQL = `
-- Add missing columns to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS manual_product_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS affiliate_link TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS object_category TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS bounding_box_coordinates JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS final_product_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS matched_label TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ai_suggestions JSONB DEFAULT '[]';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_manual_product_name ON videos(manual_product_name);
CREATE INDEX IF NOT EXISTS idx_videos_object_category ON videos(object_category);
CREATE INDEX IF NOT EXISTS idx_videos_user_confirmed ON videos(user_confirmed);
`;

    console.log(migrationSQL);

    // Try to test if we can work around the missing columns
    console.log('🔄 Testing workaround approach...');
    
    // Try to update with only existing columns
    const testData = {
      title: 'Test Update',
      updated_at: new Date().toISOString()
    };

    const { error: testError } = await supabase
      .from('videos')
      .update(testData)
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID

    if (testError && testError.code === 'PGRST204') {
      console.log('❌ Basic update also failing - database connection issue');
    } else {
      console.log('✅ Basic update works - just missing specific columns');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
fixMissingColumns().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 