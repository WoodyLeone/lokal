-- Simple Storage Policies Setup for Lokal App
-- Run this in Supabase SQL Editor with service role privileges

-- First, let's check if we can access the storage schema
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'storage';

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check existing policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Try to enable RLS (this should work with service role)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create basic policies one by one
CREATE POLICY "Public read access to videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND 
    auth.uid() IS NOT NULL
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname; 