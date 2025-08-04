-- Storage Policies for Lokal App
-- Run this in your Supabase SQL Editor after creating the buckets

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access to videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Upload policies for authenticated users
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

-- Update policies for authenticated users (own files)
CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete policies for authenticated users (own files)
CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname; 