-- Lokal App - Supabase Project Reset Script
-- WARNING: This will DELETE ALL DATA and reset the database to a clean state
-- Run this script in your Supabase SQL editor

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;

-- Drop table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view all videos" ON videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON videos;

DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- STEP 2: RECREATE THE DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
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
CREATE TABLE products (
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

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES
-- =====================================================

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

-- =====================================================
-- STEP 5: CREATE STORAGE POLICIES
-- =====================================================

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

-- =====================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

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

-- =====================================================
-- STEP 7: INSERT SAMPLE DATA
-- =====================================================

-- Insert sample products for testing
INSERT INTO products (title, description, image_url, price, currency, buy_url, category, brand, rating, review_count) VALUES
('Nike Air Max 270', 'Comfortable running shoes with Air Max technology', 'https://example.com/nike-airmax.jpg', 129.99, 'USD', 'https://nike.com/airmax270', 'Footwear', 'Nike', 4.5, 1250),
('MacBook Pro 13"', 'Powerful laptop for professionals', 'https://example.com/macbook-pro.jpg', 1299.99, 'USD', 'https://apple.com/macbook-pro', 'Electronics', 'Apple', 4.8, 890),
('Coffee Mug', 'Ceramic coffee mug with handle', 'https://example.com/coffee-mug.jpg', 12.99, 'USD', 'https://starbucks.com/mug', 'Kitchen', 'Starbucks', 4.2, 340),
('Adidas T-Shirt', 'Comfortable cotton t-shirt', 'https://example.com/adidas-tshirt.jpg', 29.99, 'USD', 'https://adidas.com/tshirt', 'Clothing', 'Adidas', 4.3, 567)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 8: VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'videos' as table_name, COUNT(*) as row_count FROM videos
UNION ALL
SELECT 'products' as table_name, COUNT(*) as row_count FROM products;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'videos', 'products');

-- Verify policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'videos', 'products')
ORDER BY tablename, policyname; 