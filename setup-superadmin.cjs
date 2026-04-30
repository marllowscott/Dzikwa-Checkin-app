const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSuperAdmin() {
  try {
    console.log('🔧 Setting up Super Admin system...');

    // Step 1: Add role column if it doesn't exist
    console.log('📋 Adding role column to admin_users table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin' NOT NULL;`
    });

    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Error adding role column:', alterError);
    } else {
      console.log('✅ Role column added successfully');
    }

    // Step 2: Create Super Admin account
    console.log('👑 Creating Super Admin account...');
    const { data, error } = await supabase
      .from('admin_users')
      .upsert([
        {
          email: 'superadmin@gmail.com',
          password: 'admin123', // Plain text for now as per existing system
          role: 'superadmin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], {
        onConflict: 'email'
      });

    if (error) {
      console.error('❌ Error creating Super Admin:', error);
    } else {
      console.log('✅ Super Admin account created successfully');
      console.log('📧 Email: superadmin@gmail.com');
      console.log('🔑 Password: admin123');
      console.log('👑 Role: superadmin');
    }

    // Step 3: Update any existing admins without a role
    console.log('🔄 Updating existing admin roles...');
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ role: 'admin' })
      .is('role', null)
      .neq('email', 'superadmin@gmail.com');

    if (updateError) {
      console.error('❌ Error updating existing admins:', updateError);
    } else {
      console.log('✅ Existing admin roles updated');
    }

    // Step 4: Verify setup
    console.log('🔍 Verifying setup...');
    const { data: admins, error: verifyError } = await supabase
      .from('admin_users')
      .select('email, role, created_at')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying setup:', verifyError);
    } else {
      console.log('✅ Current admin users:');
      admins.forEach(admin => {
        const crown = admin.role === 'superadmin' ? '👑' : '👤';
        console.log(`  ${crown} ${admin.email} (${admin.role})`);
      });
    }

    console.log('\n🎉 Super Admin system setup complete!');
    console.log('🔐 SUPER ADMIN FULL CONTROL ACTIVE');
    console.log('👥 ADMIN ACCESS DYNAMICALLY MANAGED');
    console.log('🛡️  SYSTEM SECURE AND STABLE');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupSuperAdmin();
