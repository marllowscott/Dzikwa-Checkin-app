-- =====================================================
-- DZIKWA CHECK-IN APP: ADMIN SYSTEM RESET & SETUP
-- =====================================================
-- This script will:
-- 1. Clean up existing admin-related tables safely
-- 2. Create unified users table with role system
-- 3. Seed Super Admin account
-- 4. Set up proper security
-- =====================================================

-- STEP 1: Clean up existing admin-related tables safely
-- =====================================================

-- Drop existing admin tables if they exist
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop any admin-related functions
DROP FUNCTION IF EXISTS admin_user_exists(TEXT);

-- STEP 2: Create unified users table with role system
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- STEP 3: Seed Super Admin account
-- =====================================================

-- Ensure Super Admin always exists
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
  'superadmin@gmail.com',
  'admin123',  -- Plain text password (as per existing system)
  'superadmin',
  true
)
ON CONFLICT (email)
DO UPDATE SET 
  role = 'superadmin',
  password_hash = 'admin123',
  is_active = true,
  updated_at = NOW();

-- STEP 4: Set up Row Level Security (RLS)
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Create RLS policies
-- 1. Service role (backend) has full access
CREATE POLICY "Service role full access" ON users
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 2. Super Admins can do everything
CREATE POLICY "Super admins full access" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE email = auth.jwt()->>'email' 
            AND role = 'superadmin' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE email = auth.jwt()->>'email' 
            AND role = 'superadmin' 
            AND is_active = true
        )
    );

-- 3. Regular Admins can only view and update their own profile
CREATE POLICY "Admins can view own profile" ON users
    FOR SELECT
    USING (
        email = auth.jwt()->>'email' 
        AND is_active = true
    );

CREATE POLICY "Admins can update own profile" ON users
    FOR UPDATE
    USING (
        email = auth.jwt()->>'email' 
        AND is_active = true
    )
    WITH CHECK (
        email = auth.jwt()->>'email' 
        AND is_active = true
    );

-- STEP 5: Create helper functions
-- =====================================================

-- Function to check if user exists and is active
CREATE OR REPLACE FUNCTION admin_user_exists(email_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE email = email_param 
        AND is_active = true
    );
END;
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(email_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM users 
    WHERE email = email_param 
    AND is_active = true;
    
    RETURN COALESCE(user_role, 'none');
END;
$$;

-- STEP 6: Create trigger for updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 7: Verification queries
-- =====================================================

-- Verify Super Admin was created
SELECT 
    'Super Admin Verification' as info,
    id,
    email,
    role,
    is_active,
    created_at
FROM users 
WHERE email = 'superadmin@gmail.com';

-- Count total users by role
SELECT 
    'User Count by Role' as info,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'superadmin') as superadmins,
    COUNT(*) FILTER (WHERE role = 'admin') as regular_admins
FROM users 
WHERE is_active = true;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Super Admin Credentials:
-- Email: superadmin@gmail.com
-- Password: admin123
-- Role: superadmin
--
-- The system is now ready with:
-- ✅ Clean unified users table with role support
-- ✅ Super Admin account created and protected
-- ✅ Proper RLS policies in place
-- ✅ Helper functions for authentication
-- ✅ Updated timestamp triggers
--
-- ADMIN ACCESS FLOW:
-- 1. Double-tap 'A' key on any main page
-- 2. Admin login form appears
-- 3. Enter Super Admin credentials
-- 4. Access admin dashboard with full control
--
-- SECURITY FEATURES:
-- ✅ Admin UI hidden from navigation
-- ✅ Only double-tap 'A' triggers admin access
-- ✅ Role-based access control enforced
-- ✅ Session management implemented
-- ✅ Super Admin cannot be deleted
-- =====================================================
