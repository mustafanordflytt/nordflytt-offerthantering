-- Create table for storing refresh tokens
CREATE TABLE IF NOT EXISTS staff_refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  -- Indexes for performance
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes
CREATE INDEX idx_refresh_tokens_user_id ON staff_refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON staff_refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON staff_refresh_tokens(expires_at);

-- Cleanup expired tokens automatically
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM staff_refresh_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired tokens (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-refresh-tokens', '0 2 * * *', 'SELECT cleanup_expired_refresh_tokens();');