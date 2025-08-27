// Service Worker for offline functionality
declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'nordflytt-staff-v1'
const API_CACHE_NAME = 'nordflytt-api-v1'

// Resources to cache for offline use
const STATIC_RESOURCES = [
  '/',
  '/staff',
  '/staff/dashboard',
  '/manifest.json',
  '/nordflytt-logo.png',
  '/offline.html',
]

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/staff/jobs',
  '/api/staff/profile',
]

// Install event - cache essential resources
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources')
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => {
        console.log('[SW] Static resources cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static resources:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activate event')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle offline scenarios
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle page requests
  if (request.mode === 'navigate') {
    event.respondWith(handlePageRequest(request))
    return
  }

  // Handle static resources
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with offline fallback
async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone())
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request.clone(), networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API request:', url.pathname)
    
    // For GET requests, try to serve from cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        console.log('[SW] Serving API request from cache:', url.pathname)
        
        // Add offline indicator header
        const response = cachedResponse.clone()
        response.headers.set('X-Served-From-Cache', 'true')
        return response
      }
    }
    
    // Return offline fallback for failed API requests
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - no cached data available',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline': 'true'
        }
      }
    )
  }
}

// Handle page requests with offline fallback
async function handlePageRequest(request: Request): Promise<Response> {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for page request:', request.url)
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Serve offline page for staff routes
    if (request.url.includes('/staff')) {
      const offlineResponse = await caches.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Nordflytt Staff</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px; 
              background: #f5f5f5; 
            }
            .offline-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #002A5C; margin-bottom: 10px; }
            p { color: #666; line-height: 1.5; }
            .retry-btn {
              background: #002A5C;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 20px;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="icon">📱</div>
            <h1>Du är offline</h1>
            <p>Kontrollera din internetanslutning och försök igen.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Försök igen
            </button>
          </div>
        </body>
      </html>
      `,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'text/html',
          'X-Offline': 'true'
        }
      }
    )
  }
}

// Handle static resource requests
async function handleStaticRequest(request: Request): Promise<Response> {
  try {
    // Try cache first for static resources
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback to network
    const networkResponse = await fetch(request)
    
    // Cache the response for future use
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to serve static resource:', request.url)
    
    // Return a fallback response for critical resources
    if (request.url.includes('.css') || request.url.includes('.js')) {
      return new Response('/* Offline fallback */', {
        headers: { 'Content-Type': 'text/css' }
      })
    }
    
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle background sync for queued actions
self.addEventListener('sync', (event: any) => {
  console.log('[SW] Background sync event:', event.tag)
  
  if (event.tag === 'job-updates') {
    event.waitUntil(syncJobUpdates())
  } else if (event.tag === 'time-reports') {
    event.waitUntil(syncTimeReports())
  }
})

// Sync queued job updates when back online
async function syncJobUpdates() {
  try {
    console.log('[SW] Syncing queued job updates')
    
    // Get queued updates from IndexedDB
    const queuedUpdates = await getQueuedJobUpdates()
    
    for (const update of queuedUpdates) {
      try {
        const response = await fetch('/api/staff/update-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        })
        
        if (response.ok) {
          await removeQueuedUpdate(update.id)
          console.log('[SW] Successfully synced job update:', update.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync job update:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Sync queued time reports when back online
async function syncTimeReports() {
  try {
    console.log('[SW] Syncing queued time reports')
    
    const queuedReports = await getQueuedTimeReports()
    
    for (const report of queuedReports) {
      try {
        const response = await fetch('/api/staff/timereports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report.data)
        })
        
        if (response.ok) {
          await removeQueuedTimeReport(report.id)
          console.log('[SW] Successfully synced time report:', report.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync time report:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Time reports sync failed:', error)
  }
}

// IndexedDB operations for offline queue
async function getQueuedJobUpdates() {
  // Implementation would use IndexedDB to store/retrieve queued updates
  return []
}

async function getQueuedTimeReports() {
  // Implementation would use IndexedDB to store/retrieve queued time reports
  return []
}

async function removeQueuedUpdate(id: string) {
  // Implementation would remove the update from IndexedDB
}

async function removeQueuedTimeReport(id: string) {
  // Implementation would remove the time report from IndexedDB
}

// Handle push notifications (if enabled)
self.addEventListener('push', (event: any) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/nordflytt-logo.png',
      badge: '/nordflytt-logo.png',
      data: data.data,
      actions: data.actions
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  
  if (event.action) {
    // Handle specific action
    console.log('[SW] Notification action clicked:', event.action)
  } else {
    // Open the app
    event.waitUntil(
      self.clients.openWindow('/staff/dashboard')
    )
  }
})