-- Create CRM users table
CREATE TABLE IF NOT EXISTS crm_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'readonly')),
  department VARCHAR(100),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can view own profile" ON crm_users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy for admins to view all users
CREATE POLICY "Admins can view all users" ON crm_users
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM crm_users 
      WHERE role = 'admin'
    )
  );

-- Policy for users to update their own data
CREATE POLICY "Users can update own profile" ON crm_users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy for admins to manage all users
CREATE POLICY "Admins can manage all users" ON crm_users
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM crm_users 
      WHERE role = 'admin'
    )
  );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_crm_users_updated_at
    BEFORE UPDATE ON crm_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (update email/password as needed)
INSERT INTO crm_users (id, email, name, role, department) VALUES
  -- This will be created when admin signs up
  -- ('admin-uuid-here', 'admin@nordflytt.se', 'System Administrator', 'admin', 'IT')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS crm_users_role_idx ON crm_users(role);
CREATE INDEX IF NOT EXISTS crm_users_department_idx ON crm_users(department);
CREATE INDEX IF NOT EXISTS crm_users_email_idx ON crm_users(email);

-- Create view for user management (admins only)
CREATE OR REPLACE VIEW crm_user_management AS
SELECT 
  id,
  email,
  name,
  role,
  department,
  created_at,
  updated_at,
  last_login_at,
  CASE 
    WHEN last_login_at IS NULL THEN 'Never logged in'
    WHEN last_login_at > NOW() - INTERVAL '1 hour' THEN 'Online'
    WHEN last_login_at > NOW() - INTERVAL '1 day' THEN 'Recently active'
    ELSE 'Inactive'
  END as status
FROM crm_users
ORDER BY created_at DESC;

-- Grant access to the view for admins
GRANT SELECT ON crm_user_management TO authenticated;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM crm_users WHERE id = user_id;
  
  RETURN CASE user_role
    WHEN 'admin' THEN TRUE
    WHEN 'manager' THEN permission IN (
      'customers:read', 'customers:write',
      'jobs:read', 'jobs:write',
      'leads:read', 'leads:write',
      'employees:read',
      'reports:read',
      'ai:access'
    )
    WHEN 'employee' THEN permission IN (
      'customers:read',
      'jobs:read', 'jobs:write',
      'leads:read',
      'reports:read'
    )
    WHEN 'readonly' THEN permission IN (
      'customers:read',
      'jobs:read',
      'leads:read',
      'reports:read'
    )
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create demo users for testing (remove in production)
DO $$
DECLARE
  admin_id UUID;
  manager_id UUID;
  employee_id UUID;
BEGIN
  -- Create auth users (this would normally be done through Supabase Auth)
  -- These are placeholder IDs - real ones will be created through the auth system
  
  -- Note: In production, remove this section and create users through the proper auth flow
  INSERT INTO crm_users (id, email, name, role, department) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@nordflytt.se', 'Admin Administratorsson', 'admin', 'IT'),
    ('00000000-0000-0000-0000-000000000002', 'manager@nordflytt.se', 'Manager Managersson', 'manager', 'Operations'),
    ('00000000-0000-0000-0000-000000000003', 'employee@nordflytt.se', 'Employee Employesson', 'employee', 'Customer Service')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if users already exist
    NULL;
END $$;