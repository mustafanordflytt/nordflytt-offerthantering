import { authService } from './auth-service'

export async function getAuthHeaders(): Promise<HeadersInit> {
  // Check localStorage first for development/demo mode
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm-token') : null
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
  
  // Try to get session from authService
  try {
    const session = await authService.getSession()
    if (session) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      }
    }
  } catch (error) {
    console.error('Error getting session:', error)
  }
  
  return {
    'Content-Type': 'application/json'
  }
}

export async function getAuthToken(): Promise<string | null> {
  const session = await authService.getSession()
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('crm-token') : null
  return session?.token || localToken || null
}