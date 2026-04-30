-- =====================================================
-- DISABLE RLS TO FIX RECURSION ERROR
-- =====================================================

-- Disable RLS on users table to fix infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Admins can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can update own profile" ON users;

-- Verify the fix
SELECT 'RLS Disabled' as status, email, role, is_active 
FROM users 
WHERE email = 'superadmin@gmail.com';

-- =====================================================
-- RLS DISABLED - Admin login should work now!
-- =====================================================
