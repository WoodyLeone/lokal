import { 
  executeQuery, 
  executeTransaction, 
  isDatabaseConfigured 
} from '../config/database';
import { 
  Video, 
  Product, 
  Profile, 
  VideoFrontend, 
  ProductFrontend, 
  AuthResponse,
  UserSession 
} from '../types';
import { DemoAuthService } from './demoAuth';
import { isDemoMode } from '../config/env';

// Helper function to convert database format to frontend format
const convertVideoToFrontend = (video: Video): VideoFrontend => ({
  id: video.id,
  userId: video.user_id,
  title: video.title,
  description: video.description,
  videoUrl: video.video_url,
  thumbnailUrl: video.thumbnail_url,
  duration: video.duration,
  detectedObjects: video.detected_objects,
  products: video.products.map(convertProductToFrontend),
  createdAt: video.created_at,
  updatedAt: video.updated_at,
});

const convertProductToFrontend = (product: Product): ProductFrontend => ({
  id: product.id,
  title: product.title,
  description: product.description,
  imageUrl: product.image_url,
  price: product.price,
  currency: product.currency,
  buyUrl: product.buy_url,
  category: product.category,
  brand: product.brand,
  rating: product.rating,
  reviewCount: product.review_count,
  createdAt: product.created_at,
});

export class DatabaseService {
  // Authentication (using JWT tokens instead of Supabase auth)
  static async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.signUp(email, password, username);
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      // Hash password (you should use bcrypt in production)
      const hashedPassword = await this.hashPassword(password);
      
      // Check if user already exists
      const existingUser = await executeQuery(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.data && existingUser.data.length > 0) {
        return { data: null, error: { message: 'User already exists' } };
      }
      
      // Create user
      const userResult = await executeQuery(
        `INSERT INTO users (email, password_hash, username) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, username, created_at`,
        [email, hashedPassword, username]
      );
      
      if (userResult.error) {
        return { data: null, error: userResult.error };
      }
      
      // Create profile
      const profileResult = await executeQuery(
        `INSERT INTO profiles (id, username) 
         VALUES ($1, $2) 
         RETURNING *`,
        [userResult.data[0].id, username]
      );
      
      if (profileResult.error) {
        return { data: null, error: profileResult.error };
      }
      
      // Generate JWT token
      const token = await this.generateJWT(userResult.data[0]);
      
      return { 
        data: { 
          user: userResult.data[0], 
          session: { access_token: token } 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : { message: 'Sign up failed' } };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔧 DatabaseService.signIn called');
    console.log('🔧 Demo mode check:', isDemoMode());
    
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      console.log('🔧 Using demo auth service');
      return DemoAuthService.signIn(email, password);
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      // Get user with password hash
      const userResult = await executeQuery(
        'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.error || !userResult.data || userResult.data.length === 0) {
        return { data: null, error: { message: 'Invalid credentials' } };
      }
      
      const user = userResult.data[0];
      
      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return { data: null, error: { message: 'Invalid credentials' } };
      }
      
      // Generate JWT token
      const token = await this.generateJWT(user);
      
