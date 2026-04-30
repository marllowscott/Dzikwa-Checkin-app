/**
 * Setup Admin User Script
 * Creates the initial admin user with the specified credentials
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Use the credentials from .env
const supabaseUrl = 'https://qdighwfpnnhcnzerzvyy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkaWdod2ZwY25oaGNuZXJ6enZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY3OQM2MiwiZXhwIjoyMDg1MjU1MzYyfQ.gr4FoHP_a6BN3fEKVosvtZvi7YA1WM1LdtTeBh4vhOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log('Creating admin user...');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Try to create the admin user
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert([{
        full_name: 'System Administrator',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'super_admin',
        can_create_admins: true
      }]);

    if (insertError) {
      if (insertError.message.includes('relation') || insertError.code === 'PGRST116') {
        console.log('\n❌ The admin_users table does not exist.');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log(`
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  can_create_admins BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        return;
      }

      // If it's a duplicate key error, try updating instead
      if (insertError.code === '23505') {
        console.log('Admin user already exists. Updating...');
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            password_hash: hashedPassword,
            can_create_admins: true,
            role: 'super_admin',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'admin@example.com');

        if (updateError) throw updateError;
        console.log('✅ Admin user updated successfully!');
      } else {
        throw insertError;
      }
    } else {
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: Super Admin (can create/manage other admins)');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
}

createAdminUser();