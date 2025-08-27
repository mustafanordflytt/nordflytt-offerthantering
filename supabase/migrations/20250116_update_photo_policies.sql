-- Update policies to allow public access for demo
-- In production, use proper authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view photos" ON job_photos;
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON job_photos;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON job_photos;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON job_photos;

-- Create new policies for demo (PUBLIC access)
CREATE POLICY "Public can view photos" ON job_photos
  FOR SELECT USING (true);

CREATE POLICY "Public can insert photos" ON job_photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update photos" ON job_photos
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete photos" ON job_photos
  FOR DELETE USING (true);

-- Update storage policies
DROP POLICY IF EXISTS "Anyone can view job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete job photos" ON storage.objects;

-- Create public storage policies for demo
CREATE POLICY "Public can view job photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-photos');

CREATE POLICY "Public can upload job photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'job-photos');

CREATE POLICY "Public can update job photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'job-photos');

CREATE POLICY "Public can delete job photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'job-photos');