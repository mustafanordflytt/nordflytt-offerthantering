'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { crmAuth } from '@/lib/auth/crm-auth'
import { useToast } from '@/hooks/use-toast'

// User type with permissions
interface CRMUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  name: string
  permissions?: string[]
}

interface AuthContextType {
  user: CRMUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/crm/login', '/signup', '/forgot-password', '/reset-password', '/', '/form', '/offer', '/order-confirmation', '/demo-credit-check']

// Routes that require specific permissions
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/crm/kunder': ['customers:read'],
  '/crm/leads': ['leads:read'],
  '/crm/uppdrag': ['jobs:read'],
  '/crm/anstallda': ['staff:read'],
  '/crm/ekonomi': ['financial:read'],
  '/crm/rapporter': ['reports:read'],
  '/crm/installningar': ['settings:read']
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CRMUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    // Check initial auth state
    checkAuth()
  }, [])

  useEffect(() => {
    // Check route permissions when pathname changes
    if (!loading && pathname) {
      checkRoutePermissions()
    }
  }, [pathname, user, loading])

  const checkAuth = async () => {
    try {
      // Kolla först localStorage
      const savedUser = localStorage.getItem('crm-user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setUser(user)
        } catch (e) {
          localStorage.removeItem('crm-user')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkRoutePermissions = () => {
    // Skip checks for public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname?.startsWith(route + '/')
    )
    
    if (isPublicRoute) return

    // Check if user is authenticated
    if (!user) {
      // Redirect to appropriate login page based on path
      const loginUrl = pathname?.startsWith('/crm') ? '/crm/login' : '/login'
      router.push(`${loginUrl}?from=${encodeURIComponent(pathname || '/')}`)
      return
    }

    // Check specific route permissions
    const requiredPermissions = PROTECTED_ROUTES[pathname || '']
    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
      // Skip permission check for admin users logging in
      if (user?.email === 'admin@nordflytt.se' || user?.email === 'mustafa@nordflytt.se') {
        return
      }
      
      toast({
        title: 'Åtkomst nekad',
        description: 'Du har inte behörighet att visa denna sida',
        variant: 'destructive',
      })
      router.push('/crm/dashboard')
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Använd den nya enkla API:n
      const response = await fetch('/api/auth/crm-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Inloggning misslyckades')
      }
      
      // Spara user i state och localStorage
      setUser(data.user)
      localStorage.setItem('crm-user', JSON.stringify(data.user))
      if (data.token) {
        localStorage.setItem('crm-token', data.token)
        
        // Sätt cookies för middleware
        document.cookie = `auth-token=${data.token}; path=/; max-age=86400` // 24 timmar
        document.cookie = `session-id=${data.user.id}; path=/; max-age=86400`
      }
      
      // Get redirect URL from query params or default to CRM dashboard
      const params = new URLSearchParams(window.location.search)
      const from = params.get('from') || '/crm/dashboard'
      
      toast({
        title: 'Välkommen!',
        description: `Du är nu inloggad som ${data.user.name}`,
      })
      
      router.push(from)
    } catch (error: any) {
      throw new Error(error.message || 'Inloggning misslyckades')
    }
  }

  const signOut = async () => {
    try {
      // Rensa allt
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      localStorage.removeItem('crm-user')
      localStorage.removeItem('crm-token')
      setUser(null)
      router.push('/crm/login')
      
      toast({
        title: 'Utloggad',
        description: 'Du har loggats ut från systemet',
      })
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    // Mock signup - in production this would create a new user
    throw new Error('Registrering är inte tillgänglig i demoläge')
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions?.includes(permission) || false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return permissions.some(p => user.permissions?.includes(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return permissions.every(p => user.permissions?.includes(p))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        signUp,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[]
) {
  return function ProtectedComponent(props: P) {
    const { user, loading, hasAnyPermission } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push('/login')
        } else if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
          router.push('/crm/dashboard')
        }
      }
    }, [user, loading])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Åtkomst nekad</h1>
            <p className="text-gray-600">Du har inte behörighet att visa denna sida</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}