#!/usr/bin/env node

/**
 * Script to test database schema and column access
 * This helps diagnose PGRST204 errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  try {
    console.log('🧪 Testing database schema and column access...');
    
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: basicData, error: basicError } = await supabase
      .from('videos')
      .select('id, title')
      .limit(1);
    
    if (basicError) {
      console.error('❌ Basic connection failed:', basicError);
      return;
    }
    console.log('✅ Basic connection works');

    // Test each column individually
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

    console.log('2. Testing individual columns...');
    for (const column of columnsToTest) {
      try {
        const { error } = await supabase
          .from('videos')
          .select(column)
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          console.log(`❌ Column ${column}: NOT ACCESSIBLE`);
        } else {
          console.log(`✅ Column ${column}: ACCESSIBLE`);
        }
      } catch (err) {
        console.log(`❌ Column ${column}: ERROR - ${err.message}`);
      }
    }

    // Test update operation
    console.log('3. Testing update operation...');
    const testUpdateData = {
      title: 'Schema Test',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('videos')
      .update(testUpdateData)
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID

    if (updateError && updateError.code === 'PGRST204') {
      console.log('❌ Basic update failed - schema cache issue');
    } else {
      console.log('✅ Basic update works');
    }

    // Test with one of the new columns
    console.log('4. Testing update with new column...');
    const testNewColumnData = {
      manual_product_name: 'Test Product',
      updated_at: new Date().toISOString()
    };

    const { error: newColumnError } = await supabase
      .from('videos')
      .update(testNewColumnData)
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (newColumnError && newColumnError.code === 'PGRST204') {
      console.log('❌ New column update failed:', newColumnError.message);
    } else {
      console.log('✅ New column update works');
    }

    console.log('🏁 Schema test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDatabaseSchema().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 