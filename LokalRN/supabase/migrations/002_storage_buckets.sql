
-- Create storage buckets for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;
    