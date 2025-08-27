'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import '../styles/touch-friendly.css'
import '../styles/gps-modal-fix.css'
import { useRouter } from 'next/navigation'
import { useRealtimeJobs, useRealtimeNotifications } from '@/hooks/use-realtime'
import { RealtimeStatus } from '@/components/realtime/RealtimeStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Truck,
  Users,
  Phone,
  Navigation as NavigationIcon,
  Battery,
  Wifi,
  WifiOff,
  Bell,
  Settings,
  LogOut,
  PlayCircle,
  PauseCircle,
  User,
  Plus,
  ShoppingCart,
  Camera,
  Sparkles,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import TopNavigation from '@/components/staff/TopNavigation'
import OperationalChat from '@/components/staff/OperationalChat'
import AddServiceModal from '../components/AddServiceModal'
import PreStartChecklistModal from '@/components/staff/PreStartChecklistModal'
import JobDetailModal from '@/components/staff/JobDetailModal'
import PhotoReminderSystem from '@/components/staff/PhotoReminderSystem'
import PhotoGallery from '../components/PhotoGallery'
import ServiceDisplayFix from '../components/ServiceDisplayFix'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useIsMounted, useToast, generateServiceKey, useSafeFetch } from './staff-dashboard-fixes'
import { ToastContainer } from '@/components/staff/Toast'
import { PageLoader, SectionLoader, JobListSkeleton, StatsCardSkeleton, LoadingOverlay } from '@/components/staff/LoadingStates'
import ServiceTimeDisplay from '@/components/staff/ServiceTimeDisplay'
import { getServiceConfig, cameraHandler } from '../utils/serviceSpecific'
import { getStaffReminderService } from '@/lib/notifications'
import WorkTimeDisplay from '@/components/staff/WorkTimeDisplay'
import DesktopPhotoManager from '@/components/staff/DesktopPhotoManager'
import { 
  startTimeTrackingWithWarnings, 
  stopTimeTrackingWithOvertimeCheck, 
  checkTimeWarnings,
  getCurrentWorkTime,
  TimeWarning,
  startTimeTrackingWithoutGPS
} from '../../../lib/time-tracking'
import OvertimeModal from '@/components/staff/OvertimeModal'
import OvertimePrompt from '@/components/staff/OvertimePrompt'
import MyHoursModal from '@/components/staff/MyHoursModal'
import TimeWarningBanner from '@/components/staff/TimeWarningBanner'
import SmartNotificationCenter from '@/components/staff/SmartNotificationCenter'
import TriggerNotificationSystem from '@/components/staff/TriggerNotificationSystem'
import { smartTriggerService } from '@/lib/smart-triggers'
import OrderConfirmationView from '@/components/staff/OrderConfirmationView'

interface StaffMember {
  id: string
  email: string
  name: string
  role: string
  loginTime: string
}

interface TodaysJob {
  id: string
  bookingNumber: string
  customerName: string
  customerPhone: string
  fromAddress: string
  toAddress: string
  moveTime: string
  endTime: string
  status: 'upcoming' | 'in_progress' | 'completed'
  estimatedHours: number
  teamMembers: string[]
  priority: 'low' | 'medium' | 'high'
  distance: number
  serviceType: 'moving' | 'cleaning' | 'packing'
  services: string[]
  specialRequirements: string[]
  locationInfo: {
    doorCode: string
    floor: number
    elevator: boolean
    elevatorStatus: string
    parkingDistance: number
    accessNotes: string
  }
  customerNotes: string
  equipment: string[]
  volume?: number
  boxCount?: number
  addedServices?: {
    id: string
    serviceId: string
    name: string
    quantity: number
    price: number
    addedAt: string
    addedBy: string
  }[]
  totalAdditionalCost?: number
}


