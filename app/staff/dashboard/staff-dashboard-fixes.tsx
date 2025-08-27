'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// Fix 1: Create a custom hook for cleanup checking
export const useIsMounted = () => {
  const isMounted = useRef(false)
  
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])
  
  return isMounted
}

// Fix 2: Extract toast functionality to use React state instead of DOM manipulation
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([])
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])
  
  return { toasts, showToast }
}

// Fix 3: Proper key generation for services
export const generateServiceKey = (service: any, jobId: string, index: number): string => {
  // Prioritize stable IDs in order
  if (service?.id) return service.id
  if (service?.service_id) return service.service_id
  if (service?.name && service?.price) return `${jobId}-${service.name}-${service.price}`
  return `${jobId}-service-${index}`
}

// Fix 4: Memoized job filtering
export const useFilteredJobs = (jobs: any[], filter: string) => {
  return useMemo(() => {
    if (!filter || filter === 'all') return jobs
    return jobs.filter(job => job.status === filter)
  }, [jobs, filter])
}

// Fix 5: Batched state updates helper
export const useBatchedStateUpdate = () => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const updatesRef = useRef<Array<() => void>>([])
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    updatesRef.current.push(updateFn)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      updatesRef.current.forEach(fn => fn())
      updatesRef.current = []
    }, 0)
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return batchUpdate
}

// Fix 6: Cleanup-aware data fetching
export const useSafeFetch = () => {
  const isMounted = useIsMounted()
  
  const safeFetch = useCallback(async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options)
      
      // Check if component is still mounted before processing
      if (!isMounted.current) {
        console.log('Component unmounted, skipping fetch processing')
        return null
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Double check before returning
      if (!isMounted.current) return null
      
      return data
    } catch (error) {
      if (isMounted.current) {
        console.error('Fetch error:', error)
        throw error
      }
      return null
    }
  }, [isMounted])
  
  return safeFetch
}

// Fix 7: Proper interval management
export const useSafeInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback)
  
  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  
  // Set up the interval
  useEffect(() => {
    if (delay !== null) {
      const tick = () => savedCallback.current()
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

// Fix 8: Error boundary wrapper
export const StaffDashboardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary 
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Något gick fel
          </h2>
          <p className="text-gray-600 mb-4">
            Vi kunde inte ladda dashboard. Försök igen.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ladda om sidan
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}