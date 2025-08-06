// Database types matching actual Railway PostgreSQL schema
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
  views?: number;
  likes?: number;
  shares?: number;
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
  views?: number;
  likes?: number;
  shares?: number;
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

// NEW: Tracking and Interactive Video Types
export interface TrackedItem {
  id: string;
  name: string;
  category?: string; // Product category (footwear, clothing, etc.)
  confidence?: number; // Detection confidence (0-1)
  x: number; // percentage position
  y: number; // percentage position
  startTime: number; // seconds
  endTime: number; // seconds
  product?: ProductFrontend;
  isSelected: boolean;
  isVisible?: boolean; // Whether the item is currently visible
}

export interface Hotspot {
  id: string;
  x: number; // percentage position
  y: number; // percentage position
  startTime: number; // seconds
  endTime: number; // seconds
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
    link: string;
  };
  isVisible: boolean;
}

// Enhanced tracking types for pipeline integration
export interface ObjectDetection {
  track_id: number;
  frame_number: number;
  class_name: string;
  confidence: number;
  bbox: {
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  quality_scores?: {
    confidence: number;
    stability: number;
    consistency: number;
    quality: number;
  };
}

export interface ProductMatch {
  track_id: number;
  product_name: string;
  product_url: string;
  affiliate_link: string;
  relevance_score: number;
  confidence: number;
  price?: number;
  currency?: string;
  image_url?: string;
  category?: string;
  brand?: string;
}

export interface PipelineResult {
  phase: string;
  status: string;
  progress: number;
  data: any;
  created_at: string;
  updated_at: string;
}

export interface VideoAnalysis {
  videoId: string;
  status: string;
  pipelineResults: PipelineResult[];
  detections: ObjectDetection[];
  matches: ProductMatch[];
  summary: {
    totalDetections: number;
    totalMatches: number;
    uniqueObjects: number;
    averageConfidence: number;
  };
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
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

// User Session types
export interface UserSession {
  user: any;
  session: any;
}

// Analytics types
export interface VideoAnalytics {
  videoId: string;
  views: number;
  likes: number;
  shares: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Creator types
export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  totalViews: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
} 