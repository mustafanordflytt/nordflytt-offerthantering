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
    const { subscriptionType, filters = {} } = body

    // Create server-side subscription entry (for tracking purposes)
    const { data, error } = await supabase
      .from('realtime_subscriptions')
      .insert([
        {
          user_id: authResult.user.id,
          subscription_type: subscriptionType,
          filters: filters,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error && error.code !== '42P01') { // Ignore if table doesn't exist
      console.error('Failed to create subscription record:', error)
    }

    // Return subscription configuration
    const subscriptionConfig = getSubscriptionConfig(subscriptionType, authResult.user, filters)

    return NextResponse.json({
      success: true,
      subscriptionId: data?.[0]?.id || `temp_${Date.now()}`,
      config: subscriptionConfig,
      message: 'Real-time subscription configured'
    })

  } catch (error: any) {
    console.error('Realtime subscription error:', error)
    return NextResponse.json({
      error: 'Failed to configure subscription',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const subscriptionId = url.searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    // Remove subscription record
    const { error } = await supabase
      .from('realtime_subscriptions')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', subscriptionId)
      .eq('user_id', authResult.user.id)

    if (error && error.code !== '42P01') {
      console.error('Failed to deactivate subscription:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription deactivated'
    })

  } catch (error: any) {
    console.error('Subscription cleanup error:', error)
    return NextResponse.json({
      error: 'Failed to cleanup subscription',
      details: error.message
    }, { status: 500 })
  }
}

function getSubscriptionConfig(subscriptionType: string, user: any, filters: any) {
  const config: any = {
    tables: [],
    channels: [],
    permissions: []
  }

  switch (subscriptionType) {
    case 'staff_dashboard':
      config.tables = ['jobs', 'notifications', 'bookings']
      config.channels = [`staff_${user.id}`, 'all_staff']
      config.permissions = ['read_jobs', 'read_notifications']
      if (filters.teamId) {
        config.filters = { team_id: filters.teamId }
      }
      break

    case 'customer_updates':
      config.tables = ['bookings', 'jobs', 'notifications']
      config.channels = [`customer_${user.id}`]
      config.permissions = ['read_own_bookings', 'read_own_jobs']
      config.filters = { customer_id: user.id }
      break

    case 'admin_monitoring':
      if (!user.roles?.includes('admin')) {
        throw new Error('Admin permissions required')
      }
      config.tables = ['jobs', 'bookings', 'customers', 'leads', 'notifications', 'employees']
      config.channels = ['admin_updates', 'system_alerts']
      config.permissions = ['read_all', 'monitor_system']
      break

    case 'job_updates':
      config.tables = ['jobs', 'job_photos', 'job_updates']
      config.channels = [`job_${filters.jobId}`, `user_${user.id}`]
      config.permissions = ['read_job_updates']
      if (filters.jobId) {
        config.filters = { job_id: filters.jobId }
      }
      break

    case 'calendar_sync':
      config.tables = ['bookings', 'jobs', 'employee_schedules']
      config.channels = [`calendar_${user.id}`, 'team_calendar']
      config.permissions = ['read_calendar', 'read_schedules']
      if (filters.teamId) {
        config.filters = { team_id: filters.teamId }
      }
      break

    case 'chat_messages':
      config.tables = ['chat_messages']
      config.channels = [`chat_${filters.channelId}`, `user_${user.id}`]
      config.permissions = ['read_chat', 'send_messages']
      if (filters.channelId) {
        config.filters = { channel_id: filters.channelId }
      }
      break

    case 'notifications':
      config.tables = ['notifications', 'notification_queue']
      config.channels = [`notifications_${user.id}`]
      config.permissions = ['read_notifications']
      config.filters = { recipient_id: user.id }
      break

    default:
      throw new Error(`Unsupported subscription type: ${subscriptionType}`)
  }

  return config
}