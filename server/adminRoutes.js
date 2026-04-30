import express from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || 'https://qdighwfpcnhhcnerzzvy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkaWdod2ZwY25oaGNuZXJ6enV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3OTM2MiwiZXhwIjoyMDg1MjU1MzYyfQ.gr4FoHP_a6BN3fEKVosvtZvi7YA1WM1LdtTeBh4vhOo';
const jwtSecret = 'super_secret_jwt_key_12345';

if (!jwtSecret) {
  // eslint-disable-next-line no-console
  console.warn('Warning: JWT_SECRET not set - tokens may be insecure');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Check if initial setup is required (no admins exist)
router.get('/setup-required', async (req, res) => {
  try {
    const { count, error } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
    if (error) {
      // If table doesn't exist, treat as setup required
      if (error.message.includes('relation') || error.code === 'PGRST116') {
        return res.json({ setupRequired: true, tableExists: false });
      }
      throw error;
    }
    res.json({ setupRequired: count === 0, tableExists: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Setup check error:', err);
    // If error checking, assume setup is required
    res.json({ setupRequired: true, error: err.message });
  }
});

// Create admin - allowed without auth only if no admins exist
router.post('/create', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

  try {
    // First, try to create the admins table if it doesn't exist
    try {
      await supabase.rpc('exec', {
        query: `
          CREATE TABLE IF NOT EXISTS admin_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
    } catch (tableErr) {
      // Table creation via RPC might not work, continue anyway
      console.warn('Could not auto-create admin_users table:', tableErr.message);
    }

    const { count, error: countErr } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
    if (countErr && !countErr.message.includes('relation')) {
      throw countErr;
    }

    if (count && count > 0) {
      // admin_users already exist - require admin auth token
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).json({ message: 'Unauthorized. Only existing admins can create new accounts.' });
      try {
        jwt.verify(token, jwtSecret || 'dev-secret');
      } catch (e) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
    }

    // Check existing email
    const { data: existing, error: existingErr } = await supabase.from('admin_users').select('id').eq('email', email).maybeSingle();
    if (existingErr && !existingErr.message.includes('relation')) {
      throw existingErr;
    }
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const { error: insertErr } = await supabase.from('admin_users').insert([{ email, password, role: 'admin' }]);
    if (insertErr) {
      // If table doesn't exist, try creating it again
      if (insertErr.message.includes('relation') || insertErr.code === 'PGRST116') {
        return res.status(500).json({ message: 'Admin_users table does not exist. Please run the SQL schema in your Supabase dashboard.' });
      }
      throw insertErr;
    }

    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Admin creation error:', err);
    res.status(500).json({ message: `Error creating admin account: ${err.message || err}` });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields are required' });

  try {
    const { data, error } = await supabase.from('admin_users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(401).json({ message: 'Invalid email or password' });

    // Plain text password comparison (temporary)
    const isValid = (password === data.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: data.id, email: data.email, role: data.role }, jwtSecret || 'dev-secret', { expiresIn: '24h' });
    res.json({ token, role: data.role, message: 'Login successful' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Verify admin token
router.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret || 'dev-secret');
    res.json({ valid: true, role: decoded.role, message: 'Token is valid' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Logout (client-side token removal, but we track it server-side if needed)
router.post('/logout', (req, res) => {
  // Client should remove token from localStorage
  // Server-side we could add token to blacklist if needed
  res.json({ message: 'Logged out successfully' });
});

// Middleware to verify superadmin role
const verifySuperAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret || 'dev-secret');
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }
    req.adminId = decoded.id;
    req.adminRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Get all admins (super admin only)
router.get('/admins', verifySuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// Create new admin (super admin only)
router.post('/admins', verifySuperAdmin, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if email already exists
    const { data: existing, error: existingErr } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingErr && !existingErr.message.includes('relation')) {
      throw existingErr;
    }
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // Plain text password (temporary)
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{ email, password, role: 'admin' }])
      .select('id, email, role, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Admin created successfully', admin: data });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ message: 'Error creating admin' });
  }
});

// Delete admin (super admin only)
router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
  const { id } = req.params;

  // Prevent deleting the last superadmin
  try {
    const { data: superAdmins, error: countErr } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact' })
      .eq('role', 'superadmin');

    if (countErr) throw countErr;

    const { data: targetAdmin, error: targetErr } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', id)
      .single();

    if (targetErr) throw targetErr;

    if (targetAdmin.role === 'superadmin' && superAdmins.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last super admin' });
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ message: 'Error deleting admin' });
  }
});

export default router;
