// CRM Authentication System with Supabase
import { createClient } from '@supabase/supabase-js'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'

// Initialize Supabase client - use hardcoded values for now
const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjM2ODYsImV4cCI6MjA1OTg5OTY4Nn0.uHo-Hhm9Rm3PMkpCH2t6PUV_dlRnf1ufVSXcWVc1tKg'

// Check if Supabase is properly configured
const isSupabaseConfigured = true

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User roles and permissions
export type CRMRole = 'admin' | 'manager' | 'employee' | 'readonly'

export interface CRMUser {
  id: string
  email: string
  name: string
  role: CRMRole
  permissions: string[]
  department?: string
  avatar?: string
  createdAt: Date
  lastLoginAt?: Date
}

// Permission sets for different roles
const ROLE_PERMISSIONS: Record<CRMRole, string[]> = {
  admin: [
    'customers:read',
    'customers:write',
    'customers:delete',
    'jobs:read',
    'jobs:write',
    'jobs:delete',
    'leads:read',
    'leads:write',
    'leads:delete',
    'employees:read',
    'employees:write',
    'employees:delete',
    'reports:read',
    'settings:read',
    'settings:write',
    'ai:access',
    'automation:access'
  ],
  manager: [
    'customers:read',
    'customers:write',
    'jobs:read',
    'jobs:write',
    'leads:read',
    'leads:write',
    'employees:read',
    'reports:read',
    'ai:access'
  ],
  employee: [
    'customers:read',
    'jobs:read',
    'jobs:write',
    'leads:read',
    'reports:read'
  ],
  readonly: [
    'customers:read',
    'jobs:read',
    'leads:read',
    'reports:read'
  ]
}

export class CRMAuthService {
  private static instance: CRMAuthService
  private currentUser: CRMUser | null = null

  static getInstance(): CRMAuthService {
    if (!CRMAuthService.instance) {
      CRMAuthService.instance = new CRMAuthService()
    }
    return CRMAuthService.instance
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: CRMUser; error?: string }> {
    try {
      // If Supabase is not configured, use mock authentication
      if (!isSupabaseConfigured) {
        return this.mockSignIn(email, password)
      }

      // First, authenticate with Supabase
      const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('Supabase auth error:', authError)
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'No user data returned' }
      }

      // Get user profile from CRM users table
      const { data: profileData, error: profileError } = await supabase!
        .from('crm_users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      let userProfile = profileData

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        
        // Table might not exist, use basic profile based on email
        const role = (authData.user.email === 'admin@nordflytt.se' || authData.user.email === 'mustafa@nordflytt.se') ? 'admin' as CRMRole :
                    authData.user.email === 'manager@nordflytt.se' ? 'manager' as CRMRole : 
                    'employee' as CRMRole
                    
        userProfile = {
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.email!.split('@')[0],
          role,
          department: 'General',
          created_at: new Date().toISOString(),
        }
      }

