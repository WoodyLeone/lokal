import { 
  executeMongoOperation, 
  isDatabaseConfigured 
} from '../config/mongodb';
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
import { ObjectId } from 'mongodb';

// Helper function to convert database format to frontend format
const convertVideoToFrontend = (video: any): VideoFrontend => ({
  id: video._id.toString(),
  userId: video.userId,
  title: video.title,
  description: video.description,
  videoUrl: video.videoUrl,
  thumbnailUrl: video.thumbnailUrl,
  duration: video.duration,
  detectedObjects: video.detectedObjects || [],
  products: video.products?.map(convertProductToFrontend) || [],
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
});

const convertProductToFrontend = (product: any): ProductFrontend => ({
  id: product._id?.toString() || product.id,
  title: product.title,
  description: product.description,
  imageUrl: product.imageUrl,
  price: product.price,
  currency: product.currency,
  buyUrl: product.buyUrl,
  category: product.category,
  brand: product.brand,
  rating: product.rating,
  reviewCount: product.reviewCount,
  createdAt: product.createdAt,
});

export class MongoService {
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
      
      const result = await executeMongoOperation(async (db) => {
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
          throw new Error('User already exists');
        }
        
        // Create user
        const user = {
          email,
          passwordHash: hashedPassword,
          username,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const userResult = await db.collection('users').insertOne(user);
        
        // Create profile
        const profile = {
          userId: userResult.insertedId.toString(),
          username,
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('profiles').insertOne(profile);
        
        return {
          id: userResult.insertedId.toString(),
          email: user.email,
          username: user.username,
          createdAt: user.createdAt
        };
      });
      
      if (result.error) {
        return { data: null, error: { message: result.error } };
      }
      
      // Generate JWT token
      const token = await this.generateJWT(result.data);
      
      return { 
        data: { 
          user: result.data, 
          session: { access_token: token } 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : { message: 'Sign up failed' } };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔧 MongoService.signIn called');
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
      const result = await executeMongoOperation(async (db) => {
        // Get user with password hash
        const user = await db.collection('users').findOne({ email });
        if (!user) {
          throw new Error('Invalid credentials');
        }
        
        // Verify password
        const isValidPassword = await this.verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          createdAt: user.createdAt
        };
      });
      
      if (result.error) {
        return { data: null, error: { message: result.error } };
      }
      
      // Generate JWT token
      const token = await this.generateJWT(result.data);
      
      return { 
        data: { 
          user: result.data, 
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
      const result = await executeMongoOperation(async (db) => {
        const videoDoc = {
          userId: video.user_id,
          title: video.title,
          description: video.description,
          videoUrl: video.video_url,
          thumbnailUrl: video.thumbnail_url,
          duration: video.duration,
          detectedObjects: video.detected_objects,
          products: video.products,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const insertResult = await db.collection('videos').insertOne(videoDoc);
        const insertedVideo = await db.collection('videos').findOne({ _id: insertResult.insertedId });
        
        return insertedVideo;
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertVideoToFrontend(result.data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getVideos(userId?: string): Promise<{ data: VideoFrontend[] | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeMongoOperation(async (db) => {
        const filter = userId ? { userId } : {};
        const videos = await db.collection('videos')
          .find(filter)
          .sort({ createdAt: -1 })
          .toArray();
        
        return videos;
      });
      
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
      const result = await executeMongoOperation(async (db) => {
        const video = await db.collection('videos').findOne({ _id: new ObjectId(id) });
        return video;
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertVideoToFrontend(result.data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async updateVideo(id: string, updates: Partial<Video>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeMongoOperation(async (db) => {
        const updateDoc = {
          ...updates,
          updatedAt: new Date()
        };
        
        // Remove fields that shouldn't be updated
        delete updateDoc.id;
        delete updateDoc.created_at;
        delete updateDoc.updated_at;
        
        await db.collection('videos').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateDoc }
        );
        
        const updatedVideo = await db.collection('videos').findOne({ _id: new ObjectId(id) });
        return updatedVideo;
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertVideoToFrontend(result.data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async deleteVideo(id: string): Promise<{ error: any }> {
    if (!isDatabaseConfigured()) {
      return { error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeMongoOperation(async (db) => {
        await db.collection('videos').deleteOne({ _id: new ObjectId(id) });
        return true;
      });

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
      const result = await executeMongoOperation(async (db) => {
        const products = await db.collection('products')
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        
        return products;
      });

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
      const result = await executeMongoOperation(async (db) => {
        const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
        return product;
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ? convertProductToFrontend(result.data) : null, error: null };
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
      const result = await executeMongoOperation(async (db) => {
        const updateDoc = {
          ...updates,
          updatedAt: new Date()
        };
        
        // Remove fields that shouldn't be updated
        delete updateDoc.id;
        delete updateDoc.created_at;
        
        await db.collection('profiles').updateOne(
          { userId },
          { $set: updateDoc }
        );
        
        const updatedProfile = await db.collection('profiles').findOne({ userId });
        return updatedProfile;
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getUserProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeMongoOperation(async (db) => {
        const profile = await db.collection('profiles').findOne({ userId });
        return profile;
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
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