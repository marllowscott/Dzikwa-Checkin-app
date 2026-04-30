const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://qdighwfpnnhcnzerzvyy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    console.log('Creating admin table...');
    
    // Create admin_users table
    const { error: tableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Disable RLS for admin table
        ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
      `
    });

    if (tableError) {
      console.log('Table creation error (might be expected):', tableError.message);
    }

    console.log('Creating admin user...');
    
    // Insert admin user with plain text password for now
    const { data, error } = await supabase
      .from('admin_users')
      .upsert([{
        full_name: 'System Admin',
        email: 'admin@example.com',
        password_hash: 'admin123' // Plain text for quick setup
      }])
      .select();

    if (error) {
      console.error('Error creating admin:', error);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Data:', data);

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();
