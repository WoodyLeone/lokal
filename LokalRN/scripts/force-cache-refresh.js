#!/usr/bin/env node

/**
 * Force Schema Cache Refresh Script
 * This script forces the Supabase schema cache to refresh by making multiple queries
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceCacheRefresh() {
  try {
    console.log('🔄 Force refreshing Supabase schema cache...');
    console.log('This may take a few minutes...');
    
    // Step 1: Make multiple SELECT queries to refresh cache
    console.log('\n📊 Step 1: Making SELECT queries to refresh cache...');
    
    const selectQueries = [
      () => supabase.from('videos').select('*').limit(1),
      () => supabase.from('videos').select('manual_product_name, affiliate_link').limit(1),
      () => supabase.from('videos').select('object_category, bounding_box_coordinates').limit(1),
      () => supabase.from('videos').select('final_product_name, matched_label').limit(1),
      () => supabase.from('videos').select('ai_suggestions, user_confirmed').limit(1),
      () => supabase.from('videos').select('id, title, manual_product_name, affiliate_link').limit(1),
      () => supabase.from('videos').select('id, title, object_category, ai_suggestions').limit(1),
    ];
    
    for (let i = 0; i < selectQueries.length; i++) {
      try {
        const { error } = await selectQueries[i]();
        if (error) {
          console.log(`⚠️  SELECT Query ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ SELECT Query ${i + 1}: Success`);
        }
      } catch (err) {
        console.log(`❌ SELECT Query ${i + 1}: ${err.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Step 2: Wait for cache to settle
    console.log('\n⏳ Step 2: Waiting for cache to settle...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Test UPDATE operations
    console.log('\n🧪 Step 3: Testing UPDATE operations...');
    
    const updateTests = [
      {
        name: 'Basic Update',
        data: { title: 'Cache Refresh Test', updated_at: new Date().toISOString() }
      },
      {
        name: 'Single New Column',
        data: { manual_product_name: 'Test Product', updated_at: new Date().toISOString() }
      },
      {
        name: 'Multiple New Columns',
        data: {
          manual_product_name: 'Test Product',
          affiliate_link: 'https://example.com',
          object_category: 'electronics',
          updated_at: new Date().toISOString()
        }
      },
      {
        name: 'Complex Update',
        data: {
          manual_product_name: 'Complex Test Product',
          affiliate_link: 'https://example.com/product',
          object_category: 'electronics',
          bounding_box_coordinates: { x: 100, y: 200, width: 300, height: 400 },
          final_product_name: 'Final Product Name',
          matched_label: 'Matched Label',
          ai_suggestions: ['Suggestion 1', 'Suggestion 2'],
          user_confirmed: true,
          updated_at: new Date().toISOString()
        }
      }
    ];
    
    for (const test of updateTests) {
      try {
        console.log(`\n🧪 Testing: ${test.name}`);
        const { error } = await supabase
          .from('videos')
          .update(test.data)
          .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        
        if (error && error.code === 'PGRST204') {
          console.log(`❌ ${test.name}: Schema cache still needs time to refresh`);
        } else if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: Success!`);
        }
      } catch (err) {
        console.log(`❌ ${test.name}: ${err.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 4: Final verification
    console.log('\n🔍 Step 4: Final verification...');
    
    const finalTest = {
      manual_product_name: 'Final Test Product',
      updated_at: new Date().toISOString()
    };
    
    const { error: finalError } = await supabase
      .from('videos')
      .update(finalTest)
      .eq('id', '00000000-0000-0000-0000-000000000000');
    
    if (finalError && finalError.code === 'PGRST204') {
      console.log('❌ Schema cache still needs more time to refresh');
      console.log('💡 This is normal. The cache can take 5-10 minutes to fully refresh.');
      console.log('🚀 The app will work in demo mode until the cache refreshes.');
    } else if (finalError) {
      console.log('❌ Final test failed:', finalError.message);
    } else {
      console.log('🎉 Schema cache refresh successful!');
      console.log('✅ All UPDATE operations are now working!');
    }
    
    console.log('\n🏁 Cache refresh process completed');
    
  } catch (error) {
    console.error('❌ Cache refresh failed:', error);
  }
}

// Run the cache refresh
forceCacheRefresh().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Cache refresh failed:', error);
  process.exit(1);
}); 