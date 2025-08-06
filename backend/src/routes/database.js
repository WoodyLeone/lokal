const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');
const authService = require('../services/authService');
const emailService = require('../services/emailService');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
router.get('/test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    res.json({
      success: true,
      data: {
        current_time: result.rows[0].current_time,
        version: result.rows[0].version
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check user password hash
router.get('/debug/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Authentication endpoints
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Create user using auth service
    const user = await authService.createUser(email, password, username);
    
    // Create profile
    await pool.query(
      `INSERT INTO profiles (id, username) 
       VALUES ($1, $2)`,
      [user.id, username]
    );
    
    // Generate simple token (use proper JWT in production)
    const token = Buffer.from(JSON.stringify({
      userId: userResult.rows[0].id,
      email: userResult.rows[0].email,
      username: userResult.rows[0].username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        session: { access_token: token }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Email verification endpoints for streamlined auth
router.post('/auth/email-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address required'
      });
    }
    
    // Check if user exists
    let user = await authService.getUserByEmail(email);
    
    if (!user) {
      // Create new user with email only (no password)
      user = await authService.createUserWithEmail(email);
    }
    
    // Generate verification token
    const verificationToken = authService.generateVerificationToken(user);
    
    // Store verification token
    await authService.storeVerificationToken(user.id, verificationToken);
    
    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(email, verificationToken);
    
    if (!emailSent) {
      console.warn('⚠️ Failed to send verification email, but continuing with token generation');
    }
    
    res.json({
      success: true,
      data: {
        message: 'Verification email sent',
        email: email,
        emailSent: emailSent
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token required'
      });
    }
    
    // Verify token and get user
    const user = await authService.verifyEmailToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
    
    // Generate authentication tokens
    const accessToken = authService.generateAccessToken(user);
    const { refreshToken, tokenHash } = authService.generateRefreshToken(user);
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await authService.storeRefreshToken(user.id, tokenHash, expiresAt);
    
    // Mark email as verified
    await authService.markEmailVerified(user.id);
    
    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.username);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at
        },
        session: { 
          access_token: accessToken,
          refresh_token: refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verify credentials using auth service
    const user = await authService.verifyCredentials(email, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate tokens
    const accessToken = authService.generateAccessToken(user);
    const { refreshToken, tokenHash } = authService.generateRefreshToken(user);
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await authService.storeRefreshToken(user.id, tokenHash, expiresAt);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at
        },
        session: { 
          access_token: accessToken,
          refresh_token: refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/auth/signout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // Revoke refresh token if provided
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await authService.revokeRefreshToken(tokenHash);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    res.json({ success: true }); // Always return success
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    // Verify access token
    const payload = authService.verifyAccessToken(token);
    
    // Get user from database
    const user = await authService.getUserById(payload.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh token endpoint
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    const payload = await authService.verifyRefreshToken(refresh_token);
    
    // Get user
    const user = await authService.getUserById(payload.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Generate new tokens
    const accessToken = authService.generateAccessToken(user);
    const { refreshToken: newRefreshToken, tokenHash } = authService.generateRefreshToken(user);
    
    // Store new refresh token and revoke old one
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await authService.storeRefreshToken(user.id, tokenHash, expiresAt);
    
    // Revoke old refresh token
    const oldTokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    await authService.revokeRefreshToken(oldTokenHash);
    
    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Helper function to validate video URL with whitelist approach
function isValidVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check for invalid URL patterns (blacklist)
  const invalidPatterns = [
    /^demo:\/\//, // demo:// protocol
    /^example\.com/, // example.com domain
    /^sample-videos\.com/, // sample-videos.com domain (not accessible)
    /^https?:\/\/localhost/, // localhost URLs
    /^https?:\/\/127\.0\.0\.1/, // localhost IP
    /^file:\/\//, // file:// protocol (not accessible from mobile)
    /^https?:\/\/example\.com/, // example.com with protocol
    /^https?:\/\/.*\.example\.com/, // any example.com subdomain
    /^https?:\/\/.*sample-videos\.com/, // any sample-videos.com subdomain
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Only allow known good video hosting domains (whitelist approach)
    const allowedDomains = [
      'commondatastorage.googleapis.com', // Google Cloud Storage
      'storage.googleapis.com', // Google Cloud Storage
      'cdn.jsdelivr.net', // CDN
      'github.com', // GitHub raw files
      'raw.githubusercontent.com', // GitHub raw files
      'vimeo.com', // Vimeo
      'player.vimeo.com', // Vimeo player
      'youtube.com', // YouTube
      'youtu.be', // YouTube short links
      'dropbox.com', // Dropbox
      'dl.dropboxusercontent.com', // Dropbox direct links
      'assets.mixkit.co', // Mixkit free videos
      'videos.pexels.com', // Pexels videos
      'pixabay.com', // Pixabay videos
      'coverr.co', // Coverr videos
      's3.amazonaws.com', // AWS S3
      'amazonaws.com', // AWS general
    ];
    
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    return isAllowed;
  } catch {
    return false;
  }
}

// Video endpoints
router.get('/videos', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = 'SELECT * FROM videos ORDER BY created_at DESC';
    let params = [];
    
    if (userId) {
      query = 'SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC';
      params = [userId];
    }
    
    const result = await pool.query(query, params);
    
    // Filter out videos with invalid URLs
    const validVideos = result.rows.filter(video => {
      const isValid = isValidVideoUrl(video.video_url);
      if (!isValid) {
        console.warn(`Filtering out video with invalid URL: ${video.video_url}`);
      }
      return isValid;
    });
    
    res.json({
      success: true,
      data: validVideos
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM videos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    const video = result.rows[0];
    
    // Check if video URL is valid
    if (!isValidVideoUrl(video.video_url)) {
      return res.status(400).json({
        success: false,
        error: 'Video has invalid URL'
      });
    }
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/videos', async (req, res) => {
  try {
    const { user_id, title, description, video_url, thumbnail_url, duration, detected_objects, products } = req.body;
    
    const result = await pool.query(
      `INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, detected_objects, products) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [user_id, title, description, video_url, thumbnail_url, duration, detected_objects, JSON.stringify(products)]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    values.push(id);
    const query = `
      UPDATE videos 
      SET ${setClauses.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM videos WHERE id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Product endpoints
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Profile endpoints
router.get('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    values.push(userId);
    const query = `
      UPDATE profiles 
      SET ${setClauses.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Product matching endpoints
router.post('/product-matches', async (req, res) => {
  try {
    const { video_id, detected_object, confidence_score, bounding_box, matched_product_id, match_type, ai_suggestions, user_selection, created_at } = req.body;
    
    const result = await pool.query(
      `INSERT INTO product_matches (
        video_id, detected_object, confidence_score, bounding_box, 
        matched_product_id, match_type, ai_suggestions, user_selection, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        video_id,
        detected_object,
        confidence_score,
        JSON.stringify(bounding_box),
        matched_product_id,
        match_type,
        JSON.stringify(ai_suggestions),
        user_selection,
        created_at
      ]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Save product match error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/product-matches', async (req, res) => {
  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'videoId is required'
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM product_matches WHERE video_id = $1 ORDER BY created_at DESC',
      [videoId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get product matches error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database setup endpoint to initialize tables
router.post('/setup', async (req, res) => {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Create users table with email_verified column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        username VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add email_verified column if it doesn't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false');
      console.log('✅ Added email_verified column to users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ email_verified column already exists');
      } else {
        throw error;
      }
    }

    // Create refresh_tokens table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create verification_tokens table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create profiles table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create videos table if it doesn't exist
    await pool.query(`
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

    // Create product_matches table if it doesn't exist
    await pool.query(`
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

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON verification_tokens(token_hash)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at)');

    console.log('✅ Database setup completed successfully');
    
    res.json({
      success: true,
      message: 'Database tables initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Quick schema fix endpoint
router.post('/fix-schema', async (req, res) => {
  try {
    console.log('🔧 Quick schema fix...');
    
    // Add email_verified column if it doesn't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false');
      console.log('✅ Added email_verified column to users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ email_verified column already exists');
      } else {
        throw error;
      }
    }

    // Create verification_tokens table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Quick schema fix completed');
    
    res.json({
      success: true,
      message: 'Schema fixed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Schema fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple schema fix endpoint (GET method for easy testing)
router.get('/fix-schema', async (req, res) => {
  try {
    console.log('🔧 Quick schema fix (GET)...');
    
    // Add email_verified column if it doesn't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false');
      console.log('✅ Added email_verified column to users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ email_verified column already exists');
      } else {
        throw error;
      }
    }

    // Create verification_tokens table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Quick schema fix completed');
    
    res.json({
      success: true,
      message: 'Schema fixed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Schema fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 