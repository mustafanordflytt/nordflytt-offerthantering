/**
 * React Hooks for Real-Time Updates
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeManager } from '@/lib/realtime/realtime-manager';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to subscribe to real-time notifications
 */
export function useRealtimeNotifications(userId?: string, userType?: 'staff' | 'customer' | 'admin') {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !userType) return;

    const unsubscribe = realtimeManager.subscribeToNotifications(
      userId,
      userType,
      (notification) => {
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        });

        // Play notification sound if enabled
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/nordflytt-logo.png'
          });
        }
      }
    );

    return unsubscribe;
  }, [userId, userType]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}

/**
 * Hook to subscribe to job updates
 */
export function useRealtimeJobs(filter?: { staffId?: string; customerId?: string; date?: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const previousJobsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // Initial load
    fetchJobs();

    // Subscribe to real-time updates
    const unsubscribe = realtimeManager.subscribeToJobs(
      (job, eventType) => {
        const previousJob = previousJobsRef.current.get(job.id);

        switch (eventType) {
          case 'INSERT':
            setJobs(prev => [job, ...prev]);
            toast({
              title: 'Nytt uppdrag',
              description: `Ett nytt uppdrag har lagts till: ${job.job_number}`,
            });
            break;

          case 'UPDATE':
            setJobs(prev => prev.map(j => j.id === job.id ? job : j));
            
            // Check for status changes
            if (previousJob && previousJob.status !== job.status) {
              toast({
                title: 'Uppdrag uppdaterat',
                description: `${job.job_number} status ändrad till ${job.status}`,
              });
            }
            break;

          case 'DELETE':
            setJobs(prev => prev.filter(j => j.id !== job.id));
            toast({
              title: 'Uppdrag borttaget',
              description: `Uppdrag ${job.job_number} har tagits bort`,
              variant: 'destructive',
            });
            break;
        }

        // Update previous state
        if (eventType === 'DELETE') {
          previousJobsRef.current.delete(job.id);
        } else {
          previousJobsRef.current.set(job.id, job);
        }
      },
      filter
    );

    return () => {
      unsubscribe();
      previousJobsRef.current.clear();
    };
  }, [filter?.staffId, filter?.customerId, filter?.date]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/staff/jobs?' + new URLSearchParams(filter || {}));
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        // Store initial state
        data.jobs.forEach((job: any) => {
          previousJobsRef.current.set(job.id, job);
        });
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  return { jobs, loading, refetch: fetchJobs };
}

/**
 * Hook to subscribe to offer updates
 */
export function useRealtimeOffers(customerId?: string) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    fetchOffers();

    // Subscribe to real-time updates
    const unsubscribe = realtimeManager.subscribeToOffers(
      (offer, eventType) => {
        switch (eventType) {
          case 'INSERT':
            setOffers(prev => [offer, ...prev]);
            break;
          case 'UPDATE':
            setOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
            break;
          case 'DELETE':
            setOffers(prev => prev.filter(o => o.id !== offer.id));
            break;
        }
      },
      customerId
    );

    return unsubscribe;
  }, [customerId]);

  const fetchOffers = async () => {
    try {
      const url = customerId 
        ? `/api/offers?customerId=${customerId}`
        : '/api/offers';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  return { offers, loading, refetch: fetchOffers };
}

/**
 * Hook to subscribe to lead updates
 */
export function useRealtimeLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    fetchLeads();

    // Subscribe to real-time updates
    const unsubscribe = realtimeManager.subscribeToLeads(
      (lead, eventType) => {
        switch (eventType) {
          case 'INSERT':
            setLeads(prev => [lead, ...prev]);
            toast({
              title: 'Ny lead',
              description: `${lead.name} har lagts till som lead`,
            });
            break;
          case 'UPDATE':
            setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
            break;
          case 'DELETE':
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            break;
        }
      }
    );

    return unsubscribe;
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/crm/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  return { leads, loading, refetch: fetchLeads };
}

/**
 * Hook for custom real-time events
 */
export function useRealtimeEvent<T = any>(
  channel: string,
  event: string,
  handler: (payload: T) => void
) {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToCustomEvent(
      channel,
      event,
      handler
    );

    return unsubscribe;
  }, [channel, event]);
}

/**
 * Hook to broadcast custom events
 */
export function useBroadcast() {
  const broadcast = useCallback(async (
    channel: string,
    event: string,
    payload: any
  ) => {
    await realtimeManager.broadcastEvent(channel, event, payload);
  }, []);

  return { broadcast };
}