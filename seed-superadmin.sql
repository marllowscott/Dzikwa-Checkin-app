-- Seed Super Admin Account
-- Run this SQL in your Supabase SQL Editor to create the super admin account

-- Option 1: Using pgcrypto extension (recommended)
-- Enable pgcrypto extension if not already enabled (needed for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert super admin account (only if it doesn't already exist)
INSERT INTO admins (name, email, password, role)
SELECT 'Super Admin', 'superadmin@gmail.com', crypt('admin123', gen_salt('bf', 10)), 'superadmin'
WHERE NOT EXISTS (
    SELECT 1 FROM admins WHERE email = 'superadmin@gmail.com'
);

-- Option 2: If pgcrypto is not available, use pre-computed bcrypt hash
-- Uncomment the following line and comment out the INSERT above if pgcrypto fails:
-- INSERT INTO admins (name, email, password, role) VALUES ('Super Admin', 'superadmin@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin') ON CONFLICT (email) DO NOTHING;

-- Verify the account was created
SELECT id, name, email, role, created_at
FROM admins
WHERE email = 'superadmin@gmail.com';