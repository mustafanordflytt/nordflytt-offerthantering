'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffQuickLogin() {
  const router = useRouter()

  useEffect(() => {
    // Auto-login
    const auth = {
      id: 'staff-' + Date.now(),
      name: 'Test Användare',
      email: 'test@nordflytt.se',
      role: 'staff',
      avatar: '👷',
      loginTime: new Date().toISOString()
    }
    
    localStorage.setItem('staff_auth', JSON.stringify(auth))
    
    // Redirect to dashboard
    router.push('/staff/dashboard')
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🚛 Nordflytt Staff</h1>
        <p>Loggar in...</p>
      </div>
    </div>
  )
}