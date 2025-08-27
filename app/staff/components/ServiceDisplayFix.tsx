'use client'

import { useEffect } from 'react'

// Component to fix service display and status update issues on mobile
export default function ServiceDisplayFix() {
  useEffect(() => {
    // Force re-render when localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'staff_jobs_with_services' || e.key === 'mockJobStatuses') {
        console.log('[ServiceDisplayFix] Storage changed:', e.key)
        // Dispatch a custom event to trigger re-render
        window.dispatchEvent(new CustomEvent('jobDataUpdated'))
      }
    }
    
    // Check for orphaned services on mount
    const checkAndFixServices = () => {
      const savedServices = localStorage.getItem('staff_jobs_with_services')
      const mockJobs = localStorage.getItem('mockJobs')
      
      if (savedServices && mockJobs) {
        try {
          const services = JSON.parse(savedServices)
          const jobs = JSON.parse(mockJobs)
          
          // Log current state
          console.log('[ServiceDisplayFix] Checking services:', services)
          
          // Check if any job has services but they're not displaying
          Object.entries(services).forEach(([jobId, data]: [string, any]) => {
            const job = jobs.find((j: any) => j.id === jobId)
            if (job && data.addedServices && data.addedServices.length > 0) {
              console.log(`[ServiceDisplayFix] Job ${jobId} has ${data.addedServices.length} services`)
            }
          })
          
        } catch (e) {
          console.error('[ServiceDisplayFix] Error parsing data:', e)
        }
      }
    }
    
    // Run check on mount
    checkAndFixServices()
    
    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events from our fix scripts
    const handleJobUpdate = () => {
      console.log('[ServiceDisplayFix] Job data updated event received')
      window.location.reload()
    }
    
    window.addEventListener('jobDataUpdated', handleJobUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('jobDataUpdated', handleJobUpdate)
    }
  }, [])
  
  return null
}