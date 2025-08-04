-- Lokal App - Supabase Database Setup
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
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

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Videos policies
CREATE POLICY "Users can view all videos" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Storage policies (run these after creating storage buckets)

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to videos
CREATE POLICY "Public read access to videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to thumbnails
CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Functions and triggers

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some sample products for testing
INSERT INTO products (title, description, image_url, price, currency, buy_url, category, brand, rating, review_count) VALUES
('Nike Air Max 270', 'Comfortable running shoes with Air Max technology', 'https://example.com/nike-airmax.jpg', 129.99, 'USD', 'https://nike.com/airmax270', 'Footwear', 'Nike', 4.5, 1250),
('MacBook Pro 13"', 'Powerful laptop for professionals', 'https://example.com/macbook-pro.jpg', 1299.99, 'USD', 'https://apple.com/macbook-pro', 'Electronics', 'Apple', 4.8, 890),
('Coffee Mug', 'Ceramic coffee mug with handle', 'https://example.com/coffee-mug.jpg', 12.99, 'USD', 'https://starbucks.com/mug', 'Kitchen', 'Starbucks', 4.2, 340),
('Adidas T-Shirt', 'Comfortable cotton t-shirt', 'https://example.com/adidas-tshirt.jpg', 29.99, 'USD', 'https://adidas.com/tshirt', 'Clothing', 'Adidas', 4.3, 567)
ON CONFLICT DO NOTHING; 