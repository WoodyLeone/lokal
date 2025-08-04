#!/usr/bin/env node

/**
 * Script to force refresh Supabase schema cache
 * This makes multiple queries to help refresh the cache
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceSchemaRefresh() {
  try {
    console.log('🔄 Force refreshing Supabase schema cache...');
    
    // Make multiple queries to force cache refresh
    const queries = [
      // Query all columns
      () => supabase.from('videos').select('*').limit(1),
      
      // Query specific new columns
      () => supabase.from('videos').select('manual_product_name, affiliate_link, object_category').limit(1),
      () => supabase.from('videos').select('bounding_box_coordinates, final_product_name, matched_label').limit(1),
      () => supabase.from('videos').select('ai_suggestions, user_confirmed').limit(1),
      
      // Query with different combinations
      () => supabase.from('videos').select('id, title, manual_product_name').limit(1),
      () => supabase.from('videos').select('id, title, affiliate_link').limit(1),
      () => supabase.from('videos').select('id, title, object_category').limit(1),
      () => supabase.from('videos').select('id, title, ai_suggestions').limit(1),
      
      // Try to get actual data if any exists
      () => supabase.from('videos').select('id, title, manual_product_name, affiliate_link').order('created_at', { ascending: false }).limit(5)
    ];

    console.log('📊 Making multiple queries to refresh cache...');
    
    for (let i = 0; i < queries.length; i++) {
      try {
        const { data, error } = await queries[i]();
        if (error) {
          console.log(`⚠️  Query ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Query ${i + 1}: Success`);
        }
      } catch (err) {
        console.log(`❌ Query ${i + 1}: ${err.message}`);
      }
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('⏳ Waiting 2 seconds for cache to settle...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test update operation
    console.log('🧪 Testing update operation...');
    const testData = {
      title: 'Schema Refresh Test',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('videos')
      .update(testData)
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (updateError && updateError.code === 'PGRST204') {
      console.log('❌ Update still failing - schema cache needs more time');
      console.log('💡 This is normal. The cache can take 5-10 minutes to fully refresh.');
    } else {
      console.log('✅ Update operation working!');
    }

    // Test with new column
    console.log('🧪 Testing update with new column...');
    const testNewColumnData = {
      manual_product_name: 'Test Product',
      updated_at: new Date().toISOString()
    };

    const { error: newColumnError } = await supabase
      .from('videos')
      .update(testNewColumnData)
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (newColumnError && newColumnError.code === 'PGRST204') {
      console.log('❌ New column update still failing');
      console.log('💡 The app will work in demo mode until the cache refreshes.');
    } else {
      console.log('✅ New column update working!');
    }

    console.log('🏁 Schema cache refresh completed');

  } catch (error) {
    console.error('❌ Schema refresh failed:', error);
  }
}

// Run the refresh
forceSchemaRefresh().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Refresh failed:', error);
  process.exit(1);
}); 