// Direct test of the authentication flow
import { crmAuth } from './lib/auth/crm-auth.js'

async function testLogin() {
  console.log('🔍 Testing direct login for mustafa@nordflytt.se...\n')
  
  try {
    const result = await crmAuth.signIn('mustafa@nordflytt.se', 'mustafa123')
    
    if (result.success) {
      console.log('✅ Login successful!')
      console.log('User:', result.user)
    } else {
      console.log('❌ Login failed:', result.error)
    }
  } catch (error) {
    console.error('💥 Error during login:', error)
    console.error('Stack:', error.stack)
  }
}

testLogin()