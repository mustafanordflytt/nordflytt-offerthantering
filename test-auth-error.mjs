import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCRMUsersTable() {
  console.log('🔍 Testing CRM users table...\n')
  
  try {
    // First, sign in as Mustafa
    console.log('1. Signing in as mustafa@nordflytt.se...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mustafa@nordflytt.se',
      password: 'mustafa123'
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    console.log('✅ Signed in successfully')
    console.log('   User ID:', authData.user.id)
    
    // Try to fetch from crm_users table
    console.log('\n2. Fetching from crm_users table...')
    const { data: crmUser, error: crmError } = await supabase
      .from('crm_users')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (crmError) {
      console.error('❌ CRM users error:', crmError)
      console.log('\n3. Table might not exist or user not found')
      console.log('   Error code:', crmError.code)
      console.log('   Error message:', crmError.message)
      
      // Check if we can access the table at all
      console.log('\n4. Checking if crm_users table is accessible...')
      const { data: allUsers, error: allError } = await supabase
        .from('crm_users')
        .select('*')
        .limit(1)
      
      if (allError) {
        console.log('❌ Cannot access crm_users table:', allError.message)
      } else {
        console.log('✅ Table exists, found', allUsers?.length || 0, 'users')
      }
    } else {
      console.log('✅ Found CRM user:', crmUser)
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Test complete')
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testCRMUsersTable()