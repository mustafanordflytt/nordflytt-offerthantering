import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔧 Fixar login för mustafa@nordflytt.se...\n')

// Testa att logga in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'mustafa@nordflytt.se',
  password: 'mustafa123'
})

if (error) {
  console.error('❌ Login error:', error)
} else {
  console.log('✅ Login fungerar!')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)
  
  // Skapa CRM user data
  const crmUser = {
    id: data.user.id,
    email: data.user.email,
    name: 'Mustafa Abdulkarim',
    role: 'admin',
    permissions: ['*'],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
  
  console.log('\n📝 CRM User data att spara i localStorage:')
  console.log(JSON.stringify(crmUser, null, 2))
  
  console.log('\n✨ Kör detta i webbläsarens konsol:')
  console.log(`localStorage.setItem('crm-user', '${JSON.stringify(crmUser)}')`)
  
  await supabase.auth.signOut()
}

console.log('\n💡 Om login inte fungerar, prova att:')
console.log('1. Öppna webbläsarens utvecklarverktyg (F12)')
console.log('2. Gå till Console')
console.log('3. Klistra in koden ovan')
console.log('4. Ladda om sidan')