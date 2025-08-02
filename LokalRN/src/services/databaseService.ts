import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { isDemoMode, ENV } from '../config/env';

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
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;

  // Get stored tokens
  private static async getStoredTokens() {
    try {
      const tokens = await AsyncStorage.getItem('auth_tokens');
      return tokens ? JSON.parse(tokens) : { accessToken: null, refreshToken: null };
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  // Store tokens
  private static async storeTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('auth_tokens', JSON.stringify({ accessToken, refreshToken }));
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Clear tokens
  private static async clearTokens() {
    try {
      await AsyncStorage.removeItem('auth_tokens');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Refresh access token using refresh token
  private static async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        console.log('🔧 No refresh token available');
        return false;
      }

      const response = await fetch(`${ENV.API_BASE_URL}/database/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          await this.storeTokens(result.data.access_token, result.data.refresh_token);
          console.log('🔧 Access token refreshed successfully');
          return true;
        }
      }
      
      console.log('🔧 Failed to refresh access token');
      return false;
    } catch (error) {
      console.error('🔧 Error refreshing access token:', error);
      return false;
    }
  }

  // Get authorization header with automatic token refresh
  private static async getAuthHeader(): Promise<string | null> {
    try {
      // Load tokens if not in memory
      if (!this.accessToken || !this.refreshToken) {
        const stored = await this.getStoredTokens();
        this.accessToken = stored.accessToken;
        this.refreshToken = stored.refreshToken;
      }

      if (this.accessToken) {
        return `Bearer ${this.accessToken}`;
      }

      return null;
    } catch (error) {
      console.error('🔧 Error getting auth header:', error);
      return null;
    }
  }

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
      
      // Store JWT tokens if sign in was successful
      if (result.data && result.data.session) {
        const { access_token, refresh_token } = result.data.session;
        if (access_token && refresh_token) {
          await this.storeTokens(access_token, refresh_token);
          console.log('🔧 JWT tokens stored successfully');
        }
      }
      
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Sign in failed' } };
    }
  }

  static async signOut(): Promise<{ error: any }> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.signOut();
    }
    
    if (!isDatabaseConfigured()) {
      return { error: { message: 'Database not configured' } };
    }
    
    try {
      // Get auth header before clearing tokens
      const authHeader = await this.getAuthHeader();
      
      // Clear stored tokens
      await this.clearTokens();
      
      const result = await executeQuery('/auth/signout', 'POST', undefined, authHeader);
      return { error: result.error };
    } catch (error) {
      return { error: { message: 'Sign out failed' } };
    }
  }

  static async getCurrentUser(): Promise<UserSession> {
    try {
      // Get auth header
      const authHeader = await this.getAuthHeader();
      
      const result = await executeQuery('/auth/me', 'GET', undefined, authHeader);
      if (result.error) {
        console.log('🔧 Auth check failed:', result.error);
        return { user: null, session: null };
      }
      return result.data || { user: null, session: null };
    } catch (error) {
      console.log('🔧 Auth check error:', error);
      return { user: null, session: null };
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
      const authHeader = await this.getAuthHeader();
      const result = await executeQuery('/videos', 'POST', video, authHeader);
      
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
      const authHeader = await this.getAuthHeader();
      const endpoint = userId ? `/videos?userId=${userId}` : '/videos';
      const result = await executeQuery(endpoint, 'GET', undefined, authHeader);
      
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