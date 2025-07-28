// Database types matching actual Supabase schema
export interface Video {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  detected_objects: string[];
  products: any[]; // JSONB array in database
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  currency: string;
  buy_url: string;
  category: string;
  brand: string;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

// Frontend-friendly types (camelCase)
export interface VideoFrontend {
  id: string;
  userId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  detectedObjects: string[];
  products: ProductFrontend[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFrontend {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  buyUrl: string;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface VideoUploadResponse {
  success: boolean;
  videoId?: string;
  error?: string;
}

export interface ObjectDetectionResponse {
  success: boolean;
  objects?: string[];
  error?: string;
}

export interface ProductMatchResponse {
  success: boolean;
  products?: ProductFrontend[];
  error?: string;
}

// Storage types
export interface StorageUploadResponse {
  url?: string;
  error?: string;
}

// Auth types
export interface AuthResponse {
  data: any;
  error: any;
}

export interface UserSession {
  user: any;
  session: any;
} 