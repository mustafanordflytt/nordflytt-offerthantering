-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create reviews table
CREATE OR REPLACE FUNCTION create_reviews_table(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create follow_ups table
CREATE OR REPLACE FUNCTION create_follow_ups_table(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_reviews_table TO service_role;
GRANT EXECUTE ON FUNCTION create_follow_ups_table TO service_role;

-- Enable RLS
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS follow_ups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
ON follow_ups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON follow_ups FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON follow_ups FOR UPDATE
TO authenticated
USING (true); 