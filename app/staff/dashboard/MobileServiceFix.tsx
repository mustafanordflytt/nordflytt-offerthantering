'use client'

import { useEffect } from 'react'

export default function MobileServiceFix() {
  useEffect(() => {
    // Check if we have services that aren't displaying
    const checkAndFixServices = () => {
      const savedServices = localStorage.getItem('staff_jobs_with_services')
      if (savedServices) {
        try {
          const services = JSON.parse(savedServices)
          console.log('[MobileServiceFix] Found saved services:', services)
          
          // Force a re-render by updating a timestamp
          const fixTimestamp = localStorage.getItem('service_fix_timestamp')
          const newTimestamp = Date.now().toString()
          if (fixTimestamp !== newTimestamp) {
            localStorage.setItem('service_fix_timestamp', newTimestamp)
            console.log('[MobileServiceFix] Applied fix, reloading...')
            // Small delay then reload
            setTimeout(() => {
              window.location.reload()
            }, 100)
          }
        } catch (e) {
          console.error('[MobileServiceFix] Error:', e)
        }
      }
    }
    
    // Run check on mount and when storage changes
    checkAndFixServices()
    window.addEventListener('storage', checkAndFixServices)
    
    return () => {
      window.removeEventListener('storage', checkAndFixServices)
    }
  }, [])
  
  return null
}