// Hook for staff app data management with database integration
import { useState, useEffect, useCallback } from 'react'
import { updateJobStatus, addServiceToJob, addPhotosToJob } from '@/lib/database/staff-operations'
import { logWorkTime, getTodaysWorkTime } from '@/lib/staff-employee-sync'

export interface StaffJob {
  id: string
  title: string
  customer: {
    name: string
    address: string
    phone: string
    email?: string
  }
  time: {
    start: string
    end: string
    estimatedDuration: number
  }
  location: {
    from: string
    to: string
    distance?: number
  }
  team: string[]
  services: Array<{
    id: string
    name: string
    price: number
    selected: boolean
    totalPrice?: number
    quantity?: number
  }>
  notes?: string
  status: 'upcoming' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  estimatedValue: number
  actualValue?: number
  photos?: string[]
  completedAt?: string
  lastUpdated: number
}

export interface UseStaffDataReturn {
  jobs: StaffJob[]
  loading: boolean
  error: string | null
  refreshJobs: () => Promise<void>
  startJob: (jobId: string) => Promise<void>
  endJob: (jobId: string) => Promise<void>
  addService: (jobId: string, service: any) => Promise<void>
  addPhotos: (jobId: string, photos: string[]) => Promise<void>
  todaysWorkTime: any
  networkStatus: 'online' | 'offline'
}

export function useStaffData(staffId?: string): UseStaffDataReturn {
  const [jobs, setJobs] = useState<StaffJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todaysWorkTime, setTodaysWorkTime] = useState(null)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get authentication token
  const getAuthToken = useCallback(() => {
    const auth = localStorage.getItem('staff_auth')
    return auth ? JSON.parse(auth).token : null
  }, [])

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = getAuthToken()
      const today = new Date().toISOString().split('T')[0]
      
      const response = await fetch(`/api/staff/jobs?staffId=${staffId}&date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs || [])
        console.log(`Loaded ${data.jobs?.length || 0} jobs from ${data.source}`)
      } else {
        throw new Error(data.error || 'Failed to fetch jobs')
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to cached data if available
      const cachedJobs = localStorage.getItem('staff_cached_jobs')
      if (cachedJobs) {
        setJobs(JSON.parse(cachedJobs))
        console.log('Using cached jobs due to error')
      }
    } finally {
      setLoading(false)
    }
  }, [staffId, getAuthToken])

  // Cache jobs to localStorage for offline use
  const cacheJobs = useCallback((jobsToCache: StaffJob[]) => {
    localStorage.setItem('staff_cached_jobs', JSON.stringify(jobsToCache))
    localStorage.setItem('staff_cached_timestamp', Date.now().toString())
  }, [])

  // Fetch today's work time
  const fetchTodaysWorkTime = useCallback(async () => {
    try {
      if (staffId) {
        const workTime = await getTodaysWorkTime(staffId)
        setTodaysWorkTime(workTime)
      }
    } catch (err) {
      console.error('Error fetching work time:', err)
    }
  }, [staffId])

  // Initial data load
  useEffect(() => {
    fetchJobs()
    fetchTodaysWorkTime()
  }, [fetchJobs, fetchTodaysWorkTime])

  // Cache jobs when they change
  useEffect(() => {
    if (jobs.length > 0) {
      cacheJobs(jobs)
    }
  }, [jobs, cacheJobs])

  // Refresh jobs
  const refreshJobs = useCallback(async () => {
    await fetchJobs()
    await fetchTodaysWorkTime()
  }, [fetchJobs, fetchTodaysWorkTime])

  // Start a job
  const startJob = useCallback(async (jobId: string) => {
    try {
      // Update UI immediately (optimistic update)
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'in_progress' as const, lastUpdated: Date.now() }
          : job
      ))

      // Update database
      await updateJobStatus(jobId, 'in_progress', staffId)
      
      // Log work time
      const job = jobs.find(j => j.id === jobId)
      if (job && staffId) {
        await logWorkTime({
          jobId,
          bookingNumber: jobId,
          customerName: job.customer.name,
          serviceType: 'Moving Service',
          startTime: new Date(),
          status: 'active'
        })
      }

      console.log(`Job ${jobId} started successfully`)
    } catch (err) {
      console.error('Error starting job:', err)
      // Revert optimistic update
      await refreshJobs()
      throw err
    }
  }, [jobs, staffId, refreshJobs])

  // End a job
  const endJob = useCallback(async (jobId: string) => {
    try {
      // Update UI immediately (optimistic update)
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed' as const, completedAt: new Date().toISOString(), lastUpdated: Date.now() }
          : job
      ))

      // Update database
      await updateJobStatus(jobId, 'completed', staffId)
      
      console.log(`Job ${jobId} completed successfully`)
    } catch (err) {
      console.error('Error ending job:', err)
      // Revert optimistic update
      await refreshJobs()
      throw err
    }
  }, [staffId, refreshJobs])

  // Add service to job
  const addService = useCallback(async (jobId: string, service: any) => {
    try {
      // Update UI immediately (optimistic update)
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              services: [...job.services, { ...service, selected: true }],
              lastUpdated: Date.now()
            }
          : job
      ))

      // Update database
      await addServiceToJob(jobId, service, staffId)
      
      console.log(`Service added to job ${jobId}:`, service.name)
    } catch (err) {
      console.error('Error adding service:', err)
      // Revert optimistic update
      await refreshJobs()
      throw err
    }
  }, [staffId, refreshJobs])

  // Add photos to job
  const addPhotos = useCallback(async (jobId: string, photoUrls: string[]) => {
    try {
      // Update UI immediately (optimistic update)
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              photos: [...(job.photos || []), ...photoUrls],
              lastUpdated: Date.now()
            }
          : job
      ))

      // Update database
      await addPhotosToJob(jobId, photoUrls, staffId)
      
      console.log(`Photos added to job ${jobId}:`, photoUrls.length)
    } catch (err) {
      console.error('Error adding photos:', err)
      // Revert optimistic update
      await refreshJobs()
      throw err
    }
  }, [staffId, refreshJobs])

  return {
    jobs,
    loading,
    error,
    refreshJobs,
    startJob,
    endJob,
    addService,
    addPhotos,
    todaysWorkTime,
    networkStatus
  }
}