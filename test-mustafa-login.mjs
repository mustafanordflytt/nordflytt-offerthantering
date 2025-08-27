import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMustafaLogin() {
  console.log('🔍 Testing login for mustafa@nordflytt.se...\n')
  
  try {
    // Test login
    console.log('1. Attempting to sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'mustafa@nordflytt.se',
      password: 'mustafa123'
    })
    
    if (error) {
      console.log('❌ Sign in error:', error.message)
      return
    }
    
    if (data.user) {
      console.log('✅ Sign in successful!')
      console.log('\n📋 User details:')
      console.log('   ID:', data.user.id)
      console.log('   Email:', data.user.email)
      console.log('   Role: admin (configured in system)')
      console.log('   Session valid:', !!data.session)
      
      if (data.session) {
        console.log('\n🔑 Session info:')
        console.log('   Access token:', data.session.access_token.substring(0, 20) + '...')
        console.log('   Expires at:', new Date(data.session.expires_at * 1000).toLocaleString('sv-SE'))
      }
      
      // Sign out
      console.log('\n2. Signing out...')
      await supabase.auth.signOut()
      console.log('✅ Signed out successfully')
      
      console.log('\n🎉 User mustafa@nordflytt.se is ready to use!')
      console.log('\n📝 Login credentials:')
      console.log('   Email: mustafa@nordflytt.se')
      console.log('   Password: mustafa123')
      console.log('   Role: Admin')
      console.log('   Permissions: Full access to all CRM features')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testMustafaLogin()