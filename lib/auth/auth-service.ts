import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth service types
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
    'jobs:read', 'jobs:write',
    'reports:read'
  ],
  readonly: [
    'customers:read',
    'leads:read',
    'jobs:read',
    'reports:read'
  ]
}

class AuthService {
  private currentUser: AuthUser | null = null

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (!data.user || !data.session) {
        throw new Error('No user or session returned')
      }

      // Get user profile from CRM users table
      const { data: crmUser, error: profileError } = await supabase
        .from('crm_users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError || !crmUser) {
        // Create default CRM user if doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('crm_users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.email!.split('@')[0],
            role: 'employee',
            is_active: true
          })
          .select()
          .single()

        if (createError) throw createError
        
        this.currentUser = {
          id: data.user.id,
          email: data.user.email!,
          name: newUser.name,
          role: newUser.role,
          permissions: ROLE_PERMISSIONS[newUser.role]
        }
      } else {
        this.currentUser = {
          id: crmUser.id,
          email: crmUser.email,
          name: crmUser.name,
          role: crmUser.role,
          permissions: ROLE_PERMISSIONS[crmUser.role]
        }
      }

      return {
        user: this.currentUser,
        token: data.session.access_token,
        expiresAt: new Date(data.session.expires_at! * 1000)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  // Sign up new user
  async signUp(email: string, password: string, name: string): Promise<AuthSession> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('No user returned from signup')
      }

      // Create CRM user profile
      const { error: profileError } = await supabase
        .from('crm_users')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          role: 'employee',
          is_active: true
        })

      if (profileError) throw profileError

      // Auto sign in after signup
      return this.signIn(email, password)
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(error.message || 'Failed to sign up')
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    this.currentUser = null
  }

  // Get current session
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) return null

      // Get or refresh user data
      if (!this.currentUser && session.user) {
        // First check if we have a crm_users table
        const { data: crmUser, error: crmError } = await supabase
          .from('crm_users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (crmError && crmError.code === 'PGRST204') {
          // Table exists but no user found, create one
          const newUser = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
            role: 'employee' as const,
            is_active: true
          }
          
          await supabase
            .from('crm_users')
            .insert(newUser)
            
          this.currentUser = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            permissions: ROLE_PERMISSIONS[newUser.role]
          }
        } else if (!crmError && crmUser) {
          this.currentUser = {
            id: crmUser.id,
            email: crmUser.email,
            name: crmUser.name,
            role: crmUser.role,
            permissions: ROLE_PERMISSIONS[crmUser.role]
          }
        } else {
          // If table doesn't exist or other error, use basic info
          const role = (session.user.email === 'admin@nordflytt.se' || session.user.email === 'mustafa@nordflytt.se') ? 'admin' : 
                      session.user.email === 'manager@nordflytt.se' ? 'manager' : 'employee'
          
          this.currentUser = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
            role,
            permissions: ROLE_PERMISSIONS[role]
          }
        }
      }

      if (!this.currentUser) return null

      return {
        user: this.currentUser,
        token: session.access_token,
        expiresAt: new Date(session.expires_at! * 1000)
      }
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession()
    return session?.user || null
  }

  // Check if user has permission
  async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    return user.permissions.includes(permission)
  }

  // Check if user has any of the permissions
  async hasAnyPermission(permissions: string[]): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    return permissions.some(p => user.permissions.includes(p))
  }

  // Check if user has all permissions
  async hasAllPermissions(permissions: string[]): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    return permissions.every(p => user.permissions.includes(p))
  }

  // Refresh session
  async refreshSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error || !session) return null

      return this.getSession()
    } catch (error) {
      console.error('Refresh session error:', error)
      return null
    }
  }

  // Update user profile
  async updateProfile(updates: { name?: string; email?: string }): Promise<AuthUser> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('crm_users')
      .update({
        name: updates.name,
        email: updates.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    this.currentUser = {
      ...user,
      name: data.name,
      email: data.email
    }

    return this.currentUser
  }

  // Change password
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  // Reset password request
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}

// Export singleton instance
export const authService = new AuthService()

// React hooks moved to hooks/use-auth.ts for client-side usage