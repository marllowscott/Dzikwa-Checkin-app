/**
 * Database Setup Script for Digital Check-In System
 * Run this script to create all required tables in Supabase
 * 
 * Usage: node setup-database.js
 * 
 * Requirements:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * - Or edit the values below
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  console.error('Copy .env.example to .env and fill in your Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up database tables...');

  try {
    // Create admins table
    console.log('Creating admins table...');
    const { error: adminsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS admins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    });

    if (adminsError) {
      // Try direct table creation via SQL if RPC doesn't work
      console.log('RPC approach failed, trying direct SQL...');
    }

    // For Supabase JS client, we need to use the SQL endpoint
    // This is a workaround since the JS client doesn't support raw SQL execution
    console.log('Note: For Supabase, please run the SQL commands manually in your SQL Editor');
    console.log('See database-admin-schema.sql for the SQL commands');

    // Create a sample admin if none exists
    console.log('\nCreating initial admin account...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const { data: existingAdmins, error: countError } = await supabase
      .from('admins')
      .select('id', { count: 'exact', head: true });

    if (countError && !countError.message.includes('relation')) {
      throw countError;
    }

    if (!existingAdmins || existingAdmins.length === 0) {
      const { error: insertError } = await supabase
        .from('admins')
        .insert([{
          name: 'Administrator',
          email: 'admin@example.com',
          password: hashedPassword
        }]);

      if (insertError) {
        if (insertError.message.includes('relation') || insertError.code === 'PGRST116') {
          console.log('\n❌ The admins table does not exist in your Supabase database.');
          console.log('Please run the following SQL in your Supabase SQL Editor:\n');
          console.log('--- SQL Commands ---');
          console.log(`
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
`);
          console.log('--- End SQL ---\n');
          return;
        }
        throw insertError;
      }

      console.log('✅ Initial admin account created!');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change the password after first login!');
    } else {
      console.log('Admin accounts already exist, skipping initial creation.');
    }

    console.log('\n✅ Database setup complete!');

  } catch (error) {
    console.error('Error setting up database:', error.message);

    if (error.message.includes('relation') || error.code === 'PGRST116') {
      console.log('\n❌ The admins table does not exist in your Supabase database.');
      console.log('Please run the following SQL in your Supabase SQL Editor:\n');
      console.log('--- SQL Commands ---');
      console.log(`
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
`);
      console.log('--- End SQL ---\n');
    }
  }
}

setupDatabase();
