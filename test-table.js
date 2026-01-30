// test-table.js
// Test if saved_logs table exists and is accessible
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hzlmanxrheleolnfonni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bG1hbnhyaGVsZW9sbmZvbm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA1ODAsImV4cCI6MjA3NDQ3NjU4MH0.bG0jkFbiyArBkOijrgO5W0ULORyieSZOsc4kz_INrrg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable() {
  console.log('🧪 Testing saved_logs table access...');

  try {
    // Test 1: Simple select query
    console.log('Test 1: Basic select query...');
    const { data, error } = await supabase
      .from('saved_logs')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Test 1 Failed:', error);
      console.log('Error Code:', error.code);
      console.log('Error Message:', error.message);
      console.log('Error Details:', error.details);
      console.log('Error Hint:', error.hint);
    } else {
      console.log('✅ Test 1 Passed: Table exists and is accessible');
      console.log('Data:', data);
    }

    // Test 2: Try to get table info via RPC if available
    console.log('\nTest 2: Checking table structure...');
    try {
      const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', { table_name: 'saved_logs' });
      if (tableError) {
        console.log('ℹ️ RPC not available, this is normal');
      } else {
        console.log('✅ Table info:', tableInfo);
      }
    } catch (rpcError) {
      console.log('ℹ️ RPC test skipped (expected)');
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testTable();