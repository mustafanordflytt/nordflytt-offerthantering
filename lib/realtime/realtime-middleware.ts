import { NextRequest } from 'next/server'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

export interface RealtimeAuthResult {
  isValid: boolean
  user: any
  permissions: string[]
  channels: string[]
  error?: string
}

export async function validateRealtimeAuth(request: NextRequest): Promise<RealtimeAuthResult> {
  try {
    // First validate basic CRM authentication
    const authResult = await validateCRMAuth(request)
    
    if (!authResult.isValid || !authResult.user) {
      return {
        isValid: false,
        user: null,
        permissions: [],
        channels: [],
        error: 'Invalid authentication'
      }
    }

    // Get user-specific realtime permissions and channels
    const channels = getUserRealtimeChannels(authResult.user)
    const permissions = getUserRealtimePermissions(authResult.user, authResult.permissions)

    return {
      isValid: true,
      user: authResult.user,
      permissions: permissions,
      channels: channels
    }

  } catch (error: any) {
    return {
      isValid: false,
      user: null,
      permissions: [],
      channels: [],
      error: error.message
    }
  }
}

function getUserRealtimeChannels(user: any): string[] {
  const channels: string[] = []
  const userRole = user.role || 'user'

  // Personal channel - every user gets their own
  channels.push(`user:${user.id}`)

  // Role-based channels
  if (userRole === 'staff' || userRole === 'admin') {
    channels.push('staff:updates')
    channels.push('jobs:all')
    
    // Staff can subscribe to their specific job updates
    if (user.team_id) {
      channels.push(`team:${user.team_id}`)
    }
  }

  if (userRole === 'customer') {
    channels.push(`customer:${user.id}`)
    channels.push('customer:updates')
  }

  if (userRole === 'admin') {
    channels.push('admin:all')
    channels.push('system:alerts')
    channels.push('notifications:all')
    channels.push('leads:all')
    channels.push('customers:all')
    channels.push('bookings:all')
  }

  // Manager permissions
  if (userRole === 'manager' || user.is_team_leader) {
    channels.push('management:updates')
    channels.push('reports:realtime')
    if (user.team_id) {
      channels.push(`team:${user.team_id}:management`)
    }
  }

  return channels
}

function getUserRealtimePermissions(user: any, basePermissions: string[]): string[] {
  const permissions: string[] = [...basePermissions]
  const userRole = user.role || 'user'

  // Basic realtime permissions
  permissions.push('realtime:connect')
  permissions.push('realtime:subscribe_own')

  // Role-based permissions
  switch (userRole) {
    case 'admin':
      permissions.push('realtime:subscribe_all')
      permissions.push('realtime:broadcast_all')
      permissions.push('realtime:monitor')
      permissions.push('realtime:manage_channels')
      break

    case 'manager':
      permissions.push('realtime:subscribe_team')
      permissions.push('realtime:broadcast_team')
      permissions.push('realtime:view_analytics')
      break

    case 'staff':
      permissions.push('realtime:subscribe_jobs')
      permissions.push('realtime:broadcast_job_updates')
      permissions.push('realtime:subscribe_team')
      break

    case 'customer':
      permissions.push('realtime:subscribe_own_bookings')
      permissions.push('realtime:subscribe_own_jobs')
      break
  }

  // Team leader permissions
  if (user.is_team_leader) {
    permissions.push('realtime:broadcast_team')
    permissions.push('realtime:manage_team_channels')
  }

  return permissions
}

export function canUserAccessChannel(user: any, permissions: string[], channel: string): boolean {
  const userRole = user.role || 'user'

  // Admin can access everything
  if (userRole === 'admin' && permissions.includes('realtime:subscribe_all')) {
    return true
  }

  // Parse channel format: "type:identifier"
  const [channelType, channelId] = channel.split(':')

  switch (channelType) {
    case 'user':
      // Users can only access their own user channel
      return channelId === user.id

    case 'customer':
      // Customers can access their own channel, staff/admin can access all
      return channelId === user.id || 
             ['staff', 'admin', 'manager'].includes(userRole)

    case 'staff':
      // Only staff and admin can access staff channels
      return ['staff', 'admin', 'manager'].includes(userRole)

    case 'team':
      // Users can access their team channels
      if (channelId === user.team_id) return true
      // Admin and managers can access all teams
      return ['admin', 'manager'].includes(userRole)

    case 'jobs':
    case 'bookings':
      // Staff and admin can access job/booking channels
      return ['staff', 'admin', 'manager'].includes(userRole) ||
             permissions.includes('realtime:subscribe_jobs')

    case 'leads':
    case 'customers':
      // Sales and admin can access lead/customer channels  
      return ['admin', 'manager', 'sales'].includes(userRole)

    case 'admin':
    case 'system':
      // Only admin can access admin/system channels
      return userRole === 'admin'

    case 'notifications':
      // Users can access notification channels they have permission for
      return permissions.includes('realtime:subscribe_notifications') ||
             userRole === 'admin'

    default:
      // Unknown channel type - deny by default
      return false
  }
}

export function canUserBroadcastToChannel(user: any, permissions: string[], channel: string): boolean {
  const userRole = user.role || 'user'

  // Admin can broadcast to everything
  if (userRole === 'admin' && permissions.includes('realtime:broadcast_all')) {
    return true
  }

  const [channelType, channelId] = channel.split(':')

  switch (channelType) {
    case 'user':
      // Users can broadcast to their own channel
      return channelId === user.id

    case 'team':
      // Team leaders and managers can broadcast to their teams
      return (channelId === user.team_id && user.is_team_leader) ||
             ['admin', 'manager'].includes(userRole) ||
             permissions.includes('realtime:broadcast_team')

    case 'staff':
      // Staff can broadcast general updates
      return ['staff', 'admin', 'manager'].includes(userRole)

    case 'jobs':
      // Staff can broadcast job updates
      return permissions.includes('realtime:broadcast_job_updates')

    case 'notifications':
      // Only admin and system can broadcast notifications
      return userRole === 'admin' || 
             permissions.includes('realtime:broadcast_notifications')

    case 'system':
    case 'admin':
      // Only admin can broadcast system messages
      return userRole === 'admin'

    default:
      return false
  }
}

export interface RealtimeRateLimit {
  maxMessagesPerMinute: number
  maxChannelsPerUser: number
  maxBroadcastsPerHour: number
}

export function getUserRateLimit(user: any): RealtimeRateLimit {
  const userRole = user.role || 'user'

  switch (userRole) {
    case 'admin':
      return {
        maxMessagesPerMinute: 1000,
        maxChannelsPerUser: 100,
        maxBroadcastsPerHour: 500
      }

    case 'manager':
      return {
        maxMessagesPerMinute: 200,
        maxChannelsPerUser: 50,
        maxBroadcastsPerHour: 100
      }

    case 'staff':
      return {
        maxMessagesPerMinute: 100,
        maxChannelsPerUser: 20,
        maxBroadcastsPerHour: 50
      }

    case 'customer':
      return {
        maxMessagesPerMinute: 30,
        maxChannelsPerUser: 5,
        maxBroadcastsPerHour: 10
      }

    default:
      return {
        maxMessagesPerMinute: 20,
        maxChannelsPerUser: 3,
        maxBroadcastsPerHour: 5
      }
  }
}