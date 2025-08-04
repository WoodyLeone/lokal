const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSystemUser() {
  console.log('🔧 Creating system user for backend video operations...');
  
  const systemUserId = '00000000-0000-0000-0000-000000000000';
  const systemUserEmail = 'system@lokal.app';
  
  try {
    // Use raw SQL to create system user
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Check if system user already exists
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${systemUserId}') THEN
            -- Insert system user
            INSERT INTO auth.users (
              id, email, email_confirmed_at, created_at, updated_at,
              raw_app_meta_data, raw_user_meta_data, is_super_admin,
              encrypted_password, email_change_confirm_status, banned_until,
              confirmation_sent_at, confirmation_token, email_change,
              email_change_token_new, recovery_sent_at, recovery_token,
              reauthentication_sent_at, reauthentication_token, last_sign_in_at,
              phone, phone_confirmed_at, phone_change, phone_change_token,
              email_change_token_current, aud, role
            ) VALUES (
              '${systemUserId}', '${systemUserEmail}', NOW(), NOW(), NOW(),
              '{"provider": "system", "providers": ["system"]}'::jsonb,
              '{"username": "system"}'::jsonb, false, null, 0, null,
              null, null, null, null, null, null, null, null, null,
              null, null, null, null, null, 'authenticated', 'authenticated'
            );
            
            -- Create profile for system user
            INSERT INTO profiles (id, username, created_at, updated_at)
            VALUES ('${systemUserId}', 'system', NOW(), NOW());
            
            RAISE NOTICE 'System user created successfully';
          ELSE
            RAISE NOTICE 'System user already exists';
          END IF;
        END $$;
      `
    });
    
    if (error) {
      console.error('❌ Error creating system user:', error);
      
      // Try alternative approach - just create the profile
      console.log('🔄 Trying alternative approach - creating profile only...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: systemUserId,
          username: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
      } else {
        console.log('✅ System user profile created/updated:', profile);
      }
      
      return;
    }
    
    console.log('✅ System user created successfully');
    console.log('🎯 This user ID can now be used for backend video insertions');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSystemUser()
  .then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 