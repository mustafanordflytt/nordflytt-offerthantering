'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Unregister old service worker if exists
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            if (registration.active?.scriptURL.includes('/sw.js')) {
              registration.unregister()
            }
          })
        })
        
        // Register new service worker
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('[ServiceWorker] Registration successful:', registration.scope)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000) // Check every hour
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[ServiceWorker] New version available')
                    // You could show a notification to the user here
                  }
                })
              }
            })
          })
          .catch(error => {
            console.error('[ServiceWorker] Registration failed:', error)
          })
      })
      
      // Handle offline/online events
      window.addEventListener('online', () => {
        console.log('[App] Back online')
        // Could trigger sync or other actions
      })
      
      window.addEventListener('offline', () => {
        console.log('[App] Gone offline')
        // Could show offline notification
      })
    } else {
      console.warn('[ServiceWorker] Not supported in this browser')
    }
  }, [])

  return null
}