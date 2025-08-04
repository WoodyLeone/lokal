-- Storage Buckets Setup for Lokal App
-- Run this after the main database setup

-- Create storage buckets for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Verify buckets were created
SELECT id, name, public FROM storage.buckets WHERE id IN ('videos', 'thumbnails'); 