import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdighwfpcnhhcnerzzvy.supabase.co'
const supabaseKey = 'sb_publishable_h8BJKTfWO53QY4GJQPuOqA_N9Vim_VK'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addEmployee() {
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.log('Usage: node add-employee.js "Full Name" [email] [department]')
    console.log('Example: node add-employee.js "John Doe" "john.doe@dzikwa.co.zw" "IT"')
    return
  }

  const fullName = args[0]
  const email = args[1] || null
  const department = args[2] || null

  try {
    console.log(`Adding employee: ${fullName}`)
    
    const { data, error } = await supabase
      .from('employees')
      .insert({
        full_name: fullName,
        email: email,
        department: department,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding employee:', error)
      return
    }

    console.log('✅ Employee added successfully!')
    console.log('📋 Employee Details:')
    console.log(`   Name: ${data.full_name}`)
    console.log(`   Email: ${data.email || 'Not provided'}`)
    console.log(`   Department: ${data.department || 'Not provided'}`)
    console.log(`   ID: ${data.id}`)
    console.log(`   Active: ${data.is_active}`)
    
    // Also add user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: data.id,
        role: 'employee'
      })

    if (roleError) {
      console.error('Warning: Could not assign user role:', roleError)
    } else {
      console.log('✅ User role assigned successfully')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addEmployee()
