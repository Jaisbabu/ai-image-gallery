-- AI Image Gallery Database Setup
-- Run this in your Supabase SQL Editor

-- Create images table
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create image_metadata table
CREATE TABLE IF NOT EXISTS image_metadata (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    tags TEXT[],
    colors VARCHAR(7)[],
    ai_processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metadata_image_id ON image_metadata(image_id);
CREATE INDEX IF NOT EXISTS idx_metadata_user_id ON image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_metadata_tags ON image_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_metadata_colors ON image_metadata USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_metadata_status ON image_metadata(ai_processing_status);

-- Enable Row Level Security (RLS)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own images" ON images;
DROP POLICY IF EXISTS "Users can insert own images" ON images;
DROP POLICY IF EXISTS "Users can update own images" ON images;
DROP POLICY IF EXISTS "Users can delete own images" ON images;
DROP POLICY IF EXISTS "Users can view own metadata" ON image_metadata;
DROP POLICY IF EXISTS "Users can insert own metadata" ON image_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON image_metadata;
DROP POLICY IF EXISTS "Users can delete own metadata" ON image_metadata;

-- RLS Policies for images table
CREATE POLICY "Users can view own images" 
    ON images FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" 
    ON images FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" 
    ON images FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" 
    ON images FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for image_metadata table
CREATE POLICY "Users can view own metadata" 
    ON image_metadata FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata" 
    ON image_metadata FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata" 
    ON image_metadata FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metadata" 
    ON image_metadata FOR DELETE 
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_image_metadata_updated_at ON image_metadata;
CREATE TRIGGER update_image_metadata_updated_at 
    BEFORE UPDATE ON image_metadata 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON images TO authenticated;
GRANT ALL ON image_metadata TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE images_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE image_metadata_id_seq TO authenticated;

-- Create storage bucket (run this separately if it doesn't exist)
-- insert into storage.buckets (id, name, public)
-- values ('images', 'images', false);

-- Storage bucket policies
-- Note: These need to be created in the Supabase Storage UI or via separate policies

COMMENT ON TABLE images IS 'Stores user uploaded images with references to storage paths';
COMMENT ON TABLE image_metadata IS 'Stores AI-generated metadata for images including tags, colors, and descriptions';
COMMENT ON COLUMN image_metadata.ai_processing_status IS 'Status of AI processing: pending, processing, completed, failed';
