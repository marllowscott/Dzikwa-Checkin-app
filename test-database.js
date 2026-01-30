// test-database.js
// Test script to check database connectivity and table access
// Usage: node test-database.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = 'https://hzlmanxrheleolnfonni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bG1hbnhyaGVsZW9sbmZvbm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA1ODAsImV4cCI6MjA3NDQ3NjU4MH0.bG0jkFbiyArBkOijrgO5W0ULORyieSZOsc4kz_INrrg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🧪 Testing database connectivity and table access...');

  try {
    // Test basic connectivity
    console.log('📡 Testing basic connectivity...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('check_ins')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.error('❌ Basic connectivity test failed:', healthError);
      return;
    }
    console.log('✅ Basic connectivity OK');

    // Test saved_logs table access
    console.log('📋 Testing saved_logs table access...');
    const { data: savedLogs, error: savedLogsError } = await supabase
      .from('saved_logs')
      .select('*')
      .limit(1);

    if (savedLogsError) {
      console.error('❌ saved_logs table access failed:', {
        message: savedLogsError.message,
        code: savedLogsError.code,
        details: savedLogsError.details,
        hint: savedLogsError.hint
      });

      if (savedLogsError.code === 'PGRST116') {
        console.log('💡 Table does not exist. Please create it manually in Supabase SQL Editor:');
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

-- Create policy to allow all operations for anonymous users
CREATE POLICY "Allow all operations for anon users on saved_logs" ON saved_logs FOR ALL USING (true);
        `);
      }
    } else {
      console.log('✅ saved_logs table access OK, found', savedLogs?.length || 0, 'records');
    }

    // Test files table access
    console.log('📁 Testing files table access...');
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(1);

    if (filesError) {
      console.error('❌ files table access failed:', filesError);
    } else {
      console.log('✅ files table access OK, found', files?.length || 0, 'records');
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testDatabase();