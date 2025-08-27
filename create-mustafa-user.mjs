import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createMustafaUser() {
  console.log('🔨 Creating user mustafa@nordflytt.se...\n')
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'mustafa@nordflytt.se',
      password: 'mustafa123',
      email_confirm: true,
      user_metadata: {
        name: 'Mustafa Abdulkarim'
      }
    })
    
    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('⚠️  User already exists in auth')
        
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === 'mustafa@nordflytt.se')
        
        if (existingUser) {
          console.log('✅ Found existing user:')
          console.log(`   ID: ${existingUser.id}`)
          console.log(`   Email: ${existingUser.email}`)
          console.log(`   Created: ${new Date(existingUser.created_at).toLocaleString('sv-SE')}`)
          
          // Update password
          console.log('\n📝 Updating password to mustafa123...')
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: 'mustafa123' }
          )
          
          if (updateError) {
            console.log('❌ Failed to update password:', updateError.message)
          } else {
            console.log('✅ Password updated successfully')
          }
        }
      } else {
        console.log('❌ Failed to create user:', authError.message)
      }
      return
    }
    
    if (authData.user) {
      console.log('✅ User created successfully!')
      console.log(`   ID: ${authData.user.id}`)
      console.log(`   Email: ${authData.user.email}`)
      
      // The user will automatically get admin role based on email in crm-auth.ts
      console.log('\n📋 User details:')
      console.log('   Email: mustafa@nordflytt.se')
      console.log('   Password: mustafa123')
      console.log('   Role: admin (automatic based on email)')
    }
    
    // List all users
    console.log('\n📊 All users in system:')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createMustafaUser()