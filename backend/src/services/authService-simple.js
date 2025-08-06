const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class SimpleAuthService {
  constructor() {
    // Secure JWT secrets with fallbacks
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
    this.refreshSecret = process.env.REFRESH_SECRET || this.generateSecureSecret();
    this.accessTokenExpiry = '15m'; // 15 minutes
    this.refreshTokenExpiry = '7d'; // 7 days
    
    // In-memory storage for demo purposes
    this.users = new Map();
    this.refreshTokens = new Map();
    
    // Log configuration status
    console.log('🔐 SimpleAuthService initialized (no external database)');
    console.log(`🔑 JWT Secret: ${this.jwtSecret ? 'Configured' : 'Generated fallback'}`);
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

    // Store refresh token hash in memory
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    this.refreshTokens.set(tokenHash, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
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

      // Check if refresh token is in memory
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const storedToken = this.refreshTokens.get(tokenHash);
      
      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Refresh token expired or not found');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(userId, tokenHash, expiresAt) {
    this.refreshTokens.set(tokenHash, {
      userId,
      expiresAt: new Date(expiresAt)
    });
    return true;
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenHash) {
    this.refreshTokens.delete(tokenHash);
    return true;
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId) {
    for (const [tokenHash, token] of this.refreshTokens.entries()) {
      if (token.userId === userId) {
        this.refreshTokens.delete(tokenHash);
      }
    }
    return true;
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens() {
    const now = new Date();
    for (const [tokenHash, token] of this.refreshTokens.entries()) {
      if (token.expiresAt < now) {
        this.refreshTokens.delete(tokenHash);
      }
    }
    return true;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    return this.users.get(userId) || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  /**
   * Create user
   */
  async createUser(email, password, username) {
    const userId = crypto.randomUUID();
    const hashedPassword = await this.hashPassword(password);
    
    const user = {
      id: userId,
      email,
      username,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
      email_verified: false
    };
    
    this.users.set(userId, user);
    return user;
  }

  /**
   * Create user with email only (for demo)
   */
  async createUserWithEmail(email) {
    const userId = crypto.randomUUID();
    
    const user = {
      id: userId,
      email,
      username: email.split('@')[0],
      created_at: new Date(),
      updated_at: new Date(),
      email_verified: true // Auto-verify for demo
    };
    
    this.users.set(userId, user);
    return user;
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
      { expiresIn: '24h' }
    );
  }

  /**
   * Store verification token
   */
  async storeVerificationToken(userId, token) {
    // In-memory storage for demo
    this.users.get(userId).verificationToken = token;
    return true;
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

      const user = await this.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid verification token');
    }
  }

  /**
   * Mark email as verified
   */
  async markEmailVerified(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.email_verified = true;
      user.updated_at = new Date();
      delete user.verificationToken;
    }
    return true;
  }

  /**
   * Verify credentials
   */
  async verifyCredentials(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password);
    return isValid ? user : null;
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hashedPassword) {
    const hash = await this.hashPassword(password);
    return hash === hashedPassword;
  }

  /**
   * Initialize tables (no-op for simple service)
   */
  async initializeTables() {
    console.log('📋 SimpleAuthService: No database tables to initialize');
    return true;
  }

  /**
   * Close connections (no-op for simple service)
   */
  async close() {
    console.log('🔒 SimpleAuthService: No connections to close');
    return true;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: true,
      users: this.users.size,
      refreshTokens: this.refreshTokens.size,
      jwtSecret: !!this.jwtSecret,
      refreshSecret: !!this.refreshSecret
    };
  }
}

// Create and export singleton instance
const simpleAuthService = new SimpleAuthService();

module.exports = simpleAuthService; 