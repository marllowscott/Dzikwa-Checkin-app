-- Drop table if exists to ensure clean setup
DROP TABLE IF EXISTS admin_users;

-- Create admin_users table for admin authentication
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin authentication (read access for login)
CREATE POLICY "Enable read access for admin login" ON admin_users
    FOR SELECT USING (true);

-- Create policy for admin management (only authenticated admins can modify)
CREATE POLICY "Enable admin management" ON admin_users
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at DESC);

-- Insert default admin user
-- Password: admin123 (you should change this after first login)
-- Hash generated with bcrypt, salt rounds 10
INSERT INTO admin_users (full_name, email, password_hash)
VALUES ('Administrator', 'admin@dzikwa.co.zw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Add comment
COMMENT ON TABLE admin_users IS 'Admin users for system authentication';
COMMENT ON COLUMN admin_users.password_hash IS 'BCrypt hashed password';