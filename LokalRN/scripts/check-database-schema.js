const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Get all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.log('⚠️ Could not get tables via RPC, trying direct query...');
      
      // Try a direct query to get table information
      const { data: tableInfo, error: infoError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');
      
      if (infoError) {
        console.error('❌ Error getting table info:', infoError);
        return;
      }
      
      console.log('📋 Tables in public schema:');
      tableInfo.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      
      // Check for auth.users table
      const { data: authTables, error: authError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'auth');
      
      if (!authError && authTables) {
        console.log('📋 Tables in auth schema:');
        authTables.forEach(table => {
          console.log(`  - ${table.table_schema}.${table.table_name}`);
        });
      }
      
    } else {
      console.log('📋 Tables found:', tables);
    }
    
    // Try to check videos table structure
    console.log('\n🔍 Checking videos table structure...');
    const { data: videoColumns, error: videoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'videos')
      .eq('table_schema', 'public');
    
    if (videoError) {
      console.error('❌ Error getting videos table structure:', videoError);
    } else {
      console.log('📋 Videos table columns:');
      videoColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseSchema()
  .then(() => {
    console.log('🏁 Schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema check failed:', error);
    process.exit(1);
  }); 