      return { 
        data: { 
          user: { 
            id: user.id, 
            email: user.email, 
            username: user.username,
            created_at: user.created_at 
          }, 
          session: { access_token: token } 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : { message: 'Sign in failed' } };
    }
  }

  static async signOut(): Promise<{ error: any }> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.signOut();
    }
    
    // For JWT, we just return success (client should remove token)
    return { error: null };
  }

  static async getCurrentUser(): Promise<UserSession> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.getCurrentUser();
    }
    
    // This would need to be implemented with JWT token validation
    // For now, return null (you'll need to implement token validation)
    return { user: null, session: null };
  }

  // Video operations
  static async createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        `INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, detected_objects, products) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          video.user_id,
          video.title,
          video.description,
          video.video_url,
          video.thumbnail_url,
          video.duration,
          video.detected_objects,
          JSON.stringify(video.products)
        ]
      );

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertVideoToFrontend(result.data[0]) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getVideos(userId?: string): Promise<{ data: VideoFrontend[] | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      let query = 'SELECT * FROM videos ORDER BY created_at DESC';
      let params: any[] = [];

      if (userId) {
        query = 'SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC';
        params = [userId];
      }

      const result = await executeQuery(query, params);
      
      if (result.error) {
        return { data: null, error: result.error };
      }

      const frontendVideos = result.data ? result.data.map(convertVideoToFrontend) : [];
      return { data: frontendVideos, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getVideo(id: string): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        'SELECT * FROM videos WHERE id = $1',
        [id]
      );

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertVideoToFrontend(result.data[0]) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async updateVideo(id: string, updates: Partial<Video>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (setClauses.length === 0) {
        return { data: null, error: { message: 'No valid fields to update' } };
      }

      values.push(id);
      const query = `
        UPDATE videos 
        SET ${setClauses.join(', ')}, updated_at = NOW() 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;

      const result = await executeQuery(query, values);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertVideoToFrontend(result.data[0]) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async deleteVideo(id: string): Promise<{ error: any }> {
    if (!isDatabaseConfigured()) {
      return { error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        'DELETE FROM videos WHERE id = $1',
        [id]
      );

      return { error: result.error };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  // Product operations
  static async getProducts(): Promise<{ data: ProductFrontend[] | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        'SELECT * FROM products ORDER BY created_at DESC'
      );

      if (result.error) {
        return { data: null, error: result.error };
      }

      const frontendProducts = result.data ? result.data.map(convertProductToFrontend) : [];
      return { data: frontendProducts, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getProduct(id: string): Promise<{ data: ProductFrontend | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertProductToFrontend(result.data[0]) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  // Profile operations
  static async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at') {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (setClauses.length === 0) {
        return { data: null, error: { message: 'No valid fields to update' } };
      }

      values.push(userId);
      const query = `
        UPDATE profiles 
        SET ${setClauses.join(', ')}, updated_at = NOW() 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;

      const result = await executeQuery(query, values);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? result.data[0] : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getUserProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        'SELECT * FROM profiles WHERE id = $1',
        [userId]
      );

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? result.data[0] : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  // Product matching methods
  static async saveProductMatch(matchData: any): Promise<{ success: boolean; error?: any }> {
    if (isDemoMode()) {
      return { success: true };
    }
    
    if (!isDatabaseConfigured()) {
      return { success: false, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        `INSERT INTO product_matches (
          video_id, detected_object, confidence_score, bounding_box, 
          matched_product_id, match_type, ai_suggestions, user_selection, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          matchData.video_id,
          matchData.detected_object,
          matchData.confidence_score,
          JSON.stringify(matchData.bounding_box),
          matchData.matched_product_id,
          matchData.match_type,
          JSON.stringify(matchData.ai_suggestions),
          matchData.user_selection,
          matchData.created_at
        ]
      );
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: { message: 'Failed to save product match' } };
    }
  }

  static async getProductMatches(videoId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    if (isDemoMode()) {
      return { success: true, data: [] };
    }
    
    if (!isDatabaseConfigured()) {
      return { success: false, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(
        'SELECT * FROM product_matches WHERE video_id = $1 ORDER BY created_at DESC',
        [videoId]
      );
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result.data || [] };
    } catch (error) {
      return { success: false, error: { message: 'Failed to get product matches' } };
    }
  }

  // Helper methods for authentication
  private static async hashPassword(password: string): Promise<string> {
    // In production, use bcrypt or similar
    // For now, using a simple hash (NOT SECURE FOR PRODUCTION)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  private static async generateJWT(user: any): Promise<string> {
    // In production, use a proper JWT library
    // For now, returning a simple token (NOT SECURE FOR PRODUCTION)
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // Simple base64 encoding (NOT SECURE - use proper JWT in production)
    return btoa(JSON.stringify(payload));
  }
} 