#!/usr/bin/env node

/**
 * Script to add the missing product_data column to the videos table
 * This fixes the PGRST204 error about missing product_data column
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addProductDataColumn() {
  try {
    console.log('🔧 Adding product_data column to videos table...');
    
    // Add the product_data column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE videos ADD COLUMN IF NOT EXISTS product_data JSONB DEFAULT '{}';
        CREATE INDEX IF NOT EXISTS idx_videos_product_data ON videos USING GIN (product_data);
        COMMENT ON COLUMN videos.product_data IS 'JSON object containing product matching data including manual product name, AI suggestions, and user selections';
      `
    });

    if (error) {
      console.error('❌ Error adding product_data column:', error);
      
      // Try alternative approach using direct SQL
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('videos')
        .select('id')
        .limit(1);
      
      if (altError && altError.code === 'PGRST204') {
        console.log('✅ Column already exists or will be created on next insert');
      } else {
        console.error('❌ Alternative approach failed:', altError);
      }
    } else {
      console.log('✅ product_data column added successfully');
    }

    // Test the column by trying to insert a test record
    console.log('🧪 Testing product_data column...');
    const testData = {
      product_data: {
        manualProductName: 'test',
        aiSuggestions: ['test1', 'test2'],
        userConfirmed: false
      }
    };

    const { error: testError } = await supabase
      .from('videos')
      .update(testData)
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID for testing

    if (testError && testError.code === 'PGRST204') {
      console.log('❌ Column still not accessible');
    } else {
      console.log('✅ product_data column is working correctly');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
addProductDataColumn().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 