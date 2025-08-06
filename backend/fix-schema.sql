-- Fix videos table schema
ALTER TABLE videos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'uploaded';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS pipeline_results JSONB;

-- Show current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'videos' 
ORDER BY ordinal_position; 