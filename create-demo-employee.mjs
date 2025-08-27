import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.development.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createDemoEmployee() {
  console.log('Creating demo employee...')

  const demoEmployee = {
    id: crypto.randomUUID(),
    staff_id: 'DEMO-001',
    name: 'Demo Flyttare',
    email: 'demo@nordflytt.se',
    phone: '+46701234567', // Change this to your test phone
    role: 'Flyttare',
    status: 'active',
    hire_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  }

  try {
    // Check if employee already exists
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('phone', demoEmployee.phone)
      .single()

    if (existing) {
      console.log('✅ Employee already exists:', demoEmployee.phone)
      return
    }

    // Create employee
    const { data, error } = await supabase
      .from('employees')
      .insert([demoEmployee])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating employee:', error)
      return
    }

    console.log('✅ Demo employee created successfully!')
    console.log('Phone:', demoEmployee.phone)
    console.log('Name:', demoEmployee.name)
    console.log('Role:', demoEmployee.role)
    console.log('\n📱 Use this phone number to login to Staff App')
    console.log('OTP will be logged in the console during development')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createDemoEmployee()