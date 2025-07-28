import { supabase, isSupabaseConfigured } from '../config/supabase';
import { 
  Video, 
  Product, 
  Profile, 
  VideoFrontend, 
  ProductFrontend, 
  StorageUploadResponse,
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

export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.signUp(email, password, username);
    }
    
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : { message: 'Sign up failed' } };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔧 SupabaseService.signIn called');
    console.log('🔧 Demo mode check:', isDemoMode());
    
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      console.log('🔧 Using demo auth service');
      return DemoAuthService.signIn(email, password);
    }
    
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : { message: 'Sign in failed' } };
    }
  }

  static async signOut(): Promise<{ error: any }> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.signOut();
    }
    
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : { message: 'Sign out failed' } };
    }
  }

  static async getCurrentUser(): Promise<UserSession> {
    // Use demo auth if in demo mode
    if (isDemoMode()) {
      return DemoAuthService.getCurrentUser();
    }
    
    if (!isSupabaseConfigured()) {
      return { user: null, session: null };
    }
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      // Don't treat AuthSessionMissingError as a real error - it's normal when no session exists
      if (error && error.message?.includes('Auth session missing')) {
        return { user: null, session: null };
      }
      return { user, session: null };
    } catch (error) {
      // Handle any other errors gracefully
      console.warn('Supabase auth check warning:', error);
      return { user: null, session: null };
    }
  }

  static async onAuthStateChange(callback: (user: any) => void) {
    if (!isSupabaseConfigured()) {
      // In demo mode, just call the callback with null
      callback(null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return supabase.auth.onAuthStateChange((event: any, session: any) => {
      callback(session?.user || null);
    });
  }

  // Storage operations
  static async uploadVideo(uri: string, userId: string, fileName?: string): Promise<StorageUploadResponse> {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase not configured' };
    }
    
    try {
      // Convert URI to blob for React Native
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Generate filename if not provided
      const finalFileName = fileName || `${userId}/${Date.now()}-video.mp4`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(finalFileName, blob, {
          contentType: 'video/mp4',
          cacheControl: '3600',
        });

      if (error) {
        return { error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(finalFileName);

      return { url: urlData.publicUrl };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  static async uploadThumbnail(uri: string, userId: string, fileName?: string): Promise<StorageUploadResponse> {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase not configured' };
    }
    
    try {
      // Convert URI to blob for React Native
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Generate filename if not provided
      const finalFileName = fileName || `${userId}/thumbnails/${Date.now()}-thumbnail.jpg`;
      
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(finalFileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) {
        return { error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(finalFileName);

      return { url: urlData.publicUrl };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Video operations
  static async createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([video])
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data ? convertVideoToFrontend(data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getVideos(userId?: string): Promise<{ data: VideoFrontend[] | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      
      if (error) {
        return { data: null, error };
      }

      const frontendVideos = data ? data.map(convertVideoToFrontend) : [];
      return { data: frontendVideos, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getVideo(id: string): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data ? convertVideoToFrontend(data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async updateVideo(id: string, updates: Partial<Video>): Promise<{ data: VideoFrontend | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data ? convertVideoToFrontend(data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async deleteVideo(id: string): Promise<{ error: any }> {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  // Product operations
  static async getProducts(): Promise<{ data: ProductFrontend[] | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      const frontendProducts = data ? data.map(convertProductToFrontend) : [];
      return { data: frontendProducts, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getProduct(id: string): Promise<{ data: ProductFrontend | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data: data ? convertProductToFrontend(data) : null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  // Profile operations
  static async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updates })
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  static async getUserProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Database error' };
    }
  }
} 