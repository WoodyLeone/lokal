-- Lokal App - Railway PostgreSQL Database Schema
-- Run this script in your Railway PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  detected_objects TEXT[] DEFAULT '{}',
  products JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  buy_url TEXT,
  category TEXT,
  brand TEXT,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Insert some sample products for testing
INSERT INTO products (title, description, image_url, price, currency, buy_url, category, brand, rating, review_count) VALUES
('Nike Air Max 270', 'Comfortable running shoes with Air Max technology', 'https://example.com/nike-airmax.jpg', 129.99, 'USD', 'https://nike.com/airmax270', 'Footwear', 'Nike', 4.5, 1250),
('MacBook Pro 13"', 'Powerful laptop for professionals', 'https://example.com/macbook-pro.jpg', 1299.99, 'USD', 'https://apple.com/macbook-pro', 'Electronics', 'Apple', 4.8, 890),
('Coffee Mug', 'Ceramic coffee mug with handle', 'https://example.com/coffee-mug.jpg', 12.99, 'USD', 'https://starbucks.com/mug', 'Kitchen', 'Starbucks', 4.2, 340),
('Adidas T-Shirt', 'Comfortable cotton t-shirt', 'https://example.com/adidas-tshirt.jpg', 29.99, 'USD', 'https://adidas.com/tshirt', 'Clothing', 'Adidas', 4.3, 567)
ON CONFLICT DO NOTHING;

-- Create a test user for development
INSERT INTO users (email, password_hash, username) VALUES
('test@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'testuser') -- password: password
ON CONFLICT DO NOTHING; 