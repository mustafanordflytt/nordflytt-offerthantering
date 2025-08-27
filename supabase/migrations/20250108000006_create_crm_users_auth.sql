-- CRM Users Table with Authentication
-- This migration creates the CRM users table and authentication setup

-- Create CRM users table
CREATE TABLE IF NOT EXISTS crm_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'readonly')),
    avatar_url TEXT,
    phone VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_crm_users_email ON crm_users(email);
CREATE INDEX idx_crm_users_role ON crm_users(role);
CREATE INDEX idx_crm_users_is_active ON crm_users(is_active);

-- Enable Row Level Security
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all CRM users
CREATE POLICY "CRM users can view all users" ON crm_users
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON crm_users
    FOR UPDATE USING (auth.uid() = id);

-- Only admins can insert new users
CREATE POLICY "Only admins can create users" ON crm_users
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM crm_users WHERE role = 'admin')
        OR NOT EXISTS (SELECT 1 FROM crm_users) -- Allow first user
    );

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON crm_users
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM crm_users WHERE role = 'admin')
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.crm_users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM crm_users) THEN 'admin' -- First user is admin
            ELSE 'employee'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE crm_users 
    SET last_login = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login tracking
CREATE TRIGGER on_auth_user_login
    AFTER INSERT ON auth.sessions
    FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM crm_users WHERE id = user_id;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Define role permissions
    IF user_role = 'admin' THEN
        RETURN TRUE; -- Admins have all permissions
    ELSIF user_role = 'manager' THEN
        RETURN permission IN (
            'customers:read', 'customers:write',
            'leads:read', 'leads:write',
            'jobs:read', 'jobs:write',
            'staff:read', 'staff:write',
            'financial:read',
            'reports:read'
        );
    ELSIF user_role = 'employee' THEN
        RETURN permission IN (
            'customers:read',
            'leads:read', 'leads:write',
            'jobs:read', 'jobs:write',
            'reports:read'
        );
    ELSIF user_role = 'readonly' THEN
        RETURN permission IN (
            'customers:read',
            'leads:read',
            'jobs:read',
            'reports:read'
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_crm_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crm_users_updated_at
    BEFORE UPDATE ON crm_users
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_users_updated_at();

-- Insert demo users (for development)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'authenticated', 'authenticated', 'admin@nordflytt.se', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Admin User"}'),
    ('00000000-0000-0000-0000-000000000000', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'authenticated', 'authenticated', 'manager@nordflytt.se', crypt('manager123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Manager User"}'),
    ('00000000-0000-0000-0000-000000000000', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'authenticated', 'authenticated', 'employee@nordflytt.se', crypt('employee123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Employee User"}')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON crm_users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ CRM Users authentication setup completed';
    RAISE NOTICE '🔐 Row Level Security enabled';
    RAISE NOTICE '👤 Demo users created (admin@nordflytt.se, manager@nordflytt.se, employee@nordflytt.se)';
    RAISE NOTICE '🔑 All passwords: [role]123 (e.g., admin123)';
END $$;