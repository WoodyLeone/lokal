const { Pool } = require('pg');

// Railway database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Railway database schema...');
    
    // Add email_verified column to users table if it doesn't exist
    try {
      await client.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'email_verified'
            ) THEN
                ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
                RAISE NOTICE 'Added email_verified column to users table';
            ELSE
                RAISE NOTICE 'email_verified column already exists in users table';
            END IF;
        END $$;
      `);
      console.log('✅ email_verified column check completed');
    } catch (error) {
      console.error('❌ Error adding email_verified column:', error.message);
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

    // Create profiles table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ profiles table created/verified');

    // Create videos table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        duration INTEGER,
        detected_objects JSONB,
        products JSONB,
        status VARCHAR(50) DEFAULT 'uploaded',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ videos table created/verified');

    // Create product_matches table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_matches (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        detected_object VARCHAR(255) NOT NULL,
        confidence_score DECIMAL(3,2),
        bounding_box JSONB,
        matched_product_id VARCHAR(255),
        match_type VARCHAR(50),
        ai_suggestions JSONB,
        user_selection BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ product_matches table created/verified');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON verification_tokens(token_hash)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at)');
    console.log('✅ Indexes created/verified');

    // Verify the schema
    const result = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'verification_tokens', 'refresh_tokens', 'profiles', 'videos', 'product_matches')
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