const { Pool } = require('pg');

async function fixSchema() {
  console.log('🔧 Fixing Railway database schema...');
  
  // Railway database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  try {
    // Add email_verified column if it doesn't exist
    try {
      await client.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false');
      console.log('✅ Added email_verified column to users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ email_verified column already exists');
      } else {
        console.error('❌ Error adding email_verified column:', error.message);
      }
    }

    // Create verification_tokens table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ verification_tokens table created/verified');

    // Create refresh_tokens table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ refresh_tokens table created/verified');

    // Verify the schema
    const result = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'verification_tokens', 'refresh_tokens')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('\n📊 Database Schema Summary:');
    console.log('==========================');
    result.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    console.log('\n✅ Railway database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema().catch(console.error); 