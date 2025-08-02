const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

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
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Hash password using SHA-256 to match existing database
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, username) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, username, created_at`,
      [email, hashedPassword, username]
    );
    
    // Create profile
    await pool.query(
      `INSERT INTO profiles (id, username) 
       VALUES ($1, $2)`,
      [userResult.rows[0].id, username]
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

router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user
    const userResult = await pool.query(
      'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify password using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    if (hashedPassword !== user.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at
        },
        session: { access_token: token }
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
  // For JWT, just return success (client should remove token)
  res.json({ success: true });
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
    
    // Decode token (use proper JWT verification in production)
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    const userResult = await pool.query(
      'SELECT id, email, username, created_at FROM users WHERE id = $1',
      [payload.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: userResult.rows[0]
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
    res.json({
      success: true,
      data: result.rows
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
    
    res.json({
      success: true,
      data: result.rows[0]
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

module.exports = router; 