-- Create required tables for Lokal app

-- Video uploads table
CREATE TABLE IF NOT EXISTS video_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    video_path TEXT NOT NULL,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detected objects table
CREATE TABLE IF NOT EXISTS detected_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    confidence DECIMAL(5,4),
    bbox JSONB NOT NULL,
    crop_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matched products table
CREATE TABLE IF NOT EXISTS matched_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID REFERENCES detected_objects(id) ON DELETE CASCADE,
    match_type TEXT DEFAULT 'auto',
    label TEXT NOT NULL,
    description TEXT,
    affiliate_link TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_detected_objects_video_id ON detected_objects(video_id);
CREATE INDEX IF NOT EXISTS idx_matched_products_object_id ON matched_products(object_id);

-- Enable Row Level Security (RLS)
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE matched_products ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
CREATE POLICY "Allow public read access" ON video_uploads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON video_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON video_uploads FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON detected_objects FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON detected_objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON detected_objects FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON matched_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON matched_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON matched_products FOR UPDATE USING (true); 