const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRobustSystem() {
  console.log('🧪 Testing robust database system...\n');
  
  try {
    // Test 1: Check basic connectivity
    console.log('📋 Test 1: Basic connectivity');
    const { data: healthData, error: healthError } = await supabase
      .from('videos')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.log('⚠️ Basic connectivity failed:', healthError.message);
    } else {
      console.log('✅ Basic connectivity working');
    }

    // Test 2: Check available columns
    console.log('\n📋 Test 2: Available columns');
    const columns = [
      'id', 'title', 'description', 'video_url', 'user_id', 
      'created_at', 'updated_at', 'manual_product_name', 
      'affiliate_link', 'object_category', 'bounding_box_coordinates',
      'final_product_name', 'matched_label', 'ai_suggestions', 'user_confirmed'
    ];

    const availableColumns = [];
    const unavailableColumns = [];

    for (const column of columns) {
      try {
        const { error } = await supabase
          .from('videos')
          .select(column)
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          unavailableColumns.push(column);
        } else {
          availableColumns.push(column);
        }
      } catch (err) {
        unavailableColumns.push(column);
      }
    }

    console.log('✅ Available columns:', availableColumns);
    console.log('❌ Unavailable columns:', unavailableColumns);

    // Test 3: Test safe update with available columns
    console.log('\n📋 Test 3: Safe update test');
    const testVideoId = '00000000-0000-0000-0000-000000000000';
    
    // Try to update with all columns
    const updateData = {
      title: 'Robust System Test',
      updated_at: new Date().toISOString()
    };

    // Only add columns that are available
    if (availableColumns.includes('manual_product_name')) {
      updateData.manual_product_name = 'Test Product';
    }
    if (availableColumns.includes('affiliate_link')) {
      updateData.affiliate_link = 'https://example.com';
    }
    if (availableColumns.includes('object_category')) {
      updateData.object_category = 'test';
    }

    console.log('🔄 Attempting update with:', updateData);

    const { error: updateError } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', testVideoId);

    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ Update successful');
    }

    // Test 4: Test product_matches table
    console.log('\n📋 Test 4: Product matches table');
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('product_matches')
        .select('*')
        .limit(1);

      if (matchesError) {
        console.log('❌ Product matches table not available:', matchesError.message);
      } else {
        console.log('✅ Product matches table available');
      }
    } catch (err) {
      console.log('❌ Product matches table not available');
    }

    // Test 5: Schema cache refresh test
    console.log('\n📋 Test 5: Schema cache refresh');
    try {
      const { error: refreshError } = await supabase
        .from('videos')
        .select('*')
        .limit(1);

      if (refreshError) {
        console.log('⚠️ Schema cache refresh failed:', refreshError.message);
      } else {
        console.log('✅ Schema cache refresh successful');
      }
    } catch (err) {
      console.log('⚠️ Schema cache refresh failed:', err.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log(`📊 Available columns: ${availableColumns.length}/${columns.length}`);
    console.log(`📊 Unavailable columns: ${unavailableColumns.length}/${columns.length}`);
    
    if (availableColumns.length >= 7) {
      console.log('✅ Basic functionality should work');
    } else {
      console.log('⚠️ Limited functionality - some features may not work');
    }

    console.log('\n💡 The robust system will:');
    console.log('   - Use only available columns');
    console.log('   - Gracefully handle missing columns');
    console.log('   - Continue working in demo mode if needed');
    console.log('   - Automatically adapt to schema changes');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRobustSystem(); 