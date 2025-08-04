#!/usr/bin/env node

/**
 * Temporarily disable RLS on videos table for testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLSTemp() {
  console.log('🔧 Temporarily disabling RLS on videos table for testing...\n');
  
  try {
    // Disable RLS on videos table
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE videos DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.log('⚠️ Could not disable RLS (exec_sql not available):', disableError.message);
      console.log('📝 You may need to manually run: ALTER TABLE videos DISABLE ROW LEVEL SECURITY;');
      return;
    }
    
    console.log('✅ RLS disabled on videos table');
    console.log('⚠️ Remember to re-enable RLS later with: ALTER TABLE videos ENABLE ROW LEVEL SECURITY;');
    
  } catch (error) {
    console.error('❌ Error disabling RLS:', error.message);
    console.log('📝 You may need to manually run: ALTER TABLE videos DISABLE ROW LEVEL SECURITY;');
  }
}

disableRLSTemp().catch(console.error); 