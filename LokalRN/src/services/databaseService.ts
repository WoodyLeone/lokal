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
      const result = await executeQuery('/auth/signup', 'POST', {
        email,
        password,
        username
      });
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Sign up failed' } };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.signIn(email, password);
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery('/auth/signin', 'POST', {
        email,
        password
      });
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Sign in failed' } };
    }
  }

  static async signOut(): Promise<{ error: any }> {
    try {
      await executeQuery('/auth/signout', 'POST');
      return { error: null };
    } catch (error) {
      return { error: { message: 'Sign out failed' } };
    }
  }

  static async getCurrentUser(): Promise<UserSession> {
    try {
      const result = await executeQuery('/auth/me');
      return result.data || null;
    } catch (error) {
      return null;
    }
  }

  // Video operations
  static async createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (isDemoMode()) {
      return { data: null, error: { message: 'Demo mode - no video creation' } };
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery('/videos', 'POST', video);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: convertVideoToFrontend(result.data), error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to create video' } };
    }
  }

  static async getVideos(userId?: string): Promise<{ data: VideoFrontend[] | null; error: any }> {
    if (isDemoMode()) {
      return { data: [], error: null };
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const endpoint = userId ? `/videos?userId=${userId}` : '/videos';
      const result = await executeQuery(endpoint);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      const videos = result.data.map(convertVideoToFrontend);
      return { data: videos, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to get videos' } };
    }
  }

  static async getVideo(id: string): Promise<{ data: VideoFrontend | null; error: any }> {
    if (isDemoMode()) {
      return { data: null, error: { message: 'Demo mode - no video data' } };
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(`/videos/${id}`);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: convertVideoToFrontend(result.data), error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to get video' } };
    }
  }

  static async updateVideo(id: string, updates: Partial<Video>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (isDemoMode()) {
      return { data: null, error: { message: 'Demo mode - no video updates' } };
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(`/videos/${id}`, 'PUT', updates);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: convertVideoToFrontend(result.data), error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to update video' } };
    }
  }

  static async deleteVideo(id: string): Promise<{ error: any }> {
    if (isDemoMode()) {
      return { error: null };
    }
    
    if (!isDatabaseConfigured()) {
      return { error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(`/videos/${id}`, 'DELETE');
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to delete video' } };
    }
  }

  // Product operations
  static async getProducts(): Promise<{ data: ProductFrontend[] | null; error: any }> {
    if (isDemoMode()) {
      return { data: [], error: null };
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery('/products');
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      const products = result.data.map(convertProductToFrontend);
      return { data: products, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to get products' } };
    }
  }

  static async getProduct(id: string): Promise<{ data: ProductFrontend | null; error: any }> {
    if (isDemoMode()) {
      return { data: null, error: { message: 'Demo mode - no product data' } };
    }
    
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(`/products/${id}`);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: convertProductToFrontend(result.data), error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to get product' } };
    }
  }

  // Profile operations
  static async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(`/profiles/${userId}`, 'PUT', updates);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to update profile' } };
    }
  }

  static async getUserProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    if (!isDatabaseConfigured()) {
      return { data: null, error: { message: 'Database not configured' } };
    }
    
    try {
      const result = await executeQuery(`/profiles/${userId}`);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Failed to get profile' } };
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
      const result = await executeQuery('/product-matches', 'POST', matchData);
      
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
      const result = await executeQuery(`/product-matches?videoId=${videoId}`);
      
      if (result.error) {
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result.data || [] };
    } catch (error) {
      return { success: false, error: { message: 'Failed to get product matches' } };
        }
  }
} 