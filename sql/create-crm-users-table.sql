-- Create CRM users table
CREATE TABLE IF NOT EXISTS crm_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'readonly')),
  department TEXT,
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);
CREATE INDEX IF NOT EXISTS idx_crm_users_role ON crm_users(role);
CREATE INDEX IF NOT EXISTS idx_crm_users_is_active ON crm_users(is_active);

-- Enable RLS
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data" ON crm_users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy for admins to read all data
CREATE POLICY "Admins can read all data" ON crm_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for managers to read their department
CREATE POLICY "Managers can read department data" ON crm_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_users u1
      WHERE u1.id = auth.uid() AND u1.role = 'manager'
      AND (u1.department = crm_users.department OR crm_users.role = 'employee')
    )
  );

-- Policy for admins to update all data
CREATE POLICY "Admins can update all data" ON crm_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM crm_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert Mustafa as admin
INSERT INTO crm_users (id, email, name, role, department, is_active)
VALUES ('6a8589db-f55a-4e97-bd46-1dfb8b725909', 'mustafa@nordflytt.se', 'Mustafa Abdulkarim', 'admin', 'IT', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active;

-- Add other default users if they exist
INSERT INTO crm_users (id, email, name, role, department, is_active)
SELECT 
  au.id, 
  au.email, 
  CASE 
    WHEN au.email = 'admin@nordflytt.se' THEN 'Admin Användare'
    WHEN au.email = 'manager@nordflytt.se' THEN 'Manager Användare'
    WHEN au.email = 'employee@nordflytt.se' THEN 'Anställd Användare'
  END as name,
  CASE 
    WHEN au.email = 'admin@nordflytt.se' THEN 'admin'
    WHEN au.email = 'manager@nordflytt.se' THEN 'manager'
    WHEN au.email = 'employee@nordflytt.se' THEN 'employee'
  END as role,
  CASE 
    WHEN au.email = 'admin@nordflytt.se' THEN 'Management'
    WHEN au.email = 'manager@nordflytt.se' THEN 'Operations'
    WHEN au.email = 'employee@nordflytt.se' THEN 'Field'
  END as department,
  true as is_active
FROM auth.users au
WHERE au.email IN ('admin@nordflytt.se', 'manager@nordflytt.se', 'employee@nordflytt.se')
ON CONFLICT (id) DO NOTHING;