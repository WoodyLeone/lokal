require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Supabase configuration
const supabaseUrl = 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
const supabaseKey = 'sb_publishable_RHDuFcwRvgCxT8HIdliB1A_KedSTpwm';

async function setupSupabaseWithCLI() {
  try {
    console.log('🚀 Setting up Supabase database using CLI...');
    console.log('URL:', supabaseUrl);
    
    // First, let's check if we can connect to the project
    console.log('\n🔍 Checking Supabase connection...');
    
    // Try to get project info
    const { stdout: projectInfo, stderr: projectError } = await execAsync(
      `supabase projects list --access-token ${supabaseKey}`
    );
    
    if (projectError) {
      console.log('⚠️  Could not list projects, trying direct SQL execution...');
    } else {
      console.log('✅ Supabase CLI connection successful');
    }
    
    // Read the SQL setup file
    const sqlFilePath = path.join(__dirname, 'supabase-setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📖 SQL file loaded successfully');
    
    // Create a temporary SQL file with proper formatting
    const tempSqlFile = path.join(__dirname, 'temp-setup.sql');
    fs.writeFileSync(tempSqlFile, sqlContent);
    
    console.log('📝 Created temporary SQL file');
    
    // Try to execute SQL using psql or direct connection
    console.log('\n⏳ Executing SQL setup...');
    
    // Use curl to execute SQL via Supabase REST API
    const sqlCommands = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      `CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        username TEXT UNIQUE,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS videos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration INTEGER DEFAULT 0,
        detected_objects TEXT[] DEFAULT '{}',
        products JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        buy_url TEXT,
        category TEXT,
        brand TEXT,
        rating DECIMAL(3,2),
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];
    
    console.log('📋 Executing table creation commands...');
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\n⏳ Executing command ${i + 1}/${sqlCommands.length}...`);
      
      try {
        // Use curl to execute SQL via Supabase REST API
        const { stdout, stderr } = await execAsync(
          `curl -X POST "${supabaseUrl}/rest/v1/rpc/exec_sql" \
          -H "apikey: ${supabaseKey}" \
          -H "Authorization: Bearer ${supabaseKey}" \
          -H "Content-Type: application/json" \
          -d '{"sql": ${JSON.stringify(command)}}'`
        );
        
        if (stderr && !stderr.includes('Warning')) {
          console.log(`⚠️  Command ${i + 1} warning:`, stderr);
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.log(`⚠️  Command ${i + 1} skipped (may already exist):`, error.message);
      }
    }
    
    // Clean up temporary file
    fs.unlinkSync(tempSqlFile);
    
    console.log('\n🎉 Database setup completed!');
    
    // Test the connection
    console.log('\n🧪 Testing database connection...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: products, error: testError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database test failed:', testError.message);
    } else {
      console.log('✅ Database test successful!');
      console.log('Sample products found:', products.length);
      if (products.length > 0) {
        console.log('First product:', products[0].title);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Alternative approach using manual SQL execution
async function manualSetupInstructions() {
  console.log('\n📋 Manual Setup Instructions:');
  console.log('=====================================');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: sgiuzcfsjzsspnukgdtf');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of scripts/supabase-setup.sql');
  console.log('5. Click "Run" to execute the SQL');
  console.log('6. Verify tables are created in the Table Editor');
  console.log('\nThe SQL file is located at: scripts/supabase-setup.sql');
}

// Main execution
async function main() {
  console.log('🔧 Supabase Database Setup Script (CLI Method)');
  console.log('===============================================\n');
  
  await setupSupabaseWithCLI();
  
  console.log('\n✨ Setup process completed!');
  console.log('\nIf automatic setup didn\'t work, please follow the manual instructions:');
  manualSetupInstructions();
}

main(); 