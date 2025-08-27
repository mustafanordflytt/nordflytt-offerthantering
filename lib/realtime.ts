'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useEffect, useState, useCallback, useRef } from 'react'

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, any>
  old: Record<string, any>
  table: string
}

interface UseRealtimeReturn {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  subscribe: (table: string, callback: (payload: RealtimePayload) => void) => void
  unsubscribe: (table: string) => void
  sendMessage: (table: string, data: Record<string, any>) => Promise<void>
  presence: {
    track: (state: Record<string, any>) => Promise<void>
    untrack: () => Promise<void>
    getState: () => Record<string, any>[]
  }
}

// Global state for realtime connections
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null
const channels = new Map<string, RealtimeChannel>()
const subscribers = new Map<string, Set<(payload: RealtimePayload) => void>>()

export function useRealtime(): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const presenceRef = useRef<RealtimeChannel | null>(null)
  const [presenceState, setPresenceState] = useState<Record<string, any>[]>([])

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseClient) {
      supabaseClient = createClientComponentClient()
    }

    // Setup presence channel
    const setupPresence = async () => {
      if (!supabaseClient) return

      const presenceChannel = supabaseClient.channel('presence', {
        config: {
          presence: {
            key: `user-${Date.now()}`, // Unique key for this user session
          },
        },
      })

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = presenceChannel.presenceState()
          setPresenceState(Object.values(newState).flat())
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences)
        })

      await presenceChannel.subscribe()
      presenceRef.current = presenceChannel
    }

    setupPresence()

    return () => {
      // Cleanup presence
      if (presenceRef.current) {
        presenceRef.current.unsubscribe()
      }
    }
  }, [])

  // Monitor connection status
  useEffect(() => {
    if (!supabaseClient) return

    const handleConnectionChange = (status: string) => {
      console.log('Realtime connection status:', status)
      
      switch (status) {
        case 'CONNECTING':
          setConnectionStatus('connecting')
          setIsConnected(false)
          break
        case 'OPEN':
          setConnectionStatus('connected')
          setIsConnected(true)
          break
        case 'CLOSED':
          setConnectionStatus('disconnected')
          setIsConnected(false)
          break
        default:
          setConnectionStatus('error')
          setIsConnected(false)
      }
    }

    // Listen to realtime status changes
    supabaseClient.realtime.onOpen(() => handleConnectionChange('OPEN'))
    supabaseClient.realtime.onClose(() => handleConnectionChange('CLOSED'))
    supabaseClient.realtime.onError(() => handleConnectionChange('ERROR'))

    return () => {
      // Cleanup all channels
      channels.forEach(channel => {
        channel.unsubscribe()
      })
      channels.clear()
      subscribers.clear()
    }
  }, [])

  const subscribe = useCallback((table: string, callback: (payload: RealtimePayload) => void) => {
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      return
    }

    // Add callback to subscribers
    if (!subscribers.has(table)) {
      subscribers.set(table, new Set())
    }
    subscribers.get(table)?.add(callback)

    // Create channel if it doesn't exist
    if (!channels.has(table)) {
      const channel = supabaseClient
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            const realtimePayload: RealtimePayload = {
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new || {},
              old: payload.old || {},
              table: table
            }

            // Notify all subscribers for this table
            const tableSubscribers = subscribers.get(table)
            if (tableSubscribers) {
              tableSubscribers.forEach(cb => cb(realtimePayload))
            }
          }
        )

      channel.subscribe((status) => {
        console.log(`Subscription status for ${table}:`, status)
      })

      channels.set(table, channel)
    }
  }, [])

  const unsubscribe = useCallback((table: string) => {
    // Remove all subscribers for this table
    subscribers.delete(table)

    // Unsubscribe and remove channel
    const channel = channels.get(table)
    if (channel) {
      channel.unsubscribe()
      channels.delete(table)
    }
  }, [])

  const sendMessage = useCallback(async (table: string, data: Record<string, any>) => {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized')
    }

    try {
      // For chat messages, we'll insert into the database
      // The realtime subscription will pick up the change
      const { error } = await supabaseClient
        .from(table)
        .insert(data)

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [])

  const presence = {
    track: useCallback(async (state: Record<string, any>) => {
      if (!presenceRef.current) return

      await presenceRef.current.track(state)
    }, []),

    untrack: useCallback(async () => {
      if (!presenceRef.current) return

      await presenceRef.current.untrack()
    }, []),

    getState: useCallback(() => {
      return presenceState
    }, [presenceState])
  }

  return {
    isConnected,
    connectionStatus,
    subscribe,
    unsubscribe,
    sendMessage,
    presence
  }
}

// Utility function to broadcast presence updates
export const updateUserPresence = async (userId: string, status: 'online' | 'away' | 'busy' | 'offline', metadata?: Record<string, any>) => {
  if (!supabaseClient) return

  try {
    // Update user status in database
    const { error } = await supabaseClient
      .from('user_presence')
      .upsert({
        user_id: userId,
        status,
        last_seen: new Date().toISOString(),
        metadata: metadata || {}
      })

    if (error) {
      console.error('Error updating presence:', error)
    }
  } catch (error) {
    console.error('Failed to update presence:', error)
  }
}

// Hook for managing user presence
export function useUserPresence(userId: string) {
  const { presence } = useRealtime()
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('offline')

  useEffect(() => {
    // Track user as online when component mounts
    const trackPresence = async () => {
      await presence.track({
        user_id: userId,
        status: 'online',
        last_seen: new Date().toISOString()
      })
      setUserStatus('online')
    }

    trackPresence()

    // Handle visibility change
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await presence.track({
          user_id: userId,
          status: 'away',
          last_seen: new Date().toISOString()
        })
        setUserStatus('away')
      } else {
        await presence.track({
          user_id: userId,
          status: 'online',
          last_seen: new Date().toISOString()
        })
        setUserStatus('online')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      presence.untrack()
      setUserStatus('offline')
    }
  }, [userId, presence])

  const updateStatus = useCallback(async (status: 'online' | 'away' | 'busy' | 'offline') => {
    await presence.track({
      user_id: userId,
      status,
      last_seen: new Date().toISOString()
    })
    setUserStatus(status)
  }, [userId, presence])

  return {
    status: userStatus,
    updateStatus
  }
}

// Connection health check
export function useConnectionHealth() {
  const [health, setHealth] = useState({
    isHealthy: false,
    lastPing: null as Date | null,
    latency: 0
  })

  useEffect(() => {
    const checkHealth = async () => {
      if (!supabaseClient) return

      const start = Date.now()
      
      try {
        // Simple health check - try to fetch from a lightweight table
        await supabaseClient
          .from('health_check')
          .select('id')
          .limit(1)
          .single()

        const latency = Date.now() - start
        
        setHealth({
          isHealthy: true,
          lastPing: new Date(),
          latency
        })
      } catch (error) {
        setHealth(prev => ({
          ...prev,
          isHealthy: false,
          lastPing: new Date()
        }))
      }
    }

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    
    // Initial check
    checkHealth()

    return () => clearInterval(interval)
  }, [])

  return health
}