// Service Worker for Nordflytt Staff App
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
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources')
        return cache.addAll(STATIC_RESOURCES.filter(url => {
          // Skip resources that might not exist
          return !url.includes('/offline.html') || true
        }))
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
self.addEventListener('activate', (event) => {
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
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }

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
async function handleApiRequest(request) {
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
        
        // Clone response and add offline indicator header
        const response = new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...Object.fromEntries(cachedResponse.headers.entries()),
            'X-Served-From-Cache': 'true'
          }
        })
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
async function handlePageRequest(request) {
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center; 
              padding: 40px; 
              background: #f5f5f5;
              margin: 0;
            }
            .offline-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .icon { 
              font-size: 64px; 
              margin-bottom: 20px;
              opacity: 0.7;
            }
            h1 { 
              color: #002A5C; 
              margin-bottom: 10px;
              font-size: 24px;
              font-weight: 600;
            }
            p { 
              color: #666; 
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .retry-btn {
              background: #002A5C;
              color: white;
              padding: 14px 28px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 500;
              transition: background 0.2s;
            }
            .retry-btn:hover {
              background: #001a42;
            }
            .retry-btn:active {
              transform: translateY(1px);
            }
            .status {
              margin-top: 20px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 6px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="icon">📱</div>
            <h1>Du är offline</h1>
            <p>Kontrollera din internetanslutning och försök igen. Alla ändringar du gör sparas lokalt tills du är online igen.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Försök igen
            </button>
            <div class="status">
              Offline-läge aktivt • Nordflytt Staff App
            </div>
          </div>
          <script>
            // Auto-retry when connection is restored
            window.addEventListener('online', () => {
              window.location.reload()
            })
            
            // Show connection status
            function updateStatus() {
              const status = document.querySelector('.status')
              if (navigator.onLine) {
                status.textContent = 'Online • Försöker återansluta...'
                setTimeout(() => window.location.reload(), 1000)
              }
            }
            
            setInterval(updateStatus, 2000)
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'X-Offline': 'true'
        }
      }
    )
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
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
    
    // Return a minimal fallback for critical resources
    if (request.url.includes('.css')) {
      return new Response('/* Offline fallback - styles not available */', {
        headers: { 'Content-Type': 'text/css' }
      })
    }
    
    if (request.url.includes('.js')) {
      return new Response('console.log("Offline fallback - script not available")', {
        headers: { 'Content-Type': 'application/javascript' }
      })
    }
    
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle background sync for queued actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag)
  
  if (event.tag === 'job-updates') {
    event.waitUntil(syncJobUpdates())
  } else if (event.tag === 'time-reports') {
    event.waitUntil(syncTimeReports())
  }
})

// Sync functions (simplified for this implementation)
async function syncJobUpdates() {
  console.log('[SW] Would sync job updates from IndexedDB')
  // Implementation would sync queued job updates
}

async function syncTimeReports() {
  console.log('[SW] Would sync time reports from IndexedDB')
  // Implementation would sync queued time reports
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Ny notifiering från Nordflytt',
      icon: '/nordflytt-logo.png',
      badge: '/nordflytt-logo.png',
      tag: data.tag || 'nordflytt-notification',
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Nordflytt', options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action)
    // Handle specific actions
  } else {
    // Open the app
    event.waitUntil(
      self.clients.openWindow('/staff/dashboard')
    )
  }
})

console.log('[SW] Service Worker loaded')