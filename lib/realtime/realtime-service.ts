import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEvent<T = any> {
  eventType: RealtimeEventType
  new: T
  old: T
  schema: string
  table: string
}

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map()

  /**
   * Subscribe to real-time changes for a specific table
   */
  static subscribeToTable<T = any>(
    tableName: string,
    callback: (event: RealtimeEvent<T>) => void,
    filter?: { column?: string; value?: any }
  ): RealtimeSubscription {
    const channelName = `table_${tableName}_${Date.now()}`
    
    let subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: tableName,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        (payload) => {
          callback({
            eventType: payload.eventType as RealtimeEventType,
            new: payload.new as T,
            old: payload.old as T,
            schema: payload.schema,
            table: payload.table
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, subscription)

    return {
      channel: subscription,
      unsubscribe: () => {
        supabase.removeChannel(subscription)
        this.channels.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to job status updates
   */
  static subscribeToJobUpdates(
    callback: (event: RealtimeEvent) => void,
    jobId?: string
  ): RealtimeSubscription {
    return this.subscribeToTable(
      'jobs',
      callback,
      jobId ? { column: 'id', value: jobId } : undefined
    )
  }

  /**
   * Subscribe to customer updates
   */
  static subscribeToCustomerUpdates(
    callback: (event: RealtimeEvent) => void,
    customerId?: string
  ): RealtimeSubscription {
    return this.subscribeToTable(
      'customers',
      callback,
      customerId ? { column: 'id', value: customerId } : undefined
    )
  }

  /**
   * Subscribe to calendar/booking updates
   */
  static subscribeToBookingUpdates(
    callback: (event: RealtimeEvent) => void,
    bookingId?: string
  ): RealtimeSubscription {
    return this.subscribeToTable(
      'bookings',
      callback,
      bookingId ? { column: 'id', value: bookingId } : undefined
    )
  }

  /**
   * Subscribe to staff/employee updates
   */
  static subscribeToStaffUpdates(
    callback: (event: RealtimeEvent) => void,
    staffId?: string
  ): RealtimeSubscription {
    return this.subscribeToTable(
      'employees',
      callback,
      staffId ? { column: 'id', value: staffId } : undefined
    )
  }

  /**
   * Subscribe to invoice/financial updates
   */
  static subscribeToInvoiceUpdates(
    callback: (event: RealtimeEvent) => void,
    customerId?: string
  ): RealtimeSubscription {
    return this.subscribeToTable(
      'invoices',
      callback,
      customerId ? { column: 'customer_id', value: customerId } : undefined
    )
  }

  /**
   * Subscribe to notification updates
   */
  static subscribeToNotificationUpdates(
    callback: (event: RealtimeEvent) => void,
    userId?: string
  ): RealtimeSubscription {
    return this.subscribeToTable(
      'notification_queue',
      callback,
      userId ? { column: 'recipient_id', value: userId } : undefined
    )
  }

  /**
   * Subscribe to presence updates (who's online)
   */
  static subscribeToPresence(
    channelName: string,
    userId: string,
    userMeta: Record<string, any>,
    callbacks: {
      onJoin?: (key: string, currentPresences: any, newPresences: any) => void
      onLeave?: (key: string, currentPresences: any, leftPresences: any) => void
      onSync?: () => void
    }
  ): RealtimeSubscription {
    const channel = supabase.channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        callbacks.onSync?.()
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
        callbacks.onJoin?.(key, currentPresences, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
        callbacks.onLeave?.(key, currentPresences, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...userMeta
          })
        }
      })

    this.channels.set(channelName, channel)

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel)
        this.channels.delete(channelName)
      }
    }
  }

  /**
   * Broadcast a message to a channel
   */
  static async broadcastMessage(
    channelName: string,
    eventName: string,
    payload: any
  ): Promise<void> {
    const channel = this.channels.get(channelName) || supabase.channel(channelName)
    
    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload
    })
  }

  /**
   * Subscribe to broadcast messages
   */
  static subscribeToBroadcast(
    channelName: string,
    eventName: string,
    callback: (payload: any) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: eventName }, ({ payload }) => {
        callback(payload)
      })
      .subscribe()

    this.channels.set(channelName, channel)

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel)
        this.channels.delete(channelName)
      }
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): string {
    return supabase.realtime.connection?.readyState === 1 ? 'connected' : 'disconnected'
  }
}