// test-checkout.js
// Test the individual checkout functionality
// Usage: node test-checkout.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = 'https://hzlmanxrheleolnfonni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bG1hbnhyaGVsZW9sbmZvbm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA1ODAsImV4cCI6MjA3NDQ3NjU4MH0.bG0jkFbiyArBkOijrgO5W0ULORyieSZOsc4kz_INrrg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheckout() {
  console.log('🧪 Testing individual checkout functionality...');

  try {
    // First, check if checked_out column exists
    console.log('📋 Checking if checked_out column exists...');
    const { data: testRecord, error: testError } = await supabase
      .from('check_ins')
      .select('id, checked_out')
      .limit(1);

    if (testError) {
      console.error('❌ checked_out column does not exist. Please run this SQL in your Supabase dashboard:');
      console.log(`
ALTER TABLE check_ins
ADD COLUMN IF NOT EXISTS checked_out BOOLEAN DEFAULT false;
      `);
      return;
    }

    console.log('✅ checked_out column exists');

    // Create a test check-in record
    console.log('📝 Creating a test check-in record...');
    const { data: newRecord, error: insertError } = await supabase
      .from('check_ins')
      .insert([{
        full_name: 'Test Employee',
        check_in_time: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create test record:', insertError);
      return;
    }

    console.log('✅ Test record created:', newRecord.id);

    // Test checkout functionality
    console.log('🚪 Testing checkout functionality...');
    const { error: checkoutError } = await supabase
      .from('check_ins')
      .update({
        check_out_time: new Date().toISOString(),
        checked_out: true
      })
      .eq('id', newRecord.id);

    if (checkoutError) {
      console.error('❌ Checkout failed:', checkoutError);
    } else {
      console.log('✅ Checkout successful');

      // Verify the record was updated
      const { data: updatedRecord, error: verifyError } = await supabase
        .from('check_ins')
        .select('id, checked_out, check_out_time')
        .eq('id', newRecord.id)
        .single();

      if (verifyError) {
        console.error('❌ Failed to verify checkout:', verifyError);
      } else {
        console.log('✅ Checkout verified:', {
          id: updatedRecord.id,
          checked_out: updatedRecord.checked_out,
          check_out_time: updatedRecord.check_out_time
        });
      }
    }

    // Clean up test record
    console.log('🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('check_ins')
      .delete()
      .eq('id', newRecord.id);

    if (deleteError) {
      console.error('⚠️ Failed to clean up test record:', deleteError);
    } else {
      console.log('✅ Test record cleaned up');
    }

    console.log('🎉 Individual checkout functionality test completed!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testCheckout();