-- Uppdatera RLS policies för reviews tabellen
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Ta bort eventuella existerande policies
DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON reviews;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON reviews;

-- Skapa nya policies för reviews
CREATE POLICY "Enable read access for all users"
ON reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for all users"
ON reviews FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON reviews FOR UPDATE
TO public
USING (true);

-- Uppdatera follow_ups policies
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON follow_ups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON follow_ups;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON follow_ups;

CREATE POLICY "Enable read access for all users"
ON follow_ups FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for all users"
ON follow_ups FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON follow_ups FOR UPDATE
TO public
USING (true); 