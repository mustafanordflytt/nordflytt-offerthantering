'use client'

import { ReactNode } from 'react'
import { CRMPermissions, crmAuth, CRMRole } from '@/lib/auth/crm-auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldX } from 'lucide-react'

interface CRMPermissionGuardProps {
  children: ReactNode
  permissions?: string[]
  roles?: CRMRole[]
  requireAll?: boolean // If true, user must have ALL permissions/roles. If false, ANY is sufficient
  fallback?: ReactNode
  showError?: boolean
}

export default function CRMPermissionGuard({
  children,
  permissions = [],
  roles = [],
  requireAll = true,
  fallback,
  showError = true
}: CRMPermissionGuardProps) {
  const currentUser = crmAuth.getCurrentUser()

  if (!currentUser) {
    return fallback || (showError ? (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Du måste logga in för att se detta innehåll.
        </AlertDescription>
      </Alert>
    ) : null)
  }

  // Check role requirements
  const hasRequiredRole = roles.length === 0 || (
    requireAll 
      ? roles.every(role => hasRoleOrHigher(currentUser.role, role))
      : roles.some(role => hasRoleOrHigher(currentUser.role, role))
  )

  // Check permission requirements
  const hasRequiredPermissions = permissions.length === 0 || (
    requireAll
      ? permissions.every(permission => currentUser.permissions.includes(permission))
      : permissions.some(permission => currentUser.permissions.includes(permission))
  )

  if (!hasRequiredRole || !hasRequiredPermissions) {
    return fallback || (showError ? (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Du har inte behörighet att se detta innehåll.
          {permissions.length > 0 && (
            <div className="mt-2">
              <strong>Krävs:</strong> {permissions.join(', ')}
            </div>
          )}
          {roles.length > 0 && (
            <div className="mt-1">
              <strong>Roll:</strong> {roles.join(', ')} eller högre
            </div>
          )}
        </AlertDescription>
      </Alert>
    ) : null)
  }

  return <>{children}</>
}

// Helper function to check role hierarchy
function hasRoleOrHigher(userRole: CRMRole, requiredRole: CRMRole): boolean {
  const roleHierarchy: Record<CRMRole, number> = {
    readonly: 1,
    employee: 2,
    manager: 3,
    admin: 4
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Convenience components for common permission checks
export function AdminOnly({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      roles={['admin']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

export function ManagerOrHigher({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      roles={['manager']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

export function CanReadCustomers({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      permissions={['customers:read']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

export function CanWriteCustomers({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      permissions={['customers:write']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

export function CanDeleteCustomers({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      permissions={['customers:delete']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

export function CanReadReports({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      permissions={['reports:read']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

export function CanAccessAI({ children, fallback, showError = true }: {
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}) {
  return (
    <CRMPermissionGuard
      permissions={['ai:access']}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </CRMPermissionGuard>
  )
}

// Hook for conditional rendering in components
export function useCRMPermissions() {
  const currentUser = crmAuth.getCurrentUser()

  return {
    user: currentUser,
    hasPermission: (permission: string) => 
      currentUser?.permissions.includes(permission) || false,
    hasRole: (role: CRMRole) => currentUser?.role === role,
    hasRoleOrHigher: (role: CRMRole) => 
      currentUser ? hasRoleOrHigher(currentUser.role, role) : false,
    isAdmin: currentUser?.role === 'admin',
    isManager: currentUser && ['admin', 'manager'].includes(currentUser.role),
    canRead: (resource: string) => 
      currentUser?.permissions.includes(`${resource}:read`) || false,
    canWrite: (resource: string) => 
      currentUser?.permissions.includes(`${resource}:write`) || false,
    canDelete: (resource: string) => 
      currentUser?.permissions.includes(`${resource}:delete`) || false,
  }
}