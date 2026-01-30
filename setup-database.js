// setup-database.js
// Run this script to set up your Supabase database tables
// Usage: node setup-database.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = 'https://hzlmanxrheleolnfonni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bG1hbnhyaGVsZW9sbmZvbm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA1ODAsImV4cCI6MjA3NDQ3NjU4MH0.bG0jkFbiyArBkOijrgO5W0ULORyieSZOsc4kz_INrrg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up database tables...');

  try {
    // Check if check_ins table exists, if not create it
    console.log('📋 Checking check_ins table...');
    const { data: checkInsTables, error: checkInsError } = await supabase
      .from('check_ins')
      .select('*')
      .limit(1);

    if (checkInsError && checkInsError.code === 'PGRST116') {
      console.log('❌ check_ins table does not exist. Please create it manually in Supabase SQL Editor:');
      console.log(`
-- Create check_ins table
CREATE TABLE check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table for storing uploaded files
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Create saved_logs table for storing archived daily logs
CREATE TABLE saved_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  log_data JSONB NOT NULL,
  json_content TEXT NOT NULL,
  csv_content TEXT NOT NULL,
  summary_content TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  saved_by TEXT DEFAULT 'admin'
);

-- Create index for better query performance
CREATE INDEX idx_check_ins_check_in_time ON check_ins(check_in_time);
CREATE INDEX idx_check_ins_full_name ON check_ins(full_name);

-- Enable Row Level Security (RLS)
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For demo purposes, allowing anon access (adjust as needed for production)
CREATE POLICY "Allow all operations for anon users" ON check_ins
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on files" ON files
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs
  FOR ALL USING (true);
      `);
      return;
    }

    // Check if saved_logs table exists
    console.log('📋 Checking saved_logs table...');
    const { data: savedLogsTables, error: savedLogsError } = await supabase
      .from('saved_logs')
      .select('*')
      .limit(1);

    if (savedLogsError && savedLogsError.code === 'PGRST116') {
      console.log('❌ saved_logs table does not exist. Creating it now...');

      // Create saved_logs table using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS saved_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            date TEXT NOT NULL,
            month TEXT NOT NULL,
            total_records INTEGER NOT NULL,
            log_data JSONB NOT NULL,
            json_content TEXT NOT NULL,
            csv_content TEXT NOT NULL,
            summary_content TEXT NOT NULL,
            saved_at TIMESTAMPTZ DEFAULT NOW(),
            saved_by TEXT DEFAULT 'admin'
          );

          ALTER TABLE saved_logs ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs FOR ALL USING (true);
        `
      });

      if (createError) {
        console.log('❌ Could not create saved_logs table automatically.');
        console.log('📝 Please run this SQL manually in your Supabase SQL Editor:');
        console.log(`
-- Create saved_logs table for storing archived daily logs
CREATE TABLE saved_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  log_data JSONB NOT NULL,
  json_content TEXT NOT NULL,
  csv_content TEXT NOT NULL,
  summary_content TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  saved_by TEXT DEFAULT 'admin'
);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs FOR ALL USING (true);
        `);
      } else {
        console.log('✅ saved_logs table created successfully!');
      }
    } else {
      console.log('✅ saved_logs table already exists!');
      // Even if table exists, ensure policies are in place
      console.log('🔧 Ensuring RLS policies are set up...');
      try {
        // Try to create policy (it will fail if it already exists, but that's ok)
        await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE saved_logs ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Allow all operations for anon users on saved_logs" ON saved_logs;
            CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs FOR ALL USING (true);
          `
        });
        console.log('✅ RLS policies ensured for saved_logs table!');
      } catch (policyError) {
        console.log('⚠️ Could not update policies automatically. Please ensure the following policy exists in your Supabase dashboard:');
        console.log('Policy: "Allow all operations for anon users on saved_logs" ON saved_logs FOR ALL USING (true);');
      }
    }

    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

// Run the setup
setupDatabase();