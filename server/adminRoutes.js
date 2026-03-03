import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

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
    const { count, error } = await supabase.from('admins').select('*', { count: 'exact', head: true });
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
          CREATE TABLE IF NOT EXISTS admins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
    } catch (tableErr) {
      // Table creation via RPC might not work, continue anyway
      console.warn('Could not auto-create admins table:', tableErr.message);
    }

    const { count, error: countErr } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    if (countErr && !countErr.message.includes('relation')) {
      throw countErr;
    }

    if (count && count > 0) {
      // admins already exist - require admin auth token
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
    const { data: existing, error: existingErr } = await supabase.from('admins').select('id').eq('email', email).maybeSingle();
    if (existingErr && !existingErr.message.includes('relation')) {
      throw existingErr;
    }
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const { error: insertErr } = await supabase.from('admins').insert([{ name, email, password: hashed }]);
    if (insertErr) {
      // If table doesn't exist, try creating it again
      if (insertErr.message.includes('relation') || insertErr.code === 'PGRST116') {
        return res.status(500).json({ message: 'Admin table does not exist. Please run the SQL schema in your Supabase dashboard.' });
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
    const { data, error } = await supabase.from('admins').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(401).json({ message: 'Invalid email or password' });

    const isValid = await bcrypt.compare(password, data.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: data.id, email: data.email }, jwtSecret || 'dev-secret', { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
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
    jwt.verify(token, jwtSecret || 'dev-secret');
    res.json({ valid: true, message: 'Token is valid' });
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

export default router;
