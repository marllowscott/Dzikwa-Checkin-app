// update-schema.js
// Add checked_out column to check_ins table
// Usage: node update-schema.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = 'https://hzlmanxrheleolnfonni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bG1hbnhyaGVsZW9sbmZvbm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA1ODAsImV4cCI6MjA3NDQ3NjU4MH0.bG0jkFbiyArBkOijrgO5W0ULORyieSZOsc4kz_INrrg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
  console.log('🔧 Updating check_ins table schema...');

  try {
    // Add checked_out column to check_ins table
    console.log('📋 Adding checked_out column to check_ins table...');

    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE check_ins
        ADD COLUMN IF NOT EXISTS checked_out BOOLEAN DEFAULT false;
      `
    });

    if (error) {
      console.error('❌ Failed to add checked_out column:', error);
      console.log('💡 Please run this SQL manually in your Supabase SQL Editor:');
      console.log(`
ALTER TABLE check_ins
ADD COLUMN IF NOT EXISTS checked_out BOOLEAN DEFAULT false;
      `);
    } else {
      console.log('✅ Successfully added checked_out column to check_ins table');

      // Update existing records where check_out_time is not null to set checked_out = true
      console.log('🔄 Updating existing records...');
      const { error: updateError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE check_ins
          SET checked_out = true
          WHERE check_out_time IS NOT NULL AND checked_out = false;
        `
      });

      if (updateError) {
        console.log('⚠️ Could not update existing records automatically');
      } else {
        console.log('✅ Updated existing records');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateSchema();