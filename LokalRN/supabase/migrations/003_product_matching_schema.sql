-- Product Matching Schema Enhancement
-- This migration adds fields for hybrid product matching

-- Add product matching fields to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS manual_product_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS affiliate_link TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS object_category TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS bounding_box_coordinates JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS final_product_name TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS matched_label TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ai_suggestions JSONB DEFAULT '[]';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN DEFAULT FALSE;

-- Create product_matches table for detailed matching information
CREATE TABLE IF NOT EXISTS product_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  detected_object TEXT NOT NULL,
  confidence_score DECIMAL(5,4),
  bounding_box JSONB,
  matched_product_id UUID REFERENCES products(id),
  match_type TEXT CHECK (match_type IN ('manual', 'ai_suggestion', 'yolo_direct')),
  ai_suggestions JSONB DEFAULT '[]',
  user_selection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_product_matches_video_id ON product_matches(video_id);
CREATE INDEX IF NOT EXISTS idx_product_matches_detected_object ON product_matches(detected_object);

-- Add RLS policies for product_matches table
ALTER TABLE product_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product matches for their videos" ON product_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = product_matches.video_id 
      AND videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert product matches for their videos" ON product_matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = product_matches.video_id 
      AND videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product matches for their videos" ON product_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = product_matches.video_id 
      AND videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete product matches for their videos" ON product_matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = product_matches.video_id 
      AND videos.user_id = auth.uid()
    )
  );

-- Function to update video's final product name when user confirms
CREATE OR REPLACE FUNCTION update_video_product_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the video's final_product_name and user_confirmed when a product match is confirmed
  IF NEW.user_selection IS NOT NULL AND NEW.user_selection != '' THEN
    UPDATE videos 
    SET 
      final_product_name = NEW.user_selection,
      user_confirmed = TRUE,
      updated_at = NOW()
    WHERE id = NEW.video_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update video when product match is confirmed
CREATE TRIGGER trigger_update_video_product_confirmation
  AFTER UPDATE ON product_matches
  FOR EACH ROW EXECUTE PROCEDURE update_video_product_confirmation(); 