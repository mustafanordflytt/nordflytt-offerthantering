import { NextRequest, NextResponse } from 'next/server'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channel, event, payload, targetUsers = [] } = body

    if (!channel || !event) {
      return NextResponse.json({ 
        error: 'Channel and event are required' 
      }, { status: 400 })
    }

    // Validate user permissions for broadcasting
    if (!canUserBroadcast(authResult.user, channel, event)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions for broadcasting' 
      }, { status: 403 })
    }

    // Create broadcast payload with metadata
    const broadcastPayload = {
      ...payload,
      sender: {
        id: authResult.user.id,
        name: authResult.user.name || authResult.user.email,
        role: authResult.user.role || 'user'
      },
      timestamp: new Date().toISOString(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Send broadcast message
    const { error } = await supabase
      .channel(channel)
      .send({
        type: 'broadcast',
        event: event,
        payload: broadcastPayload
      })

    if (error) {
      console.error('Broadcast error:', error)
      return NextResponse.json({
        error: 'Failed to send broadcast',
        details: error.message
      }, { status: 500 })
    }

    // Log broadcast for audit purposes
    try {
      await supabase.from('broadcast_log').insert([
        {
          channel: channel,
          event: event,
          sender_id: authResult.user.id,
          payload: broadcastPayload,
          target_users: targetUsers,
          created_at: new Date().toISOString()
        }
      ])
    } catch (logError) {
      // Don't fail the broadcast if logging fails
      console.error('Failed to log broadcast:', logError)
    }

    return NextResponse.json({
      success: true,
      messageId: broadcastPayload.messageId,
      channel: channel,
      event: event,
      message: 'Broadcast sent successfully'
    })

  } catch (error: any) {
    console.error('Broadcast API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Get broadcast channels user has access to
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const availableChannels = getUserBroadcastChannels(authResult.user)

    return NextResponse.json({
      success: true,
      channels: availableChannels,
      user: {
        id: authResult.user.id,
        role: authResult.user.role,
        permissions: authResult.permissions
      }
    })

  } catch (error: any) {
    console.error('Get channels error:', error)
    return NextResponse.json({
      error: 'Failed to get channels',
      details: error.message
    }, { status: 500 })
  }
}

function canUserBroadcast(user: any, channel: string, event: string): boolean {
  const userRole = user.role || 'user'
  
  // Admin can broadcast to any channel
  if (userRole === 'admin') {
    return true
  }

  // Staff can broadcast to certain channels
  if (userRole === 'staff') {
    const allowedStaffChannels = [
      'team_updates',
      'job_updates',
      'staff_chat',
      `staff_${user.id}` // User's own channel
    ]
    
    if (allowedStaffChannels.some(allowed => channel.startsWith(allowed))) {
      return true
    }
  }

  // Team leaders can broadcast to their team
  if (user.is_team_leader && channel.startsWith(`team_${user.team_id}`)) {
    return true
  }

  // Users can always broadcast to their own channels
  if (channel === `user_${user.id}` || channel.includes(`_${user.id}`)) {
    return true
  }

  // Check specific event permissions
  const publicEvents = ['ping', 'typing', 'presence_update']
  if (publicEvents.includes(event)) {
    return true
  }

  return false
}

function getUserBroadcastChannels(user: any): any[] {
  const userRole = user.role || 'user'
  const channels: any[] = []

  // User's personal channel
  channels.push({
    name: `user_${user.id}`,
    displayName: 'Personliga meddelanden',
    type: 'personal',
    canBroadcast: true,
    canReceive: true
  })

  if (userRole === 'staff' || userRole === 'admin') {
    channels.push({
      name: 'staff_updates',
      displayName: 'Personaluppdateringar',
      type: 'staff',
      canBroadcast: userRole === 'admin',
      canReceive: true
    })

    channels.push({
      name: 'job_updates',
      displayName: 'Jobbuppdateringar',
      type: 'work',
      canBroadcast: true,
      canReceive: true
    })
  }

  if (user.is_team_leader || userRole === 'admin') {
    channels.push({
      name: `team_${user.team_id || 'default'}`,
      displayName: 'Teamkanal',
      type: 'team',
      canBroadcast: true,
      canReceive: true
    })
  }

  if (userRole === 'admin') {
    channels.push({
      name: 'system_alerts',
      displayName: 'Systemvarningar',
      type: 'system',
      canBroadcast: true,
      canReceive: true
    })

    channels.push({
      name: 'all_users',
      displayName: 'Alla användare',
      type: 'broadcast',
      canBroadcast: true,
      canReceive: true
    })
  }

  return channels
}