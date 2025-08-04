const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSystemUser() {
  console.log('🔧 Creating system user for backend video operations...');
  
  const systemUserId = '00000000-0000-0000-0000-000000000000';
  const systemUserEmail = 'system@lokal.app';
  
  try {
    // Check if system user already exists in auth.users
    const { data: existingUser, error: checkError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', systemUserId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing system user:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ System user already exists:', existingUser.email);
      return;
    }
    
    // Create system user in auth.users table
    const { data: newUser, error: insertError } = await supabase
      .from('auth.users')
      .insert({
        id: systemUserId,
        email: systemUserEmail,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        raw_app_meta_data: JSON.stringify({ provider: 'system', providers: ['system'] }),
        raw_user_meta_data: JSON.stringify({ username: 'system' }),
        is_super_admin: false,
        encrypted_password: null,
        email_change_confirm_status: 0,
        banned_until: null,
        confirmation_sent_at: null,
        confirmation_token: null,
        email_change: null,
        email_change_token_new: null,
        recovery_sent_at: null,
        recovery_token: null,
        reauthentication_sent_at: null,
        reauthentication_token: null,
        last_sign_in_at: null,
        phone: null,
        phone_confirmed_at: null,
        phone_change: null,
        phone_change_token: null,
        email_change_token_current: null,
        email_change_confirm_status: 0,
        aud: 'authenticated',
        role: 'authenticated'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating system user:', insertError);
      return;
    }
    
    console.log('✅ System user created successfully:', newUser);
    console.log('🎯 This user ID can now be used for backend video insertions');
    
    // Also create a profile for the system user
    console.log('🔧 Creating system user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: systemUserId,
        username: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('⚠️ Error creating system user profile:', profileError);
    } else {
      console.log('✅ System user profile created:', profile);
    }
    
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