-- =====================================================
-- DZIKWA CHECK-IN APP: SIMPLE ADMIN SETUP
-- =====================================================

-- Step 1: Clean up existing admin tables
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Step 2: Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Step 3: Insert Super Admin
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
    'superadmin@gmail.com',
    'admin123',
    'superadmin',
    true
);

-- Step 4: Enable RLS (Optional - can be done later)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verification
SELECT 'Super Admin Created' as status, email, role, is_active 
FROM users 
WHERE email = 'superadmin@gmail.com';

SELECT 'Total Users' as status, COUNT(*) as count, 
    COUNT(*) FILTER (WHERE role = 'superadmin') as superadmins,
    COUNT(*) FILTER (WHERE role = 'admin') as regular_admins
FROM users;

-- =====================================================
-- SETUP COMPLETE!
-- Super Admin: superadmin@gmail.com / admin123
-- =====================================================
