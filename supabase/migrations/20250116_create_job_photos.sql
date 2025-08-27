-- Create job_photos table for storing photo metadata
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  service_type TEXT NOT NULL,
  room TEXT,
  timestamp TEXT NOT NULL,
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_created_at ON job_photos(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all photos
CREATE POLICY "Anyone can view photos" ON job_photos
  FOR SELECT USING (true);

-- Allow authenticated users to insert photos
CREATE POLICY "Authenticated users can insert photos" ON job_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update own photos" ON job_photos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete photos
CREATE POLICY "Users can delete photos" ON job_photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket for job photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view job photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-photos');

CREATE POLICY "Authenticated users can upload job photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'job-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update job photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'job-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete job photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'job-photos' 
    AND auth.role() = 'authenticated'
  );