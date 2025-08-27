// Hook for managing offline functionality
import { useState, useEffect, useCallback } from 'react'

export interface OfflineQueueItem {
  id: string
  type: 'job-update' | 'time-report' | 'photo-upload'
  data: any
  timestamp: number
  retries: number
  maxRetries: number
}

export interface UseOfflineReturn {
  isOnline: boolean
  queuedItems: OfflineQueueItem[]
  queueItem: (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => void
  processQueue: () => Promise<void>
  clearQueue: () => void
  getQueueCount: () => number
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true)
  const [queuedItems, setQueuedItems] = useState<OfflineQueueItem[]>([])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Back online')
      setIsOnline(true)
      processQueue()
    }

    const handleOffline = () => {
      console.log('📵 Gone offline')
      setIsOnline(false)
    }

    // Set initial status
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load queued items from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offline_queue')
    if (savedQueue) {
      try {
        const parsed = JSON.parse(savedQueue)
        setQueuedItems(parsed)
      } catch (error) {
        console.error('Failed to load offline queue:', error)
      }
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('offline_queue', JSON.stringify(queuedItems))
  }, [queuedItems])

  // Add item to offline queue
  const queueItem = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    }

    setQueuedItems(prev => [...prev, queueItem])
    console.log('📝 Queued for offline sync:', queueItem.type, queueItem.id)

    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register(`${item.type}s`)
      }).catch(error => {
        console.error('Background sync registration failed:', error)
      })
    }
  }, [])

  // Process queued items
  const processQueue = useCallback(async () => {
    if (!isOnline || queuedItems.length === 0) {
      return
    }

    console.log('🔄 Processing offline queue:', queuedItems.length, 'items')

    const processedIds: string[] = []

    for (const item of queuedItems) {
      try {
        let success = false

        switch (item.type) {
          case 'job-update':
            success = await processJobUpdate(item)
            break
          case 'time-report':
            success = await processTimeReport(item)
            break
          case 'photo-upload':
            success = await processPhotoUpload(item)
            break
          default:
            console.warn('Unknown queue item type:', item.type)
        }

        if (success) {
          processedIds.push(item.id)
          console.log('✅ Successfully processed queued item:', item.id)
        } else if (item.retries >= item.maxRetries) {
          processedIds.push(item.id)
          console.error('❌ Max retries reached for item:', item.id)
        } else {
          // Increment retry count
          setQueuedItems(prev => prev.map(queuedItem =>
            queuedItem.id === item.id
              ? { ...queuedItem, retries: queuedItem.retries + 1 }
              : queuedItem
          ))
        }
      } catch (error) {
        console.error('Failed to process queue item:', item.id, error)
        
        if (item.retries >= item.maxRetries) {
          processedIds.push(item.id)
        } else {
          setQueuedItems(prev => prev.map(queuedItem =>
            queuedItem.id === item.id
              ? { ...queuedItem, retries: queuedItem.retries + 1 }
              : queuedItem
          ))
        }
      }
    }

    // Remove successfully processed items
    if (processedIds.length > 0) {
      setQueuedItems(prev => prev.filter(item => !processedIds.includes(item.id)))
    }
  }, [isOnline, queuedItems])

  // Clear all queued items
  const clearQueue = useCallback(() => {
    setQueuedItems([])
    localStorage.removeItem('offline_queue')
  }, [])

  // Get queue count
  const getQueueCount = useCallback(() => {
    return queuedItems.length
  }, [queuedItems])

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && queuedItems.length > 0) {
      processQueue()
    }
  }, [isOnline, processQueue, queuedItems.length])

  return {
    isOnline,
    queuedItems,
    queueItem,
    processQueue,
    clearQueue,
    getQueueCount,
  }
}

// Helper functions for processing different types of queued items
async function processJobUpdate(item: OfflineQueueItem): Promise<boolean> {
  try {
    const response = await fetch('/api/staff/update-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to process job update:', error)
    return false
  }
}

async function processTimeReport(item: OfflineQueueItem): Promise<boolean> {
  try {
    const response = await fetch('/api/staff/timereports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to process time report:', error)
    return false
  }
}

async function processPhotoUpload(item: OfflineQueueItem): Promise<boolean> {
  try {
    const formData = new FormData()
    formData.append('jobId', item.data.jobId)
    formData.append('photo', item.data.photo)

    const response = await fetch('/api/staff/photos', {
      method: 'POST',
      body: formData,
    })

    return response.ok
  } catch (error) {
    console.error('Failed to process photo upload:', error)
    return false
  }
}

// Service Worker registration hook
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registered')
          setRegistration(reg)

          // Check for updates
          reg.addEventListener('updatefound', () => {
            console.log('🔄 Service Worker update found')
          })
        })
        .catch((err) => {
          console.error('❌ Service Worker registration failed:', err)
          setError(err)
        })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from Service Worker:', event.data)
      })
    }
  }, [])

  return { registration, error }
}

// Custom hook for cache management
export function useCache() {
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('🗑️ All caches cleared')
    }
  }, [])

  const getCacheSize = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        }
      }

      return totalSize
    }
    return 0
  }, [])

  return { clearCache, getCacheSize }
}