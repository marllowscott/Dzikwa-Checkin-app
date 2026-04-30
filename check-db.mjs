import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdighwfpcnhhcnerzzvy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkaWdod2ZwY25oaGNuZXJ6enZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzkzNjIsImV4cCI6MjA4NTI1NTM2Mn0.fp828UyqmkbRQX3QtBZo16AX0fTldqDslrp9M1Wdju0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkActiveRecords() {
  console.log('Checking active records in all domains...');

  // Check employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, is_active')
    .eq('is_active', true);

  if (empError) {
    console.error('Employees query error:', empError);
  } else {
    console.log(`Active employees: ${employees?.length || 0}`);
    employees?.forEach(emp => console.log(`  - ${emp.full_name}`));
  }

  // Check guests
  const { data: guests, error: guestError } = await supabase
    .from('guests')
    .select('id, full_name, is_active')
    .eq('is_active', true);

  if (guestError) {
    console.error('Guests query error:', guestError);
  } else {
    console.log(`Active guests: ${guests?.length || 0}`);
    guests?.forEach(guest => console.log(`  - ${guest.full_name}`));
  }

  // Check children
  const { data: children, error: childError } = await supabase
    .from('dzikwa_children')
    .select('id, full_name, is_active')
    .eq('is_active', true);

  if (childError) {
    console.error('Children query error:', childError);
  } else {
    console.log(`Active children: ${children?.length || 0}`);
    children?.forEach(child => console.log(`  - ${child.full_name}`));
  }
}

checkActiveRecords();