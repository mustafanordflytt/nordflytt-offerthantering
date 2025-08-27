// Mock authentication service for demo purposes
// In production, this would use real Supabase authentication

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'employee' | 'readonly'
  permissions: string[]
}

export interface AuthSession {
  user: AuthUser
  token: string
  expiresAt: Date
}

// Mock users database
const MOCK_USERS = {
  'admin@nordflytt.se': {
    id: '1',
    email: 'admin@nordflytt.se',
    password: 'admin123',
    name: 'Admin Användare',
    role: 'admin' as const,
  },
  'manager@nordflytt.se': {
    id: '2',
    email: 'manager@nordflytt.se',
    password: 'manager123',
    name: 'Chef Användare',
    role: 'manager' as const,
  },
  'employee@nordflytt.se': {
    id: '3',
    email: 'employee@nordflytt.se',
    password: 'employee123',
    name: 'Anställd Användare',
    role: 'employee' as const,
  }
}

// Permission definitions
const ROLE_PERMISSIONS = {
  admin: [
    'customers:read', 'customers:write', 'customers:delete',
    'leads:read', 'leads:write', 'leads:delete', 
    'jobs:read', 'jobs:write', 'jobs:delete',
    'staff:read', 'staff:write', 'staff:delete',
    'financial:read', 'financial:write',
    'reports:read', 'reports:write',
    'settings:read', 'settings:write'
  ],
  manager: [
    'customers:read', 'customers:write',
    'leads:read', 'leads:write',
    'jobs:read', 'jobs:write',
    'staff:read', 'staff:write',
    'financial:read',
    'reports:read'
  ],
  employee: [
    'customers:read',
    'leads:read', 'leads:write',
    'jobs:read', 'jobs:write'
  ],
  readonly: [
    'customers:read',
    'leads:read',
    'jobs:read'
  ]
}

class MockAuthService {
  private currentSession: AuthSession | null = null

  constructor() {
    // Check for existing session in localStorage
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('crm_auth_session')
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession)
          if (new Date(session.expiresAt) > new Date()) {
            this.currentSession = session
          } else {
            localStorage.removeItem('crm_auth_session')
          }
        } catch (e) {
          localStorage.removeItem('crm_auth_session')
        }
      }
    }
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const user = MOCK_USERS[email as keyof typeof MOCK_USERS]
    
    if (!user || user.password !== password) {
      throw new Error('Felaktig e-postadress eller lösenord')
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role]
    }

    const session: AuthSession = {
      user: authUser,
      token: `mock-jwt-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }

    this.currentSession = session
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_auth_session', JSON.stringify(session))
    }

    return session
  }

  async signOut(): Promise<void> {
    this.currentSession = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_auth_session')
    }
  }

  async getSession(): Promise<AuthSession | null> {
    return this.currentSession
  }

  async getUser(): Promise<AuthUser | null> {
    return this.currentSession?.user || null
  }

  hasPermission(permission: string): boolean {
    if (!this.currentSession) return false
    return this.currentSession.user.permissions.includes(permission)
  }

  hasRole(role: string): boolean {
    if (!this.currentSession) return false
    return this.currentSession.user.role === role
  }

  isAuthenticated(): boolean {
    return !!this.currentSession
  }
}

// Export singleton instance
export const authService = new MockAuthService()

// Export mock functions that match the original auth-service interface
export const signIn = (email: string, password: string) => authService.signIn(email, password)
export const signOut = () => authService.signOut()
export const getSession = () => authService.getSession()
export const getUser = () => authService.getUser()
export const hasPermission = (permission: string) => authService.hasPermission(permission)
export const hasRole = (role: string) => authService.hasRole(role)
export const isAuthenticated = () => authService.isAuthenticated()