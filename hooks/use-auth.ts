'use client'

import { useState, useEffect } from 'react'
import { authService, AuthUser } from '@/lib/auth/auth-service'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser().then(user => {
      setUser(user)
      setLoading(false)
    })

    // Subscribe to changes
    const { data: { subscription } } = authService.onAuthStateChange(user => {
      setUser(user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    signIn: authService.signIn.bind(authService),
    signOut: authService.signOut.bind(authService),
    signUp: authService.signUp.bind(authService),
    hasPermission: authService.hasPermission.bind(authService)
  }
}