/**
 * Real-Time Updates Manager
 * Handles WebSocket connections and live data synchronization
 */

import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class RealtimeManager {
  private supabase;
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }

  /**
   * Subscribe to real-time changes for a specific table
   */
  subscribeToTable(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filter?: { column: string; value: string }
  ): () => void {
    const channelName = filter 
      ? `${table}-${filter.column}-${filter.value}`
      : `${table}-all`;

    // Check if channel already exists
    if (this.channels.has(channelName)) {
      const listeners = this.listeners.get(channelName) || new Set();
      listeners.add(callback);
      this.listeners.set(channelName, listeners);
      
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.unsubscribeFromChannel(channelName);
        }
      };
    }

    // Create new channel
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
        },
        (payload) => {
          const listeners = this.listeners.get(channelName) || new Set();
          listeners.forEach(listener => listener(payload));
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    
    const listeners = new Set<(payload: any) => void>();
    listeners.add(callback);
    this.listeners.set(channelName, listeners);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.unsubscribeFromChannel(channelName);
      }
    };
  }

  /**
   * Subscribe to notifications for a specific user
   */
  subscribeToNotifications(
    userId: string,
    userType: 'staff' | 'customer' | 'admin',
    callback: (notification: any) => void
  ): () => void {
    return this.subscribeToTable(
      'notifications',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          callback(payload.new);
        }
      },
      { column: 'user_id', value: userId }
    );
  }

  /**
   * Subscribe to job updates
   */
  subscribeToJobs(
    callback: (job: any, eventType: string) => void,
    filter?: { staffId?: string; customerId?: string; date?: string }
  ): () => void {
    const subscriptions: (() => void)[] = [];

    // Subscribe to jobs table (use existing table)
    const mainSub = this.subscribeToTable(
      'jobs',
      (payload) => {
        const job = payload.eventType === 'DELETE' ? payload.old : payload.new;
        
        // Apply client-side filters if needed
        if (filter?.customerId && job.customer_id !== filter.customerId) {
          return;
        }
        if (filter?.date && job.scheduled_date !== filter.date) {
          return;
        }

        callback(job, payload.eventType);
      }
    );
    subscriptions.push(mainSub);

    // Return combined unsubscribe function
    return () => {
      subscriptions.forEach(unsub => unsub());
    };
  }

  /**
   * Subscribe to offer updates (using bookings table)
   */
  subscribeToOffers(
    callback: (offer: any, eventType: string) => void,
    customerId?: string
  ): () => void {
    return this.subscribeToTable(
      'bookings',
      (payload) => {
        callback(
          payload.eventType === 'DELETE' ? payload.old : payload.new,
          payload.eventType
        );
      },
      customerId ? { column: 'customer_id', value: customerId } : undefined
    );
  }

  /**
   * Subscribe to lead updates
   */
  subscribeToLeads(
    callback: (lead: any, eventType: string) => void
  ): () => void {
    return this.subscribeToTable(
      'leads',
      (payload) => {
        callback(
          payload.eventType === 'DELETE' ? payload.old : payload.new,
          payload.eventType
        );
      }
    );
  }

  /**
   * Broadcast a custom event
   */
  async broadcastEvent(
    channel: string,
    event: string,
    payload: any
  ): Promise<void> {
    const broadcastChannel = this.supabase.channel(channel);
    await broadcastChannel.send({
      type: 'broadcast',
      event,
      payload
    });
  }

  /**
   * Subscribe to custom events
   */
  subscribeToCustomEvent(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): () => void {
    const channelInstance = this.supabase
      .channel(channel)
      .on('broadcast', { event }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();

    this.channels.set(`custom-${channel}-${event}`, channelInstance);

    return () => {
      channelInstance.unsubscribe();
      this.channels.delete(`custom-${channel}-${event}`);
    };
  }

  /**
   * Clean up a specific channel
   */
  private unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      this.listeners.delete(channelName);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.listeners.clear();
  }

  /**
   * Helper to check if staff is assigned to job
   */
  private isStaffAssignedToJob(job: any, staffId: string): boolean {
    if (job.team_leader_id === staffId) return true;
    
    const teamMembers = job.team_members || [];
    return teamMembers.some((member: any) => member.id === staffId);
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();