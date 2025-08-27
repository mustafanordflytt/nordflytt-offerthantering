// Realtime updates for staff app using Supabase realtime
import { useEffect, useCallback, useState } from 'react'
import { supabase } from '@/lib/database/supabase-client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface RealtimeJobUpdate {
  id: string
  status?: string
  additional_services?: any[]
  photos?: any[]
  updated_at: string
  updated_by?: string
}

export interface RealtimeTimeReport {
  id: string
  employee_id: string
  job_id: string
  status: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
}

export interface RealtimeNotification {
  id: string
  type: 'job_update' | 'new_assignment' | 'urgent_message' | 'system_alert'
  title: string
  message: string
  recipient_id?: string
  created_at: string
  read: boolean
}

export function useRealtimeStaff(staffId?: string) {
  const [jobUpdates, setJobUpdates] = useState<RealtimeJobUpdate[]>([])
  const [timeReports, setTimeReports] = useState<RealtimeTimeReport[]>([])
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  
  // Job updates subscription
  const subscribeToJobUpdates = useCallback(() => {
    const channel = supabase.channel('staff-job-updates')
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Job update received:', payload.new)
          setJobUpdates(prev => {
            const filtered = prev.filter(update => update.id !== payload.new.id)
            return [...filtered, payload.new]
          })
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('New job assigned:', payload.new)
          // Show notification for new job assignment
          const notification: RealtimeNotification = {
            id: `job-${payload.new.id}`,
            type: 'new_assignment',
            title: 'Nytt uppdrag tilldelat',
            message: `Du har fått ett nytt uppdrag: ${payload.new.title || 'Flytt'}`,
            recipient_id: staffId,
            created_at: new Date().toISOString(),
            read: false
          }
          setNotifications(prev => [notification, ...prev])
        }
      )
      .subscribe((status) => {
        console.log('Job updates subscription status:', status)
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : status === 'CLOSED' ? 'disconnected' : 'connecting')
      })
      
    return channel
  }, [staffId])

  // Time reports subscription
  const subscribeToTimeReports = useCallback(() => {
    if (!staffId) return null
    
    const channel = supabase.channel('staff-time-reports')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'staff_timereports',
          filter: `employee_id=eq.${staffId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Time report update:', payload.new || payload.old)
          
          if (payload.eventType === 'DELETE') {
            setTimeReports(prev => prev.filter(report => report.id !== payload.old.id))
          } else {
            const report = payload.new
            setTimeReports(prev => {
              const filtered = prev.filter(r => r.id !== report.id)
              return [...filtered, report]
            })
          }
        }
      )
      .subscribe()
      
    return channel
  }, [staffId])

  // System notifications subscription
  const subscribeToNotifications = useCallback(() => {
    const channel = supabase.channel('staff-notifications')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: staffId ? `recipient_id=eq.${staffId}` : undefined,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('New notification:', payload.new)
          setNotifications(prev => [payload.new, ...prev])
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/nordflytt-logo.png',
              tag: payload.new.id
            })
          }
        }
      )
      .subscribe()
      
    return channel
  }, [staffId])

  // Setup realtime subscriptions
  useEffect(() => {
    let jobChannel: RealtimeChannel | null = null
    let timeChannel: RealtimeChannel | null = null
    let notificationChannel: RealtimeChannel | null = null

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to updates
    jobChannel = subscribeToJobUpdates()
    timeChannel = subscribeToTimeReports()
    notificationChannel = subscribeToNotifications()

    // Cleanup function
    return () => {
      if (jobChannel) {
        supabase.removeChannel(jobChannel)
      }
      if (timeChannel) {
        supabase.removeChannel(timeChannel)
      }
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel)
      }
    }
  }, [subscribeToJobUpdates, subscribeToTimeReports, subscribeToNotifications])

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Send notification to other staff members
  const sendNotification = useCallback(async (
    type: RealtimeNotification['type'],
    title: string,
    message: string,
    recipientId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          type,
          title,
          message,
          recipient_id: recipientId,
          sender_id: staffId,
          read: false
        })

      if (error) {
        console.error('Error sending notification:', error)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }, [staffId])

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length

  return {
    jobUpdates,
    timeReports,
    notifications,
    connectionStatus,
    unreadCount,
    markNotificationRead,
    sendNotification,
    
    // Utility functions
    clearJobUpdates: () => setJobUpdates([]),
    clearNotifications: () => setNotifications([]),
    
    // Connection helpers
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting'
  }
}

// Hook specifically for job status updates
export function useRealtimeJobStatus(jobId: string) {
  const [status, setStatus] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  
  useEffect(() => {
    const channel = supabase.channel(`job-status-${jobId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          setStatus(payload.new.status)
          setLastUpdated(payload.new.updated_at)
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])
  
  return { status, lastUpdated }
}

// Hook for team coordination
export function useTeamCoordination(teamId?: string) {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamMessages, setTeamMessages] = useState<any[]>([])
  
  useEffect(() => {
    if (!teamId) return
    
    const channel = supabase.channel(`team-${teamId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const members = Object.values(newState).flat()
        setTeamMembers(members as any[])
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Team member joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Team member left:', key, leftPresences)
      })
      .on('broadcast', { event: 'team_message' }, ({ payload }) => {
        setTeamMessages(prev => [...prev, payload])
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId])
  
  const sendTeamMessage = useCallback((message: string) => {
    if (teamId) {
      supabase.channel(`team-${teamId}`).send({
        type: 'broadcast',
        event: 'team_message',
        payload: {
          message,
          sender: 'current_user', // Replace with actual user
          timestamp: new Date().toISOString()
        }
      })
    }
  }, [teamId])
  
  return {
    teamMembers,
    teamMessages,
    sendTeamMessage
  }
}