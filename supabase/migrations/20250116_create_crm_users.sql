-- Create CRM users table
CREATE TABLE IF NOT EXISTS crm_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'readonly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);

-- Enable RLS
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read own data" ON crm_users
  FOR SELECT USING (auth.uid() = id);
  
-- Create policy for admins to read all data  
CREATE POLICY "Admins can read all data" ON crm_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crm_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for service role to do anything
CREATE POLICY "Service role can do anything" ON crm_users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Insert default users based on existing auth users
INSERT INTO crm_users (id, email, name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  CASE 
    WHEN email = 'admin@nordflytt.se' THEN 'admin'
    WHEN email = 'manager@nordflytt.se' THEN 'manager'
    ELSE 'employee'
  END as role
FROM auth.users
WHERE email IN ('admin@nordflytt.se', 'manager@nordflytt.se', 'employee@nordflytt.se')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = CURRENT_TIMESTAMP;