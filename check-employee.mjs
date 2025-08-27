import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.development.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkEmployee() {
  // Check if employee exists
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('phone', '+46701234567')
    .single()

  if (error) {
    console.log('Employee not found:', error.message)
    
    // List all employees
    const { data: allEmployees } = await supabase
      .from('employees')
      .select('id, name, phone, status')
    
    console.log('\nAll employees:')
    allEmployees?.forEach(emp => {
      console.log(`- ${emp.name} | ${emp.phone} | Status: ${emp.status}`)
    })
  } else {
    console.log('Employee found:', data)
  }
}

checkEmployee()