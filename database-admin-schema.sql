-- Admin Management Schema for Digital Check-In System
-- Run this SQL in your Supabase SQL Editor to create the admins table

-- Create the admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (do this first)
DROP POLICY IF EXISTS "Enable read access for admins" ON admins;
DROP POLICY IF EXISTS "Enable insert for first admin" ON admins;
DROP POLICY IF EXISTS "Enable update for admins" ON admins;
DROP POLICY IF EXISTS "Enable full access for superadmins" ON admins;

-- Policy for creating admin - only if no admins exist (handled by API)
CREATE POLICY "Enable insert for first admin" ON admins
    FOR INSERT
    WITH CHECK (true);

-- Policy for admins to update their own records
CREATE POLICY "Enable update for admins" ON admins
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy for superadmins to manage all admin records
CREATE POLICY "Enable full access for superadmins" ON admins
    FOR ALL
    USING (
        (SELECT role FROM admins WHERE id = auth.uid()) = 'superadmin'
    );

-- Policy for reading admin data (needed for authentication)
CREATE POLICY "Enable read access for admins" ON admins
    FOR SELECT
    USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Add comment to table
COMMENT ON TABLE admins IS 'Admin users for the Digital Check-In System with role-based access';
COMMENT ON COLUMN admins.password IS 'BCrypt hashed password';
COMMENT ON COLUMN admins.role IS 'User role: superadmin or admin';
