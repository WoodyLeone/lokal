const { Pool } = require('pg');

async function fixVideosSchema() {
  console.log('🔧 Fixing videos table schema...');
  
  // Use the Railway database URL from environment
  const databaseUrl = 'postgresql://postgres:olgtwNjDXPQbkNNuknFliLTK@postgres.railway.internal:5432/railway';
  
  if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables');
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Add missing status column
    await pool.query(`
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'uploaded'
    `);
    
    console.log('✅ Added status column to videos table');
    
    // Add other missing columns that might be needed
    await pool.query(`
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending'
    `);
    
    await pool.query(`
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS pipeline_results JSONB
    `);
    
    console.log('✅ Added processing_status and pipeline_results columns');
    
    // Check current schema
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current videos table schema:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
  } finally {
    await pool.end();
  }
}

fixVideosSchema(); 