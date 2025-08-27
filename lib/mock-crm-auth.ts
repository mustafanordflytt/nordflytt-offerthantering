// Mock CRM Authentication Service
// This is a simple mock implementation for demo purposes

interface User {
  id: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  name: string
}

const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@nordflytt.se': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@nordflytt.se',
      role: 'admin',
      name: 'Admin User'
    }
  },
  'manager@nordflytt.se': {
    password: 'manager123',
    user: {
      id: '2',
      email: 'manager@nordflytt.se',
      role: 'manager',
      name: 'Manager User'
    }
  },
  'employee@nordflytt.se': {
    password: 'employee123',
    user: {
      id: '3',
      email: 'employee@nordflytt.se',
      role: 'employee',
      name: 'Employee User'
    }
  }
}

export async function mockSignIn(email: string, password: string): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const userRecord = mockUsers[email]
  
  if (!userRecord || userRecord.password !== password) {
    throw new Error('Invalid email or password')
  }
  
  // Generate a mock JWT token
  const mockToken = btoa(JSON.stringify({
    id: userRecord.user.id,
    email: userRecord.user.email,
    role: userRecord.user.role,
    exp: Date.now() + 86400000 // 24 hours
  }))
  
  // Set auth cookie
  if (typeof window !== 'undefined') {
    document.cookie = `auth-token=${mockToken}; path=/; max-age=86400; samesite=lax`
    document.cookie = `crm-user=${JSON.stringify(userRecord.user)}; path=/; max-age=86400; samesite=lax`
    
    // Also store in localStorage for persistence
    localStorage.setItem('crm-user', JSON.stringify(userRecord.user))
    localStorage.setItem('auth-token', userRecord.user.id)
    localStorage.setItem('crm-token', mockToken) // This is what getAuthHeaders looks for
  }
  
  return userRecord.user
}

export async function mockSignOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    // Clear cookies
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    document.cookie = 'crm-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    
    // Clear localStorage
    localStorage.removeItem('crm-user')
    localStorage.removeItem('auth-token')
    localStorage.removeItem('crm-token')
  }
}

export async function mockGetUser(): Promise<User | null> {
  if (typeof window !== 'undefined') {
    // First check localStorage
    const storedUser = localStorage.getItem('crm-user')
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }
    
    // Then check cookies
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'crm-user' && value) {
        try {
          return JSON.parse(decodeURIComponent(value))
        } catch (e) {
          console.error('Failed to parse user cookie:', e)
        }
      }
    }
  }
  
  return null
}