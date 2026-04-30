import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://qdighwfpnnhcnzerzvyy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkaWdod2ZwY25oaGNuZXJ6enZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzkzNjIsImV4cCI6MjA4NTI1NTM2Mn0.fp828UyqmkbRQX3QtBZo16AX0fTldqDslrp9M1Wdju0-';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seedSuperAdmin() {
  try {
    console.log('🌱 Seeding super admin account...');

    // Check if super admin already exists
    const { data: existingSuperAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('email', 'superadmin@gmail.com')
      .maybeSingle();

    if (checkError && !checkError.message.includes('relation')) {
      throw checkError;
    }

    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists, skipping seed.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create super admin
    const { data, error } = await supabase
      .from('admins')
      .insert([{
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: hashedPassword,
        role: 'superadmin'
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Super admin account created successfully!');
    console.log('📧 Email: superadmin@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: superadmin');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();