-- Add details column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Add comment to the column
COMMENT ON COLUMN bookings.details IS 'JSON object containing all booking details like addresses, floors, services etc.';

-- Backfill existing rows with empty JSON object if needed
UPDATE bookings 
SET details = '{}'::jsonb 
WHERE details IS NULL; 