const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');

class AuthService {
  constructor() {
    // Initialize database connection with error handling
    this.pool = null;
    this.initializeDatabase();
    
    // Secure JWT secrets with fallbacks
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
    this.refreshSecret = process.env.REFRESH_SECRET || this.generateSecureSecret();
    this.accessTokenExpiry = '15m'; // 15 minutes
    this.refreshTokenExpiry = '7d'; // 7 days
    
    // Log configuration status
    console.log('🔐 AuthService initialized with Railway PostgreSQL');
    console.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`🔑 JWT Secret: ${this.jwtSecret ? 'Configured' : 'Generated fallback'}`);
    console.log(`🔧 Database Pool: ${this.pool ? 'Available' : 'Not available'}`);
  }

  /**
   * Initialize database connection with error handling
   */
  initializeDatabase() {
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      if (!databaseUrl || databaseUrl === 'undefined' || databaseUrl === 'null') {
        console.warn('⚠️ DATABASE_URL not configured, AuthService will use fallback mode');
        this.pool = null;
        return;
      }

      console.log('🔧 Attempting to create database pool with URL:', databaseUrl.substring(0, 20) + '...');
      
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      });
    } catch (error) {
      console.error('Failed to initialize AuthService database connection:', error);
      this.pool = null;
    }
  }

  /**
   * Generate secure secret for JWT
   */
  generateSecureSecret() {
    const secret = crypto.randomBytes(64).toString('hex');
    console.warn('⚠️ Using generated JWT secret. Set JWT_SECRET and REFRESH_SECRET environment variables for production.');
    return secret;
  }

  /**
   * Generate access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        type: 'access'
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      this.refreshSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    // Store refresh token hash in database
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    return { refreshToken, tokenHash };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token is in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await this.pool.query(
        'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2 AND expires_at > NOW()',
        [tokenHash, decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Refresh token not found or expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(userId, tokenHash, expiresAt) {
    try {
      await this.pool.query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [userId, tokenHash, expiresAt]
      );
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenHash) {
    try {
      await this.pool.query(
        'DELETE FROM refresh_tokens WHERE token_hash = $1',
        [tokenHash]
      );
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId) {
    try {
      await this.pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      const result = await this.pool.query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
      );
      console.log(`🧹 Cleaned up ${result.rowCount} expired tokens`);
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      if (!this.pool) {
        console.warn('Database not available, returning null for getUserById');
        return null;
      }
      
      const result = await this.pool.query(
        'SELECT id, email, username, created_at FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      if (!this.pool) {
        console.warn('Database not available, returning null for getUserByEmail');
        return null;
      }
      
      const result = await this.pool.query(
        'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  /**
   * Create new user
   */
  async createUser(email, password, username) {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      // Create user
      const result = await this.pool.query(
        'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
        [email, passwordHash, username]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Create user with email only (for streamlined auth)
   */
  async createUserWithEmail(email) {
    try {
      if (!this.pool) {
        console.warn('Database not available, creating mock user for createUserWithEmail');
        // Return a mock user when database is not available
        return {
          id: `mock-user-${Date.now()}`,
          email: email,
          username: email.split('@')[0],
          created_at: new Date().toISOString()
        };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return existingUser;
      }

      // Generate username from email with fallback for duplicates
      let username = email.split('@')[0];
      let counter = 1;
      let finalUsername = username;
      
      // Check if username exists and generate a unique one
      while (true) {
        const existingUser = await this.pool.query(
          'SELECT id FROM users WHERE username = $1',
          [finalUsername]
        );
        
        if (existingUser.rows.length === 0) {
          break; // Username is available
        }
        
        finalUsername = `${username}${counter}`;
        counter++;
      }

      // Create user with temporary password hash (will be updated after email verification)
      const tempPasswordHash = crypto.createHash('sha256').update(email + Date.now()).digest('hex');
      const result = await this.pool.query(
        'INSERT INTO users (email, username, password_hash, email_verified) VALUES ($1, $2, $3, false) RETURNING id, email, username, created_at',
        [email, finalUsername, tempPasswordHash]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user with email:', error);
      throw error;
    }
  }

  /**
   * Generate verification token
   */
  generateVerificationToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'verification'
      },
      this.jwtSecret,
      { expiresIn: '1h' } // 1 hour expiry
    );
  }

  /**
   * Store verification token
   */
  async storeVerificationToken(userId, token) {
    try {
      if (!this.pool) {
        console.warn('Database not available, skipping verification token storage');
        return;
      }
      
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
      
      await this.pool.query(
        'INSERT INTO verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3',
        [userId, tokenHash, expiresAt]
      );
    } catch (error) {
      console.error('Error storing verification token:', error);
      throw error;
    }
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'verification') {
        throw new Error('Invalid token type');
      }

      if (!this.pool) {
        console.warn('Database not available, returning mock user for token verification');
        // Return a mock user when database is not available
        return {
          id: decoded.userId,
          email: decoded.email,
          username: decoded.email ? decoded.email.split('@')[0] : 'user',
          created_at: new Date().toISOString()
        };
      }

      // Check if verification token exists and is not expired
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await this.pool.query(
        'SELECT * FROM verification_tokens WHERE token_hash = $1 AND user_id = $2 AND expires_at > NOW()',
        [tokenHash, decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Verification token not found or expired');
      }

      // Get user
      const user = await this.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error verifying email token:', error);
      return null;
    }
  }

  /**
   * Mark email as verified
   */
  async markEmailVerified(userId) {
    try {
      if (!this.pool) {
        console.warn('Database not available, skipping email verification update');
        return;
      }
      
      await this.pool.query(
        'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      
      // Clean up verification token
      await this.pool.query(
        'DELETE FROM verification_tokens WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error marking email verified:', error);
      throw error;
    }
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }

      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password_hash !== passwordHash) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return null;
    }
  }

  /**
   * Initialize database tables
   */
  async initializeTables() {
    try {
      console.log('🔧 Initializing auth tables...');
      
      if (!this.pool) {
        console.log('⚠️ Database not available, skipping auth table initialization');
        return;
      }
      
      // Create users table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          username VARCHAR(255) UNIQUE NOT NULL,
          email_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create refresh_tokens table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create verification_tokens table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS verification_tokens (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)
      `);
      
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON verification_tokens(token_hash)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at)
      `);

      console.log('✅ Auth tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing auth tables:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      await this.pool.end();
      console.log('🔒 AuthService database connection closed');
    } catch (error) {
      console.error('Error closing auth service connection:', error);
    }
  }
}

module.exports = new AuthService(); 