      // Create CRM user object
      const crmUser: CRMUser = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role || 'employee',
        permissions: ROLE_PERMISSIONS[userProfile.role || 'employee'],
        department: userProfile.department,
        avatar: userProfile.avatar,
        createdAt: new Date(userProfile.created_at),
        lastLoginAt: new Date()
      }

      // Try to update last login (ignore errors if table doesn't exist)
      try {
        await supabase!
          .from('crm_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', crmUser.id)
      } catch (e) {
        // Ignore update errors
      }

      // Store user in memory and cookie
      this.currentUser = crmUser
      setCookie('crm-user', JSON.stringify(crmUser), {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        httpOnly: false, // Accessible to client-side
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      return { success: true, user: crmUser }
    } catch (error) {
      console.error('CRM sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Mock sign in for demo purposes
   */
  private async mockSignIn(email: string, password: string): Promise<{ success: boolean; user?: CRMUser; error?: string }> {
    // Mock users for demo
    const mockUsers: Record<string, { password: string; user: CRMUser }> = {
      'admin@nordflytt.se': {
        password: 'admin123',
        user: {
          id: 'mock-admin-id',
          email: 'admin@nordflytt.se',
          name: 'Admin Användare',
          role: 'admin',
          permissions: ROLE_PERMISSIONS.admin,
          department: 'Management',
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        }
      },
      'manager@nordflytt.se': {
        password: 'manager123',
        user: {
          id: 'mock-manager-id',
          email: 'manager@nordflytt.se',
          name: 'Manager Användare',
          role: 'manager',
          permissions: ROLE_PERMISSIONS.manager,
          department: 'Operations',
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        }
      },
      'employee@nordflytt.se': {
        password: 'employee123',
        user: {
          id: 'mock-employee-id',
          email: 'employee@nordflytt.se',
          name: 'Anställd Användare',
          role: 'employee',
          permissions: ROLE_PERMISSIONS.employee,
          department: 'Field',
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        }
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockUser = mockUsers[email]
    if (!mockUser || mockUser.password !== password) {
      return { success: false, error: 'Felaktig e-postadress eller lösenord' }
    }

    // Store user in memory and cookies
    this.currentUser = mockUser.user
    setCookie('crm-user', JSON.stringify(mockUser.user), {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Also set auth-token for middleware compatibility
    setCookie('auth-token', `mock-token-${mockUser.user.id}`, {
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return { success: true, user: mockUser.user }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
      this.currentUser = null
      deleteCookie('crm-user')
      deleteCookie('auth-token')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  /**
   * Get current user from memory or cookie
   */
  getCurrentUser(): CRMUser | null {
    if (this.currentUser) {
      return this.currentUser
    }

    // Try to get from cookie
    try {
      const userCookie = getCookie('crm-user')
      if (userCookie && typeof userCookie === 'string') {
        const userData = JSON.parse(userCookie)
        this.currentUser = {
          ...userData,
          createdAt: new Date(userData.createdAt),
          lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined
        }
        return this.currentUser
      }
    } catch (error) {
      console.error('Failed to parse user cookie:', error)
      deleteCookie('crm-user')
    }

    return null
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser()
    return user?.permissions.includes(permission) || false
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    return permissions.some(permission => user.permissions.includes(permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    return permissions.every(permission => user.permissions.includes(permission))
  }

  /**
   * Refresh user session
   */
  async refreshSession(): Promise<{ success: boolean; user?: CRMUser }> {
    try {
      if (!supabase) {
        // For mock auth, just return current user if exists
        const user = this.getCurrentUser()
        return user ? { success: true, user } : { success: false }
      }

      const { data, error } = await supabase.auth.getSession()
      
      if (error || !data.session) {
        this.currentUser = null
        deleteCookie('crm-user')
        return { success: false }
      }

      // Update user data from database
      const { data: profileData, error: profileError } = await supabase!
        .from('crm_users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      let userProfile = profileData

      if (profileError || !profileData) {
        // Table might not exist or user not found, use basic profile
        const role = (data.session.user.email === 'admin@nordflytt.se' || data.session.user.email === 'mustafa@nordflytt.se') ? 'admin' as CRMRole :
                    data.session.user.email === 'manager@nordflytt.se' ? 'manager' as CRMRole : 
                    'employee' as CRMRole
                    
        userProfile = {
          id: data.session.user.id,
          email: data.session.user.email!,
          name: data.session.user.email!.split('@')[0],
          role,
          department: 'General',
          created_at: new Date().toISOString(),
        }
      }

      const crmUser: CRMUser = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        permissions: ROLE_PERMISSIONS[userProfile.role],
        department: userProfile.department,
        avatar: userProfile.avatar,
        createdAt: new Date(userProfile.created_at),
        lastLoginAt: userProfile.last_login_at ? new Date(userProfile.last_login_at) : undefined
      }

      this.currentUser = crmUser
      setCookie('crm-user', JSON.stringify(crmUser), {
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      return { success: true, user: crmUser }
    } catch (error) {
      console.error('Session refresh error:', error)
      return { success: false }
    }
  }

  /**
   * Initialize auth state on app load
   */
  async initialize(): Promise<void> {
    try {
      if (!supabase) {
        // For mock auth, just check cookies
        this.getCurrentUser()
        return
      }

      // Check if we have a valid session
      const { data } = await supabase.auth.getSession()
      
      if (data.session) {
        await this.refreshSession()
      } else {
        // Clear any stale data
        this.currentUser = null
        deleteCookie('crm-user')
      }

      // Listen for auth changes
      supabase!.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          this.currentUser = null
          deleteCookie('crm-user')
        } else if (event === 'SIGNED_IN' && session) {
          await this.refreshSession()
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    }
  }

  /**
   * Create a new CRM user (admin only)
   */
  async createUser(userData: {
    email: string
    password: string
    name: string
    role: CRMRole
    department?: string
  }): Promise<{ success: boolean; user?: CRMUser; error?: string }> {
    if (!this.hasPermission('employees:write')) {
      return { success: false, error: 'Insufficient permissions' }
    }

    if (!supabase) {
      return { success: false, error: 'User creation not available in demo mode' }
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase!.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      })

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create user' }
      }

      // Create CRM profile
      const profileData = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department || 'General',
        created_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase!
        .from('crm_users')
        .insert(profileData)

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase!.auth.admin.deleteUser(authData.user.id)
        return { success: false, error: 'Failed to create user profile' }
      }

      const newUser: CRMUser = {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        role: profileData.role,
        permissions: ROLE_PERMISSIONS[profileData.role],
        department: profileData.department,
        createdAt: new Date(profileData.created_at)
      }

      return { success: true, user: newUser }
    } catch (error) {
      console.error('Create user error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}

// Export singleton instance
export const crmAuth = CRMAuthService.getInstance()

// Utility hooks for React components
export function useCRMAuth() {
  return {
    user: crmAuth.getCurrentUser(),
    signIn: crmAuth.signIn.bind(crmAuth),
    signOut: crmAuth.signOut.bind(crmAuth),
    hasPermission: crmAuth.hasPermission.bind(crmAuth),
    hasAnyPermission: crmAuth.hasAnyPermission.bind(crmAuth),
    refreshSession: crmAuth.refreshSession.bind(crmAuth)
  }
}

// Permission checking utilities
export const CRMPermissions = {
  canReadCustomers: () => crmAuth.hasPermission('customers:read'),
  canWriteCustomers: () => crmAuth.hasPermission('customers:write'),
  canDeleteCustomers: () => crmAuth.hasPermission('customers:delete'),
  canReadJobs: () => crmAuth.hasPermission('jobs:read'),
  canWriteJobs: () => crmAuth.hasPermission('jobs:write'),
  canDeleteJobs: () => crmAuth.hasPermission('jobs:delete'),
  canReadLeads: () => crmAuth.hasPermission('leads:read'),
  canWriteLeads: () => crmAuth.hasPermission('leads:write'),
  canDeleteLeads: () => crmAuth.hasPermission('leads:delete'),
  canReadEmployees: () => crmAuth.hasPermission('employees:read'),
  canWriteEmployees: () => crmAuth.hasPermission('employees:write'),
  canDeleteEmployees: () => crmAuth.hasPermission('employees:delete'),
  canReadReports: () => crmAuth.hasPermission('reports:read'),
  canAccessAI: () => crmAuth.hasPermission('ai:access'),
  canAccessAutomation: () => crmAuth.hasPermission('automation:access'),
  canReadSettings: () => crmAuth.hasPermission('settings:read'),
  canWriteSettings: () => crmAuth.hasPermission('settings:write'),
  isAdmin: () => crmAuth.getCurrentUser()?.role === 'admin',
  isManager: () => ['admin', 'manager'].includes(crmAuth.getCurrentUser()?.role || ''),
}