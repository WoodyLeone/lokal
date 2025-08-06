/**
 * Database Migration Script
 * Sets up all required tables for the Lokal application
 */

const databaseManager = require('./database');
const logger = require('winston');

class DatabaseMigrations {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize migrations
   */
  async initialize() {
    try {
      await databaseManager.initialize();
      this.pool = databaseManager.getPool();
      logger.info('Database migrations initialized');
    } catch (error) {
      logger.error('Failed to initialize database migrations:', error);
      throw error;
    }
  }

  /**
   * Run all migrations
   */
  async runMigrations() {
    try {
      logger.info('Starting database migrations...');

      // Create users table
      await this.createUsersTable();
      
      // Create refresh_tokens table
      await this.createRefreshTokensTable();
      
      // Create videos table
      await this.createVideosTable();
      
      // Create products table
      await this.createProductsTable();
      
      // Create video_products table (junction table)
      await this.createVideoProductsTable();
      
      // Create indexes
      await this.createIndexes();

      logger.info('All database migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Create users table
   */
  async createUsersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await this.pool.query(query);
    logger.info('Users table created/verified');
  }

  /**
   * Create refresh_tokens table
   */
  async createRefreshTokensTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, token_hash)
      );
    `;
    
    await this.pool.query(query);
    logger.info('Refresh tokens table created/verified');
  }

  /**
   * Create videos table
   */
  async createVideosTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS videos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        duration DECIMAL(10,2),
        width INTEGER,
        height INTEGER,
        status VARCHAR(50) DEFAULT 'uploaded',
        processing_status VARCHAR(50) DEFAULT 'pending',
        detection_results JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await this.pool.query(query);
    logger.info('Videos table created/verified');
  }

  /**
   * Create products table
   */
  async createProductsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'USD',
        image_url VARCHAR(500),
        product_url VARCHAR(500),
        category VARCHAR(100),
        brand VARCHAR(100),
        sku VARCHAR(100),
        barcode VARCHAR(100),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await this.pool.query(query);
    logger.info('Products table created/verified');
  }

  /**
   * Create video_products junction table
   */
  async createVideoProductsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS video_products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        confidence_score DECIMAL(5,4),
        bounding_box JSONB,
        timestamp DECIMAL(10,2),
        detection_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(video_id, product_id, timestamp)
      );
    `;
    
    await this.pool.query(query);
    logger.info('Video products table created/verified');
  }

  /**
   * Create indexes for better performance
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)',
      'CREATE INDEX IF NOT EXISTS idx_video_products_video_id ON video_products(video_id)',
      'CREATE INDEX IF NOT EXISTS idx_video_products_product_id ON video_products(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_video_products_confidence ON video_products(confidence_score)'
    ];

    for (const indexQuery of indexes) {
      try {
        await this.pool.query(indexQuery);
      } catch (error) {
        logger.warn(`Failed to create index: ${indexQuery}`, error.message);
      }
    }
    
    logger.info('All indexes created/verified');
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
    await databaseManager.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const migrations = new DatabaseMigrations();
  
  migrations.initialize()
    .then(() => migrations.runMigrations())
    .then(() => {
      logger.info('Migrations completed successfully');
      return migrations.close();
    })
    .then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseMigrations; 