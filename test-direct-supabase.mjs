import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDirectAuth() {
  console.log('🔍 Testing direct Supabase authentication...\n')
  
  try {
    // Test login
    console.log('1. Attempting to sign in with admin@nordflytt.se...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@nordflytt.se',
      password: 'admin123'
    })
    
    if (error) {
      console.log('❌ Sign in error:', error.message)
      return
    }
    
    if (data.user) {
      console.log('✅ Sign in successful!')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      console.log('   Session:', data.session ? 'Valid' : 'Invalid')
      
      if (data.session) {
        console.log('   Access token:', data.session.access_token.substring(0, 20) + '...')
      }
      
      // Sign out
      console.log('\n2. Signing out...')
      await supabase.auth.signOut()
      console.log('✅ Signed out successfully')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testDirectAuth()