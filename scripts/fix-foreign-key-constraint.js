const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '../backend/env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixForeignKeyConstraint() {
  console.log('🔧 Fixing foreign key constraint on videos table...');
  
  try {
    // First, let's check the current constraint
    console.log('📋 Checking current videos table structure...');
    
    // Try to insert a video without user_id to see the exact error
    const testVideoId = uuidv4();
    const { data, error } = await supabase
      .from('videos')
      .insert({
        id: testVideoId,
        title: 'Test Video',
        description: 'Testing foreign key constraint',
        video_url: 'demo://test-video',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // Note: no user_id field
      })
      .select()
      .single();
    
    if (error) {
      console.log('📋 Current constraint error:', error.message);
      console.log('📋 Error code:', error.code);
      
      if (error.code === '23502') {
        console.log('🔧 user_id is NOT NULL - attempting to make it nullable...');
        
        // Try to alter the table to make user_id nullable
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE videos ALTER COLUMN user_id DROP NOT NULL;
          `
        });
        
        if (alterError) {
          console.error('❌ Error altering table:', alterError);
          console.log('🔄 Trying alternative approach...');
          
          // Try to drop and recreate the foreign key constraint
          const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: `
              ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_user_id_fkey;
              ALTER TABLE videos ADD CONSTRAINT videos_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
            `
          });
          
          if (dropError) {
            console.error('❌ Error dropping constraint:', dropError);
            console.log('⚠️ Manual intervention required - please run this SQL in Supabase:');
            console.log(`
              ALTER TABLE videos ALTER COLUMN user_id DROP NOT NULL;
              ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_user_id_fkey;
              ALTER TABLE videos ADD CONSTRAINT videos_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
            `);
          } else {
            console.log('✅ Foreign key constraint updated successfully');
          }
        } else {
          console.log('✅ user_id column made nullable successfully');
        }
      } else if (error.code === '23503') {
        console.log('🔧 Foreign key constraint violation - user_id must reference existing user');
        console.log('⚠️ Manual intervention required - please run this SQL in Supabase:');
        console.log(`
          ALTER TABLE videos ALTER COLUMN user_id DROP NOT NULL;
          ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_user_id_fkey;
          ALTER TABLE videos ADD CONSTRAINT videos_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        `);
      }
    } else {
      console.log('✅ Video inserted successfully without user_id');
      console.log('🎯 The constraint is already fixed!');
      
      // Clean up test record
      await supabase
        .from('videos')
        .delete()
        .eq('id', testVideoId);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixForeignKeyConstraint()
  .then(() => {
    console.log('🏁 Constraint fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Constraint fix failed:', error);
    process.exit(1);
  }); 