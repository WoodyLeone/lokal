#!/usr/bin/env node

/**
 * Set up service role for backend to bypass RLS
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

async function setupServiceRole() {
  console.log('🔧 Setting up service role for backend...\n');
  
  try {
    // Create a service role policy that bypasses RLS
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create a service role for backend operations
        CREATE POLICY "Service role can manage all videos" ON videos
        FOR ALL USING (true)
        WITH CHECK (true);
      `
    });
    
    if (policyError) {
      console.log('⚠️ Could not create service role policy (exec_sql not available):', policyError.message);
      console.log('📝 Manual steps required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Authentication > Policies');
      console.log('3. Find the videos table');
      console.log('4. Add a new policy: "Service role can manage all videos"');
      console.log('5. Set it to FOR ALL USING (true) WITH CHECK (true)');
      return;
    }
    
    console.log('✅ Service role policy created');
    console.log('🔑 Backend can now bypass RLS for video operations');
    
  } catch (error) {
    console.error('❌ Error setting up service role:', error.message);
    console.log('📝 Manual setup required - see instructions above');
  }
}

setupServiceRole().catch(console.error); 