export default function StaffDashboard() {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [todaysJobs, setTodaysJobs] = useState<TodaysJob[]>([])
  const [allJobs, setAllJobs] = useState<TodaysJob[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { toasts, showToast } = useToast()
  const safeFetch = useSafeFetch()
  const [isMounted, setIsMounted] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(3)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  const [selectedJobForService, setSelectedJobForService] = useState<TodaysJob | null>(null)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [selectedJobForStart, setSelectedJobForStart] = useState<TodaysJob | null>(null)
  const [showJobDetailModal, setShowJobDetailModal] = useState(false)
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<TodaysJob | null>(null)
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<string | null>(null)
  const [showPhotoReminders, setShowPhotoReminders] = useState(false)
  const [selectedJobForPhotos, setSelectedJobForPhotos] = useState<TodaysJob | null>(null)
  const [photoPhase, setPhotoPhase] = useState<'before' | 'during' | 'after'>('before')
  
  // Real-time hooks
  const { jobs: realtimeJobs, loading: realtimeLoading } = useRealtimeJobs({ 
    staffId: staff?.id,
    date: new Date().toISOString().split('T')[0]
  })
  const { notifications, unreadCount } = useRealtimeNotifications(staff?.id, 'staff')
  
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('timeline')
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [showOvertimeModal, setShowOvertimeModal] = useState(false)
  const [overtimeInfo, setOvertimeInfo] = useState<any>(null)
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false)
  const [overtimePromptInfo, setOvertimePromptInfo] = useState<any>(null)
  const [showMyHoursModal, setShowMyHoursModal] = useState(false)
  const [timeWarnings, setTimeWarnings] = useState<TimeWarning[]>([])
  const [activeJobForWarnings, setActiveJobForWarnings] = useState<TodaysJob | null>(null)
  const [showSmartNotifications, setShowSmartNotifications] = useState(false)
  const [smartNotificationCount, setSmartNotificationCount] = useState(0)
  const [dismissedTriggers, setDismissedTriggers] = useState<string[]>([])
  const [missingPhotos, setMissingPhotos] = useState<string[]>(['Lastbil före', 'Städning efter'])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showAllJobs, setShowAllJobs] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'start' | 'end' | null>(null)
  const isMountedRef = useRef(true)

  // Service cards inte längre behövs eftersom vi bara använder tidslinje-vy

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Authentication effect - separate concern
  useEffect(() => {
    setIsMounted(true)
    
    // Check authentication
    const authData = localStorage.getItem('staff_auth')
    if (!authData) {
      router.push('/staff/login')
      return
    }

    try {
      const parsedAuth = JSON.parse(authData)
      
      // Check if token exists
      if (!parsedAuth.token) {
        router.push('/staff/login')
        return
      }
      
      setStaff(parsedAuth)
      setIsMounted(true)
    } catch (error) {
      console.error('Error parsing auth data:', error)
      router.push('/staff/login')
      return
    }
  }, [router])

  // Clock update - separate effect
  useEffect(() => {
    if (!isMounted) return
    
    setCurrentTime(new Date())
    const timeInterval = setInterval(() => {
      if (isMountedRef.current) {
        setCurrentTime(new Date())
      }
    }, 1000)
    
    return () => clearInterval(timeInterval)
  }, [isMounted])

  // Jobs loading - separate effect
  useEffect(() => {
    if (!isMounted) return
    
    loadTodaysJobs()
    
    const jobsRefreshInterval = setInterval(() => {
      if (isMountedRef.current) {
        loadTodaysJobs()
      }
    }, 30000)
    
    return () => clearInterval(jobsRefreshInterval)
  }, [isMounted])

  // Online/offline detection - separate effect
  useEffect(() => {
    const handleOnline = () => {
      if (isMountedRef.current) setIsOnline(true)
    }
    const handleOffline = () => {
      if (isMountedRef.current) setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Service worker registration - separate effect
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.error('Service Worker registration failed:', err))
    }
  }, [])

  // Smart triggers initialization - separate effect
  useEffect(() => {
    if (!staff?.id) return
    
    getStaffReminderService().cleanupOldReminders()
    smartTriggerService.startMonitoring()
    
    const existingNotifications = JSON.parse(localStorage.getItem('triggered_notifications') || '[]')
    const unreadNotifications = existingNotifications.filter((n: any) => !n.isRead).length
    setSmartNotificationCount(unreadNotifications)
    
    return () => {
      smartTriggerService.stopMonitoring()
    }
  }, [staff?.id])

  // Realtime jobs sync - separate effect
  useEffect(() => {
    if (realtimeJobs && !realtimeLoading && isMountedRef.current) {
      setTodaysJobs(realtimeJobs as TodaysJob[])
    }
  }, [realtimeJobs, realtimeLoading])

  // Set loading false when mounted
  useEffect(() => {
    if (isMounted) {
      setIsLoading(false)
    }
  }, [isMounted])
  
  // Refresh when lastRefresh changes (after status updates)
  useEffect(() => {
    if (lastRefresh > 0 && isMounted) {
      // Small delay to ensure state updates have propagated
      const timer = setTimeout(() => {
        console.log('Refreshing jobs after status update...')
        loadTodaysJobs()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [lastRefresh, isMounted])

  const loadTodaysJobs = useCallback(async () => {
    try {
      if (!isMountedRef.current) return
      // Check for mock jobs first (for testing)
      const mockJobs = localStorage.getItem('mockJobs')
      if (mockJobs) {
        console.log('Loading mock jobs for testing...')
        const jobs = JSON.parse(mockJobs)
        
        // Check if any jobs have persisted status changes and added services
        const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
        const savedJobsWithServices = JSON.parse(localStorage.getItem('staff_jobs_with_services') || '{}')
        
        console.log('[LoadJobs] Saved services:', savedJobsWithServices)
        console.log('[LoadJobs] Job statuses:', jobStatuses)
        
        const updatedJobs = jobs.map((job: TodaysJob) => {
          let updatedJob = { ...job }
          
          // Apply status changes
          if (jobStatuses[job.id]) {
            console.log(`[LoadJobs] Applying status ${jobStatuses[job.id]} to job ${job.id}`)
            updatedJob.status = jobStatuses[job.id]
          }
          
          // Apply added services
          if (savedJobsWithServices[job.id]) {
            console.log(`[LoadJobs] Found services for job ${job.id}:`, savedJobsWithServices[job.id])
            updatedJob.addedServices = savedJobsWithServices[job.id].addedServices
            updatedJob.totalAdditionalCost = savedJobsWithServices[job.id].totalAdditionalCost
            console.log(`[LoadJobs] Updated job with ${updatedJob.addedServices?.length} services`)
            console.log(`[LoadJobs] Service details:`, updatedJob.addedServices)
          } else {
            console.log(`[LoadJobs] No services found for job ${job.id}`)
          }
          
          return updatedJob
        })
        
        setTodaysJobs(updatedJobs)
        return
      }
      
      // Force cache refresh to get latest data
      const data = await safeFetch('/api/staff/jobs', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!data) {
        throw new Error('Failed to fetch jobs')
      }
      
      if (data.success && data.jobs) {
        console.log('Staff jobs loaded:', data.jobs.length, 'jobs')
        setTodaysJobs(data.jobs)
      } else {
        console.error('Failed to load jobs:', data.error)
        setTodaysJobs([])
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      // Fallback to empty array if API fails
      if (isMountedRef.current) {
        setTodaysJobs([])
      }
    }
  }, [])

  const loadAllJobs = async () => {
    try {
      // Hämta alla jobb för veckan
      const data = await safeFetch('/api/staff/jobs?all=true', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!data) {
        throw new Error('Failed to fetch all jobs')
      }
      
      if (data.success && data.jobs) {
        console.log('All jobs loaded:', data.jobs.length, 'jobs')
        setAllJobs(data.jobs)
      } else {
        console.error('Failed to load all jobs:', data.error)
        setAllJobs([])
      }
    } catch (error) {
      console.error('Error loading all jobs:', error)
      // Fallback till mock data för demo
      const mockFutureJobs: TodaysJob[] = [
        {
          id: '100',
          bookingNumber: 'NF-DEMO001',
          customerName: 'Lisa Andersson',
          customerPhone: '+46 70 111 22 33',
          fromAddress: 'Vasastan, Stockholm',
          toAddress: 'Östermalm, Stockholm',
          moveTime: '09:00',
          endTime: '13:00',
          status: 'upcoming',
          estimatedHours: 4,
          teamMembers: ['Erik Andersson', 'Sofia Lindberg'],
          priority: 'medium',
          distance: 5.2,
          serviceType: 'moving',
          services: ['Packhjälp', 'Flytt'],
          specialRequirements: [],
          locationInfo: {
            doorCode: '1234',
            floor: 2,
            elevator: true,
            elevatorStatus: 'Fungerar',
            parkingDistance: 10,
            accessNotes: ''
          },
          customerNotes: 'Imorgon - Liten lägenhet',
          equipment: ['Flyttkartonger', 'Täcken'],
          volume: 20
        },
        {
          id: '101',
          bookingNumber: 'NF-DEMO002',
          customerName: 'Johan Svensson',
          customerPhone: '+46 70 222 33 44',
          fromAddress: 'Kungsholmen, Stockholm',
          toAddress: 'Solna, Stockholm',
          moveTime: '14:00',
          endTime: '18:00',
          status: 'upcoming',
          estimatedHours: 4,
          teamMembers: ['Marcus Johansson'],
          priority: 'low',
          distance: 8.3,
          serviceType: 'cleaning',
          services: ['Flyttstädning'],
          specialRequirements: ['Fönsterputs'],
          locationInfo: {
            doorCode: '',
            floor: 3,
            elevator: false,
            elevatorStatus: 'Ingen hiss',
            parkingDistance: 5,
            accessNotes: ''
          },
          customerNotes: 'Fredag - Stor villa',
          equipment: ['Städmaterial'],
          volume: 0
        }
      ]
      setAllJobs([...todaysJobs, ...mockFutureJobs])
    }
  }

  // Update todaysJobs when realtimeJobs changes
  useEffect(() => {
    // Don't override if we have mock jobs
    const mockJobs = localStorage.getItem('mockJobs')
    if (mockJobs) {
      console.log('Mock jobs detected, skipping realtime update')
      return
    }
    
    if (realtimeJobs && !realtimeLoading) {
      console.log('Updating todaysJobs from realtimeJobs:', realtimeJobs.length)
      setTodaysJobs(realtimeJobs as TodaysJob[])
    }
  }, [realtimeJobs, realtimeLoading])

  // Load all jobs when showAllJobs is toggled
  useEffect(() => {
    if (showAllJobs && allJobs.length === 0) {
      loadAllJobs()
    }
  }, [showAllJobs])

  const handleLogout = () => {
    localStorage.removeItem('staff_auth')
    router.push('/staff')
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500 text-white'
      case 'in_progress': return 'bg-green-500 text-white'
      case 'completed': return 'bg-gray-500 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getJobStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '⏰ Kommande'
      case 'in_progress': return '▶️ Pågående'
      case 'completed': return '✓ Slutfört'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-orange-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'God morgon'
    if (hour < 17) return 'God eftermiddag'
    return 'God kväll'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (time: Date | null) => {
    if (!time || !isMounted) return '--:--:--'
    return time.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }


  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'moving': return '🚚'
      case 'cleaning': return '🧹'
      case 'packing': return '📦'
      default: return '📋'
    }
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'moving': return 'text-[#002A5C] bg-blue-50'
      case 'cleaning': return 'text-green-700 bg-green-50'
      case 'packing': return 'text-orange-700 bg-orange-50'
      default: return 'text-gray-700 bg-gray-50'
    }
  }

  const getServiceTypeName = (serviceType: string) => {
    switch (serviceType) {
      case 'moving': return 'FLYTT'
      case 'cleaning': return 'STÄDNING'
      case 'packing': return 'PACKNING'
      default: return 'TJÄNST'
    }
  }


  const handleAddServiceToJob = useCallback((job: TodaysJob) => {
    setSelectedJobForService(job)
    setShowAddServiceModal(true)
  }, [])

  const handleServiceAdded = useCallback(async (services: any[]) => {
    if (!selectedJobForService) return
    
    console.log('handleServiceAdded called with:', {
      jobId: selectedJobForService.id,
      services: services,
      servicesCount: services.length
    })
    
    // Calculate total additional cost - handle both price formats
    const totalCost = services.reduce((sum, service) => {
      const cost = service.totalPrice || (service.price * service.quantity) || 0
      console.log('Service cost:', service.name, cost)
      return sum + cost
    }, 0)
    console.log('Total cost calculated:', totalCost)
    
    // Create added services entries
    const addedServices = services.map(service => ({
      id: `added-${Date.now()}-${Math.random()}`,
      serviceId: service.id,
      name: service.name,
      quantity: service.quantity || 1,
      price: service.price || (service.totalPrice / (service.quantity || 1)) || 0,
      addedAt: new Date().toISOString(),
      addedBy: staff?.name || 'Personal'
    }))
    console.log('Created addedServices:', addedServices)
    
    // Call API to save services to database
    try {
      const apiData = {
        jobId: selectedJobForService.id,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          category: service.category,
          price: service.price,
          quantity: service.quantity || 1,
          unit: service.unit,
          rutEligible: service.rutEligible !== false,
          photoUrl: service.photoUrl,
          notes: service.notes
        })),
        staffName: staff?.name || 'Personal',
        staffId: staff?.id
      }
      
      console.log('Sending to API:', apiData)
      console.log('API URL:', '/api/staff/add-service-to-order')
      
      const result = await safeFetch('/api/staff/add-service-to-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })
      
      if (!result) {
        throw new Error('Failed to save services')
      }
      
      console.log('Services saved to database:', result)
    } catch (error) {
      console.error('Error saving services to database:', error)
      // Continue with local update even if API fails
    }
    
    // Update the job in todaysJobs
    setTodaysJobs(prev => prev.map(job => {
      if (job.id === selectedJobForService.id) {
        const updatedJob = {
          ...job,
          addedServices: [...(job.addedServices || []), ...addedServices],
          totalAdditionalCost: (job.totalAdditionalCost || 0) + totalCost
        }
        
        // Save to localStorage for persistence
        const savedJobs = JSON.parse(localStorage.getItem('staff_jobs_with_services') || '{}')
        savedJobs[job.id] = {
          addedServices: updatedJob.addedServices,
          totalAdditionalCost: updatedJob.totalAdditionalCost
        }
        localStorage.setItem('staff_jobs_with_services', JSON.stringify(savedJobs))
        
        // Save to order confirmation
        const flyttparm = JSON.parse(localStorage.getItem('customer_flyttparm') || '{}')
        if (!flyttparm[job.bookingNumber]) {
          flyttparm[job.bookingNumber] = {
            customerName: job.customerName,
            bookingNumber: job.bookingNumber,
            orderDate: new Date().toISOString(),
            services: []
          }
        }
        flyttparm[job.bookingNumber].services = [
          ...(flyttparm[job.bookingNumber].services || []),
          ...addedServices.map(s => ({
            ...s,
            addedDuringJob: true
          }))
        ]
        flyttparm[job.bookingNumber].lastUpdated = new Date().toISOString()
        localStorage.setItem('customer_flyttparm', JSON.stringify(flyttparm))
        
        return updatedJob
      }
      return job
    }))
    
    // Also update allJobs if loaded
    setAllJobs(prev => prev.map(job => {
      if (job.id === selectedJobForService.id) {
        return {
          ...job,
          addedServices: [...(job.addedServices || []), ...addedServices],
          totalAdditionalCost: (job.totalAdditionalCost || 0) + totalCost
        }
      }
      return job
    }))
    
    // Show success toast
    showToast(`Tjänster tillagda! (+${totalCost} kr)`, 'success')
  }, [selectedJobForService, staff])

  // Time tracking and warning handlers - define before use
  const handleTimeWarnings = useCallback((warnings: TimeWarning[]) => {
    setTimeWarnings(warnings)
  }, [])

  const handleStartJobClick = useCallback((job: TodaysJob) => {
    console.log('handleStartJobClick called for job:', job.id, job.customerName)
    setSelectedJobForStart(job)
    // Small delay to ensure job is set before showing modal
    requestAnimationFrame(() => {
      setShowChecklistModal(true)
    })
  }, [])

  const handleJobStart = useCallback(async () => {
    if (!selectedJobForStart) return

    console.log('Starting job:', selectedJobForStart.id)
    const job = selectedJobForStart
    
    setLoadingJobId(job.id)
    setLoadingAction('start')
    
    const jobLocation = {
      latitude: 59.334591,
      longitude: 18.063240,
      address: job.toAddress
    }

    try {
      // Visa GPS-modal för start
      const timeTrackingResult = await startTimeTrackingWithWarnings(
        job.id,
        job.serviceType,
        jobLocation,
        job.endTime,
        job.estimatedHours,
        handleTimeWarnings,
        job.bookingNumber,
        job.customerName
      )

      if (timeTrackingResult.success) {
        // Uppdatera status DIREKT
        setTodaysJobs(prev => 
          prev.map(j => 
            j.id === job.id 
              ? { ...j, status: 'in_progress' as const, lastUpdated: Date.now() }
              : j
          )
        )
        
        // Force refresh för att uppdatera UI
        setLastRefresh(Date.now())
        
        // Spara status
        const mockJobs = localStorage.getItem('mockJobs')
        if (mockJobs) {
          const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
          jobStatuses[job.id] = 'in_progress'
          localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
        }

        // Stäng modal
        setShowChecklistModal(false)
        setSelectedJobForStart(null)
        
        // Visa bekräftelse
        showToast('Uppdrag startat!', 'success')
      }
    } catch (error) {
      console.error('Error starting job:', error)
    } finally {
      setLoadingJobId(null)
      setLoadingAction(null)
    }
  }, [selectedJobForStart, handleTimeWarnings])

  const handleJobEnd = async (jobId: string) => {
    console.log('Ending job:', jobId)
    const job = todaysJobs.find(j => j.id === jobId)
    if (!job) return
    
    setLoadingJobId(jobId)
    setLoadingAction('end')
    
    try {
      // Uppdatera status DIREKT - ingen GPS-kontroll
      setTodaysJobs(prev => 
        prev.map(j => 
          j.id === jobId 
            ? { ...j, status: 'completed' as const, lastUpdated: Date.now() }
            : j
        )
      )
      
      // Force refresh
      setLastRefresh(Date.now())
      
      // Spara status
      const mockJobs = localStorage.getItem('mockJobs')
      if (mockJobs) {
        const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}')
        jobStatuses[jobId] = 'completed'
        localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses))
      }
      
      // Visa bekräftelse
      showToast('Uppdrag avslutat!', 'success')
    } catch (error) {
      console.error('Error ending job:', error)
    } finally {
      setLoadingJobId(null)
      setLoadingAction(null)
    }
  }

  const handleJobCardClick = useCallback((job: TodaysJob, selectedService: string) => {
    setSelectedJobForDetail(job)
    setSelectedServiceForDetail(selectedService)
    setShowJobDetailModal(true)
  }, [])

  const handleAddServiceFromDetail = useCallback((jobId: string) => {
    const job = todaysJobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJobForService(job)
      setShowAddServiceModal(true)
      setShowJobDetailModal(false)
    }
  }, [todaysJobs])

  const handleWarningAction = useCallback((type: TimeWarning['type']) => {
    switch (type) {
      case 'approaching_end':
      case 'overtime':
        // Show job details or overtime reporting
        if (activeJobForWarnings) {
          setSelectedJobForDetail(activeJobForWarnings)
          setShowJobDetailModal(true)
        }
        break
      case 'break_reminder':
      case 'long_shift':
        // Show hours modal
        setShowMyHoursModal(true)
        break
    }
  }, [activeJobForWarnings])

  const handleWarningDismiss = useCallback((type: TimeWarning['type']) => {
    setTimeWarnings(prev => prev.filter(w => w.type !== type))
  }, [])

  const handleOvertimeDetected = useCallback((info: any) => {
    setOvertimeInfo(info)
    setShowOvertimeModal(true)
  }, [])

  const handleOvertimeSubmit = useCallback((reason: string, notes?: string) => {
    console.log('Overtime reported:', { reason, notes, overtimeInfo })
    // Here you would save the overtime report to your backend
    
    // Show success message
    showToast(`Övertid rapporterad! Orsak: ${reason}`, 'success')
    
    setShowOvertimeModal(false)
    setOvertimeInfo(null)
  }, [overtimeInfo])

  const handleOvertimePromptSubmit = useCallback((reason: string, notes?: string, addService?: boolean) => {
    if (!overtimePromptInfo) return

    // Mark as reported to prevent repeated prompts
    localStorage.setItem(`overtime_reported_${overtimePromptInfo.jobId}`, 'true')
    
    // Save overtime report
    const overtimeReport = {
      jobId: overtimePromptInfo.jobId,
      customerName: overtimePromptInfo.customerName,
      reason,
      notes,
      overtimeMinutes: overtimePromptInfo.overtimeMinutes,
      reportedAt: new Date().toISOString()
    }
    
    // Store in localStorage (in real app, send to backend)
    const existingReports = JSON.parse(localStorage.getItem('overtime_reports') || '[]')
    existingReports.push(overtimeReport)
    localStorage.setItem('overtime_reports', JSON.stringify(existingReports))
    
    console.log('Overtime prompt submitted:', overtimeReport)
    
    // Show success message
    showToast(`Övertid rapporterad! Orsak: ${reason} - Övertid: ${Math.floor(overtimePromptInfo.overtimeMinutes / 60)}h ${overtimePromptInfo.overtimeMinutes % 60}m`, 'success')
    
    setShowOvertimePrompt(false)
    setOvertimePromptInfo(null)
    
    // If user wants to add service, trigger add service modal
    if (addService) {
      const job = todaysJobs.find(j => j.id === overtimePromptInfo.jobId)
      if (job) {
        setSelectedJobForService(job)
        setShowAddServiceModal(true)
      }
    }
  }, [overtimePromptInfo, todaysJobs])

  // Trigger notification handlers
  const handleTriggerStartJob = useCallback(() => {
    const activeJob = todaysJobs.find(job => job.status === 'in_progress')
    if (activeJob) {
      setSelectedJobForStart(activeJob)
      setShowChecklistModal(true)
    }
  }, [todaysJobs])

  const handleTriggerNavigate = useCallback(() => {
    const activeJob = todaysJobs.find(job => job.status === 'in_progress')
    if (activeJob) {
      const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeJob.toAddress)}`
      window.open(mapUrl, '_blank')
    }
  }, [todaysJobs])

  const handleTriggerOpenCamera = useCallback(() => {
    const activeJob = todaysJobs.find(job => job.status === 'in_progress')
    if (activeJob) {
      setSelectedJobForPhotos(activeJob)
      setPhotoPhase('during')
      setShowPhotoReminders(true)
    }
  }, [todaysJobs])

  const handleTriggerDismiss = useCallback((notificationId: string) => {
    setDismissedTriggers(prev => [...prev, notificationId])
  }, [])

  // Calculate time remaining for active job
  const getTimeRemaining = useCallback(() => {
    const activeJob = todaysJobs.find(job => job.status === 'in_progress')
    if (!activeJob) return 0
    
    const now = new Date()
    const scheduledEnd = new Date()
    const [hours, minutes] = activeJob.endTime.split(':').map(Number)
    scheduledEnd.setHours(hours, minutes, 0, 0)
    
    const remainingMs = scheduledEnd.getTime() - now.getTime()
    return Math.max(0, Math.floor(remainingMs / (1000 * 60))) // minutes
  }, [todaysJobs])

  // Enhanced time monitoring for active jobs with overtime prompts
  useEffect(() => {
    const activeJob = todaysJobs.find(job => job.status === 'in_progress')
    setActiveJobForWarnings(activeJob || null)
    
    if (activeJob) {
      const interval = setInterval(() => {
        const warnings = checkTimeWarnings(activeJob.id, activeJob.endTime, activeJob.estimatedHours)
        setTimeWarnings(warnings)
        
        // Check for overtime and trigger prompt after 15-30 minutes
        const currentTime = getCurrentWorkTime(activeJob.id)
        if (currentTime.isActive) {
          const scheduledEnd = new Date()
          const [hours, minutes] = activeJob.endTime.split(':').map(Number)
          scheduledEnd.setHours(hours, minutes, 0, 0)
          
          const now = new Date()
          const overtimeMs = now.getTime() - scheduledEnd.getTime()
          
          if (overtimeMs > 0) {
            const overtimeMinutes = Math.floor(overtimeMs / (1000 * 60))
            
            // Show overtime prompt after 15 minutes of overtime
            if (overtimeMinutes >= 15 && !showOvertimePrompt && !localStorage.getItem(`overtime_reported_${activeJob.id}`)) {
              setOvertimePromptInfo({
                jobId: activeJob.id,
                customerName: activeJob.customerName,
                overtimeMinutes,
                scheduledEndTime: activeJob.endTime,
                currentTime: now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              })
              setShowOvertimePrompt(true)
            }
          }
        }
      }, 60000) // Check every minute
      
      return () => clearInterval(interval)
    }
  }, [todaysJobs, showOvertimePrompt])

  if (!isMounted || isLoading || !staff) {
    return <PageLoader message="Laddar dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 touch-friendly">
      {/* Service Display Fix Component */}
      <ServiceDisplayFix />
      
      {/* Top Navigation */}
      <TopNavigation 
        unreadMessages={unreadMessages} 
        onChatToggle={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />
      
      {/* Header */}
      <header className="bg-[#002A5C] text-white sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-white text-[#002A5C] font-bold">
                  {getInitials(staff.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{getGreeting()}, {staff.name.split(' ')[0]}!</p>
                <p className="text-sm text-blue-100">{staff.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <Battery className="h-4 w-4 text-green-400" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 flex items-center space-x-1"
                onClick={() => setShowMyHoursModal(true)}
                title="Mina Timmar"
              >
                <Clock className="h-5 w-5" />
                <span className="text-xs hidden sm:inline">0h</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowPhotoGallery(true)}
              >
                <Camera className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 relative"
                onClick={() => setShowSmartNotifications(true)}
                title="Smarta påminnelser"
              >
                <Bell className="h-5 w-5" />
                {(smartNotificationCount + (unreadCount || 0)) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {smartNotificationCount + (unreadCount || 0)}
                  </span>
                )}
              </Button>
              <RealtimeStatus className="text-white" />
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-2 space-y-3">


        {/* Time Warnings */}
        {timeWarnings.length > 0 && (
          <TimeWarningBanner 
            warnings={timeWarnings}
            onDismiss={handleWarningDismiss}
            onAction={handleWarningAction}
          />
        )}

        {/* UX Trigger Notifications */}
        <TriggerNotificationSystem
          activeJobId={todaysJobs.find(job => job.status === 'in_progress')?.id || null}
          isJobStarted={todaysJobs.some(job => job.status === 'in_progress')}
          timeRemaining={getTimeRemaining()}
          missingPhotos={missingPhotos}
          onStartJob={handleTriggerStartJob}
          onNavigateToJob={handleTriggerNavigate}
          onOpenCamera={handleTriggerOpenCamera}
          onDismiss={handleTriggerDismiss}
        />

        {/* Work Time Display - Visa endast på desktop eller som kompakt version på mobil */}
        <div className="hidden lg:block">
          <WorkTimeDisplay />
        </div>


        {/* Today's Jobs */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#002A5C]" />
                <span>Dagens Uppdrag</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllJobs(!showAllJobs)}
              >
                {showAllJobs ? 'Visa dagens' : 'Visa alla'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4 overflow-hidden">
            {(() => {
              const jobsToShow = showAllJobs ? allJobs : todaysJobs
              
              if (jobsToShow.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {showAllJobs ? 'Inga kommande uppdrag' : 'Inga uppdrag idag'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {showAllJobs ? 'Alla uppdrag visas här' : 'Njut av din lediga dag!'}
                    </p>
                  </div>
                )
              }
              
              // Visa alltid tidslinje-vy
              return (
                <div className="space-y-3 pb-20">
                  <div className="text-sm font-medium text-gray-700 mb-4">
                    📅 {showAllJobs ? 'Alla uppdrag' : 'Dagens schema'}
                  </div>
                  {jobsToShow.map((job) => {
                  // Use actual job services, don't override with default
                  const services = job.services && job.services.length > 0 
                    ? job.services 
                    : ['Packhjälp', 'Flytt', 'Flyttstädning']
                  
                  // Calculate time ranges based on number of services
                  const timeRanges = services.length === 1 
                    ? [`${job.moveTime}-${job.endTime}`]
                    : ['08:00-12:00', '12:00-16:00', '16:00-20:00']
                  
                  return (
                    <div key={job.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{job.customerName}</h3>
                        <Badge className={getJobStatusColor(job.status)}>
                          {getJobStatusText(job.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {services.map((service, idx) => {
                          const serviceConfig = getServiceConfig(service, job)
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:shadow-sm transition-all ${serviceConfig.bgColor}`}
                              onClick={() => handleJobCardClick(job, service)}
                            >
                              <div className="flex items-center space-x-2">
                                <span>{serviceConfig.emoji}</span>
                                <span className="text-sm font-medium">{service}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-700">{timeRanges[idx] || `${job.moveTime}-${job.endTime}`}</div>
                                <div className="text-xs text-gray-500">
                                  {job.status === 'in_progress' ? (
                                    <ServiceTimeDisplay jobId={job.id} isActive={true} />
                                  ) : (
                                    `${job.estimatedHours || 4}h estimerat`
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{job.toAddress}</span>
                      </div>
                      
                      {/* Show added services */}
                      {job.addedServices && job.addedServices.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium">Tillagda tjänster:</span>
                            <span className="text-green-600 font-semibold">+{job.totalAdditionalCost || 0} kr</span>
                          </div>
                          <div className="mt-1 space-y-1">
                            {job.addedServices.map((service, index) => {
                              // Ensure we have valid service data
                              if (!service || typeof service !== 'object') {
                                return null
                              }
                              
                              const serviceName = service.name || 'Okänd tjänst'
                              const serviceQuantity = service.quantity || 1
                              const servicePrice = service.price || 0
                              const totalPrice = servicePrice * serviceQuantity
                              
                              // Only show first 3 services
                              if (index >= 3) return null
                              
                              // Generate stable key
                              const serviceKey = generateServiceKey(service, job.id, index)
                              
                              return (
                                <div key={serviceKey} className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{serviceQuantity}x {serviceName}</span>
                                  <span>{totalPrice} kr</span>
                                </div>
                              )
                            })}
                            {job.addedServices.length > 3 && (
                              <div className="text-xs text-gray-400 italic">
                                +{job.addedServices.length - 3} till...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Action buttons based on job status */}
                      {job.status === 'upcoming' && (
                        <div className="flex pt-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full h-11 text-sm bg-[#002A5C] hover:bg-[#003872]"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartJobClick(job)
                            }}
                            disabled={loadingJobId === job.id && loadingAction === 'start'}
                          >
                            {loadingJobId === job.id && loadingAction === 'start' ? (
                              <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Startar...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Påbörja uppdrag
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {job.status === 'in_progress' && (
                        <div className="flex space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-11 text-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedJobForPhotos(job)
                              setPhotoPhase('during')
                              setShowPhotoReminders(true)
                            }}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Foto
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-11 text-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedJobForService(job)
                              setShowAddServiceModal(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Lägg till tjänst
                          </Button>
                        </div>
                      )}
                      
                      {/* Show order confirmation button if services have been added */}
                      {job.addedServices && job.addedServices.length > 0 && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-11 text-sm text-[#002A5C]"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBookingNumber(job.bookingNumber)
                              setShowOrderConfirmation(true)
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Visa orderbekräftelse
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Compact Stats Bar - Mobile only */}
        <div className="lg:hidden bg-gray-50 rounded-lg p-3 flex justify-around items-center">
          <button 
            onClick={() => setShowMyHoursModal(true)}
            className="text-center hover:bg-gray-100 rounded px-3 py-2 min-h-[44px] transition-colors"
          >
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-[#002A5C]" />
              <span className="text-sm font-bold">0h</span>
            </div>
            <p className="text-xs text-gray-600">Idag</p>
          </button>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold">{(showAllJobs ? allJobs : todaysJobs).length}</span>
            </div>
            <p className="text-xs text-gray-600">Uppdrag</p>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-bold">0</span>
            </div>
            <p className="text-xs text-gray-600">Klara</p>
          </div>
        </div>
        
        {/* Full Stats Bar - Desktop only */}
        <div className="hidden lg:flex bg-gray-50 rounded-lg p-3 justify-around items-center">
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <Truck className="h-5 w-5 text-[#002A5C]" />
              <span className="text-lg font-bold">{(showAllJobs ? allJobs : todaysJobs).length}</span>
            </div>
            <p className="text-xs text-gray-600">{showAllJobs ? 'Alla uppdrag' : 'Uppdrag'}</p>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-bold">{(showAllJobs ? allJobs : todaysJobs).reduce((sum, job) => sum + job.estimatedHours, 0)}h</span>
            </div>
            <p className="text-xs text-gray-600">Totalt</p>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold">{new Set((showAllJobs ? allJobs : todaysJobs).flatMap(job => job.teamMembers)).size}</span>
            </div>
            <p className="text-xs text-gray-600">I teamet</p>
          </div>
        </div>
        
      </div>
      
      {/* Enhanced Sticky Mobile Action Bar for Active Job */}
      {todaysJobs.filter(job => job.status === 'in_progress').length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
          {todaysJobs.filter(job => job.status === 'in_progress').map((job) => {
            // Dynamisk tidshantering baserat på aktuell tjänst
            const getCurrentServiceTime = (job) => {
              const currentHour = new Date().getHours()
              
              // Packhjälp: 08:00-12:00
              if (currentHour >= 8 && currentHour < 12 && job.services.includes('Packhjälp')) {
                return getServiceConfig('Packhjälp', job).timeRange
              }
              // Flytt: 12:00-16:00  
              else if (currentHour >= 12 && currentHour < 16 && job.services.includes('Flytt')) {
                return getServiceConfig('Flytt', job).timeRange
              }
              // Städning: 16:00-20:00
              else if (currentHour >= 16 && currentHour < 20 && job.services.includes('Flyttstädning')) {
                return getServiceConfig('Flyttstädning', job).timeRange
              }
              // Fallback till första tjänsten om ingen tid matchar
              else {
                return getServiceConfig(job.services[0], job).timeRange
              }
            }

            const getCurrentServiceName = (job) => {
              const currentHour = new Date().getHours()
              
              if (currentHour >= 8 && currentHour < 12 && job.services.includes('Packhjälp')) {
                return 'Packhjälp'
              } else if (currentHour >= 12 && currentHour < 16 && job.services.includes('Flytt')) {
                return 'Flytt'
              } else if (currentHour >= 16 && currentHour < 20 && job.services.includes('Flyttstädning')) {
                return 'Flyttstädning'
              } else {
                return job.services[0]
              }
            }

            const currentService = getCurrentServiceName(job)
            const currentServiceConfig = getServiceConfig(currentService, job)
            
            return (
              <div key={job.id} className="p-4 space-y-3">
                {/* Job Header med dynamisk tjänst och tid */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                    <span>Pågående: {job.customerName}</span>
                    <Badge className={`${currentServiceConfig.bgColor} ${currentServiceConfig.color} text-xs px-2 py-1`}>
                      {currentServiceConfig.emoji} {currentService}
                    </Badge>
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    {getCurrentServiceTime(job)}
                  </div>
                </div>
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant="outline"
                  className="h-12 text-xs font-medium flex flex-col items-center justify-center p-1"
                  onClick={() => {
                    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.toAddress)}`
                    window.open(mapUrl, '_blank')
                  }}
                >
                  <NavigationIcon className="h-4 w-4 mb-1" />
                  <span>Navigera</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-12 text-xs font-medium flex flex-col items-center justify-center p-1"
                  onClick={() => window.open(`tel:${job.customerPhone}`)}
                >
                  <Phone className="h-4 w-4 mb-1" />
                  <span>Ring kund</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-12 text-xs font-medium flex flex-col items-center justify-center p-1 bg-blue-50 border-blue-200 text-blue-700"
                  onClick={() => {
                    setSelectedJobForPhotos(job)
                    setPhotoPhase('during')
                    setShowPhotoReminders(true)
                  }}
                >
                  <Camera className="h-4 w-4 mb-1" />
                  <span>Foto</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-12 text-xs font-medium flex flex-col items-center justify-center p-1"
                  onClick={() => {
                    setSelectedJobForService(job)
                    setShowAddServiceModal(true)
                  }}
                >
                  <Plus className="h-4 w-4 mb-1" />
                  <span>Tjänst</span>
                </Button>
              </div>
              
              {/* Main Actions */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  className="flex-1 h-12 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 font-semibold"
                  onClick={async () => {
                    // Pausa/fortsätt
                    alert('Paus-funktion kommer snart!')
                  }}
                >
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pausa
                </Button>
                
                <Button 
                  className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  disabled={loadingJobId === job.id && loadingAction === 'end'}
                  onClick={() => handleJobEnd(job.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Avsluta {currentService}
                </Button>
              </div>
            </div>
          )
        })}
        </div>
      )}

      
      
      {/* Add Service Modal */}
      {selectedJobForService && (
        <AddServiceModal
          isOpen={showAddServiceModal}
          onClose={() => {
            setShowAddServiceModal(false)
            setSelectedJobForService(null)
          }}
          jobId={selectedJobForService.id}
          customerName={selectedJobForService.customerName}
          jobData={selectedJobForService}
          onServiceAdded={handleServiceAdded}
        />
      )}
      
      {/* Pre-Start Checklist Modal */}
      {showChecklistModal && selectedJobForStart && (
        <PreStartChecklistModal
          isOpen={true}
          onClose={() => {
            setShowChecklistModal(false)
            setSelectedJobForStart(null)
          }}
          onStartJob={handleJobStart}
          jobData={selectedJobForStart}
        />
      )}
      
      {/* Job Detail Modal */}
      {selectedJobForDetail && (
        <JobDetailModal
          isOpen={showJobDetailModal}
          onClose={() => {
            setShowJobDetailModal(false)
            setSelectedJobForDetail(null)
            setSelectedServiceForDetail(null)
          }}
          job={selectedJobForDetail}
          selectedService={selectedServiceForDetail}
          onAddService={handleAddServiceFromDetail}
        />
      )}

      {/* Smart Photo Reminder System */}
      {showPhotoReminders && selectedJobForPhotos && (
        <PhotoReminderSystem
          jobData={{
            serviceType: selectedJobForPhotos.serviceType,
            services: selectedJobForPhotos.services,
            specialRequirements: selectedJobForPhotos.specialRequirements,
            customerName: selectedJobForPhotos.customerName,
            toAddress: selectedJobForPhotos.toAddress
          }}
          currentPhase={photoPhase}
          onPhotoTaken={(reminder) => {
            console.log('Photo taken:', reminder)
            // In real app: store photo data, update job status
          }}
          onDismiss={() => {
            setShowPhotoReminders(false)
            setSelectedJobForPhotos(null)
          }}
        />
      )}

      {/* Photo Gallery */}
      <PhotoGallery 
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
      />

      {/* Overtime Modal */}
      {overtimeInfo && (
        <OvertimeModal
          isOpen={showOvertimeModal}
          onClose={() => {
            setShowOvertimeModal(false)
            setOvertimeInfo(null)
          }}
          jobInfo={{
            id: overtimeInfo.jobId,
            customerName: todaysJobs.find(j => j.id === overtimeInfo.jobId)?.customerName || 'Okänd kund',
            scheduledEndTime: overtimeInfo.scheduledEndTime,
            actualTime: overtimeInfo.actualEndTime,
            overtimeMinutes: overtimeInfo.overtimeMinutes
          }}
          onSubmit={handleOvertimeSubmit}
        />
      )}

      {/* Overtime Prompt - Automatic trigger after 15-30 min overtime */}
      {overtimePromptInfo && (
        <OvertimePrompt
          isOpen={showOvertimePrompt}
          onClose={() => {
            setShowOvertimePrompt(false)
            setOvertimePromptInfo(null)
          }}
          jobInfo={{
            id: overtimePromptInfo.jobId,
            customerName: overtimePromptInfo.customerName,
            overtimeMinutes: overtimePromptInfo.overtimeMinutes,
            scheduledEndTime: overtimePromptInfo.scheduledEndTime,
            currentTime: overtimePromptInfo.currentTime
          }}
          onSubmitReason={handleOvertimePromptSubmit}
        />
      )}

      {/* My Hours Modal */}
      <MyHoursModal
        isOpen={showMyHoursModal}
        onClose={() => setShowMyHoursModal(false)}
        staffId={staff?.id || ''}
      />

      {/* Smart Notification Center */}
      <SmartNotificationCenter
        isOpen={showSmartNotifications}
        onClose={() => setShowSmartNotifications(false)}
        staffId={staff?.id || ''}
        onOpenCamera={() => {
          setShowPhotoGallery(true)
          // Could also trigger photo reminders for active job if needed
          const activeJob = todaysJobs.find(job => job.status === 'in_progress')
          if (activeJob) {
            setSelectedJobForPhotos(activeJob)
            setPhotoPhase('during')
            setShowPhotoReminders(true)
          }
        }}
        onOpenHours={() => setShowMyHoursModal(true)}
        onNotificationCountChange={(count) => setSmartNotificationCount(count)}
      />

      {/* Operational Chat */}
      <OperationalChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        teamMembers={todaysJobs.flatMap(job => job.teamMembers).filter((member, index, arr) => arr.indexOf(member) === index)}
        jobId={todaysJobs.find(job => job.status === 'in_progress')?.id}
      />

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && selectedBookingNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <OrderConfirmationView 
              bookingNumber={selectedBookingNumber}
              onClose={() => {
                setShowOrderConfirmation(false)
                setSelectedBookingNumber(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        visible={loadingJobId !== null}
        message={
          loadingAction === 'start' ? 'Startar jobb...' : 
          loadingAction === 'end' ? 'Avslutar jobb...' : 
          'Bearbetar...'
        }
      />
    </div>
  )
}
