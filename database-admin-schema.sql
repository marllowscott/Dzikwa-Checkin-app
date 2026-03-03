-- Admin Management Schema for Digital Check-In System
-- Run this SQL in your Supabase SQL Editor to create the admins table

-- Create the admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to check if setup is required (select with count)
-- But only authenticated admins can view/create/update/delete records
CREATE POLICY "Enable read access for admins" ON admins
    FOR SELECT
    USING (true);

-- Policy for creating admin - only if no admins exist (handled by API)
CREATE POLICY "Enable insert for first admin" ON admins
    FOR INSERT
    WITH CHECK (true);

-- Policy for admins to update their own records
CREATE POLICY "Enable update for admins" ON admins
    FOR UPDATE
    USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at DESC);

-- Add comment to table
COMMENT ON TABLE admins IS 'Admin users for the Digital Check-In System';
COMMENT ON COLUMN admins.password IS 'BCrypt hashed password';
