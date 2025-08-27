// Nordflytt Service Worker
const CACHE_NAME = 'nordflytt-v1';
const DYNAMIC_CACHE = 'nordflytt-dynamic-v1';

// URLs to cache for offline support
const urlsToCache = [
  '/',
  '/form',
  '/staff',
  '/staff/login',
  '/manifest.json',
  '/nordflytt-logo.svg',
  '/offline.html'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[ServiceWorker] Cache install failed:', err);
      })
  );
  // Force the new service worker to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before using it
          const responseToCache = response.clone();
          
          // Cache successful API responses
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Try to return cached API response
          return caches.match(request);
        })
    );
    return;
  }

  // Handle navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(response => {
              if (response) return response;
              // Return offline page for navigation requests
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Return from cache but also update in background
          fetchAndUpdate(request);
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then(response => {
          // Don't cache non-2xx responses
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for images
        if (request.destination === 'image') {
          return caches.match('/placeholder.svg');
        }
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'submit-booking') {
    event.waitUntil(submitPendingBookings());
  }
});

// Push notifications
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Ny uppdatering från Nordflytt',
    icon: '/nordflytt-logo.svg',
    badge: '/nordflytt-logo.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Nordflytt', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper function to fetch and update cache in background
function fetchAndUpdate(request) {
  fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseToCache);
        });
      }
    })
    .catch(() => {
      // Silently fail - we already returned from cache
    });
}

// Submit pending bookings when back online
async function submitPendingBookings() {
  const cache = await caches.open('pending-bookings');
  const requests = await cache.keys();
  
  const promises = requests.map(async request => {
    const response = await cache.match(request);
    const booking = await response.json();
    
    try {
      const result = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      
      if (result.ok) {
        // Remove from pending cache
        await cache.delete(request);
        
        // Show notification
        self.registration.showNotification('Bokning skickad!', {
          body: 'Din bokning har nu skickats när internetanslutningen återställdes.',
          icon: '/nordflytt-logo.svg'
        });
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to submit booking:', error);
    }
  });
  
  await Promise.all(promises);
}