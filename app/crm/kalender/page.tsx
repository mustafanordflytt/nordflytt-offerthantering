'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin, 
  Clock,
  User,
  Package,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Phone,
  Brain,
  TrendingUp,
  Shield,
  Wifi,
  ShieldCheck,
  Eye,
  EyeOff,
  Zap,
  Users,
  Cloud,
  Route,
  DollarSign,
  Leaf,
  Car,
  BarChart3,
  Target,
  RefreshCw,
  Plus,
  Filter,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: string
  status: string
  start: Date
  end: Date
  allDay: boolean
  jobId?: string
  job?: any
  customerId?: string
  customer?: any
  assignedStaff: any[]
  location?: {
    name?: string
    address?: string
    lat?: number
    lng?: number
  }
  color?: string
  priority?: string
}

interface Resource {
  id: string
  name: string
  type: string
  capacity?: number
  location?: string
  isActive: boolean
  currentBooking?: any
  upcomingBookings?: any[]
}

interface StaffAvailability {
  staffId: string
  name: string
  email: string
  phone?: string
  role: string
  isAvailable: boolean
  conflicts: any[]
  totalEvents: number
  availabilityPercentage: number
  bookedHours: number
}

export default function EnhancedCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [availability, setAvailability] = useState<StaffAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'resources'>('month')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [selectedStaff] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'meeting',
    start: '',
    end: '',
    location: '',
    assignedStaff: [] as string[]
  })
  const [stats, setStats] = useState({
    totalEvents: 0,
    todayEvents: 0,
    upcomingEvents: 0,
    eventsByType: {} as Record<string, number>
  })

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const headers = await getAuthHeaders()
      
      const startDate = new Date(currentDate)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(currentDate)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      endDate.setHours(23, 59, 59, 999)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        viewMode: viewMode
      })

      if (selectedEventType !== 'all') {
        params.append('eventType', selectedEventType)
      }

      if (selectedStaff !== 'all') {
        params.append('staffId', selectedStaff)
      }

      const response = await fetch(`/api/crm/calendar/events?${params}`, {
        headers
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        
        // If unauthorized, try to refresh the page once
        if (response.status === 401 && !window.location.search.includes('retry')) {
          window.location.href = window.location.pathname + '?retry=1'
          return
        }
        
        throw new Error(`Failed to fetch calendar events: ${response.status}`)
      }

      const data = await response.json()
      
      setEvents(data.events || [])
      setStats(data.stats || {
        totalEvents: 0,
        todayEvents: 0,
        upcomingEvents: 0,
        eventsByType: {}
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
      console.error('Error fetching events:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentDate, selectedEventType, selectedStaff, viewMode])

  const fetchResources = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/crm/calendar/resources', {
        headers
      })

      if (!response.ok) {
        console.error('Resources API error:', response.status)
        // Use empty resources instead of throwing
        setResources([])
        return
      }

      const data = await response.json()
      setResources(data.resources || [])
    } catch (err) {
      console.error('Error fetching resources:', err)
      // Set empty resources on error
      setResources([])
    }
  }, [])

  // Initial load
  useEffect(() => {
    // Set a default token for development if none exists
    let token = localStorage.getItem('crm-token')
    if (!token) {
      token = 'crm-token-123'
      localStorage.setItem('crm-token', token)
    }
    
    if (!document.cookie.includes('auth-token')) {
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`
    }
    
    fetchEvents()
    fetchResources()
  }, [fetchEvents, fetchResources])

  // Update when date or filters change
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Auto-refresh every 30 seconds only if not loading and no errors
  useEffect(() => {
    if (!isLoading && !error) {
      const interval = setInterval(() => {
        fetchEvents()
        // Skip resources fetch to avoid 500 errors
        // fetchResources()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isLoading, error, fetchEvents])

  const checkAvailability = useCallback(async (date: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/crm/calendar/availability?date=${date}`, {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to check availability')
      }

      const data = await response.json()
      setAvailability(data.staff || [])
      
      if (data.summary.availableStaff === 0) {
        toast.error('Ingen personal tillgänglig', {
          description: 'All personal är upptagen på valt datum.'
        })
      }
    } catch (err) {
      console.error('Error checking availability:', err)
    }
  }, [])

  const exportToICal = () => {
    const icsEvents = events.map(event => {
      const start = new Date(event.start)
      const end = new Date(event.end)
      
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      }
      
      return `BEGIN:VEVENT
UID:${event.id}@nordflytt.se
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location?.address || ''}
STATUS:CONFIRMED
END:VEVENT`
    }).join('\n')
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nordflytt//CRM Calendar//SV
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`
    
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nordflytt-kalender-${currentDate.toISOString().slice(0, 7)}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Kalender exporterad', {
      description: 'Kalenderfilen har laddats ner'
    })
  }

  const createEvent = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/crm/calendar/events', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newEvent,
          location: newEvent.location ? { address: newEvent.location } : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create event')
      }

      toast.success('Händelse skapad', {
        description: 'Kalenderhändelsen har skapats.'
      })

      setShowCreateDialog(false)
      setNewEvent({
        title: '',
        description: '',
        type: 'meeting',
        start: '',
        end: '',
        location: '',
        assignedStaff: []
      })
      fetchEvents()
    } catch (err) {
      toast.error('Kunde inte skapa händelse', {
        description: err instanceof Error ? err.message : 'Ett fel uppstod'
      })
    }
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color
    
    const colors: Record<string, string> = {
      job: '#002A5C',
      meeting: '#0088cc',
      training: '#28a745',
      break: '#ffc107',
      vacation: '#6c757d',
      other: '#17a2b8'
    }
    return colors[event.type] || '#6c757d'
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const weekDays = []
    const timeSlots = []
    
    // Generate week days
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDays.push(date)
    }
    
    // Generate time slots (6 AM to 10 PM)
    for (let hour = 6; hour < 22; hour++) {
      timeSlots.push(hour)
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 text-center text-sm font-medium bg-gray-50">Tid</div>
          {weekDays.map((date, index) => (
            <div 
              key={index} 
              className={`p-2 text-center border-l ${
                date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-sm font-medium">
                {date.toLocaleDateString('sv-SE', { weekday: 'short' })}
              </div>
              <div className={`text-lg ${
                date.toDateString() === new Date().toDateString() ? 'font-bold text-blue-600' : ''
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time slots */}
        <div className="overflow-y-auto max-h-[600px]">
          {timeSlots.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="p-2 text-xs text-gray-500 bg-gray-50 text-right">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              {weekDays.map((date, dayIndex) => {
                const dayEvents = events.filter(event => {
                  const eventDate = new Date(event.start)
                  return eventDate.toDateString() === date.toDateString() &&
                         eventDate.getHours() <= hour &&
                         new Date(event.end).getHours() > hour
                })
                
                return (
                  <div key={dayIndex} className="relative border-l min-h-[60px] hover:bg-gray-50">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="absolute inset-x-1 p-1 m-1 rounded text-xs text-white overflow-hidden cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: getEventColor(event),
                          top: `${(new Date(event.start).getMinutes() / 60) * 100}%`,
                          height: `${((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)) * 60}px`
                        }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="truncate">{event.location?.name || event.location?.address}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === currentDate.toDateString()
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    
    const timeSlots = []
    for (let hour = 6; hour < 22; hour++) {
      timeSlots.push(hour)
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
        </div>
        
        <div className="grid grid-cols-[100px_1fr] divide-x">
          {/* Time column */}
          <div className="space-y-0">
            {timeSlots.map(hour => (
              <div key={hour} className="h-[60px] border-b px-2 py-1 text-xs text-gray-500 text-right">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          
          {/* Events column */}
          <div className="relative">
            {timeSlots.map(hour => (
              <div key={hour} className="h-[60px] border-b"></div>
            ))}
            
            {/* Render events */}
            {dayEvents.map(event => {
              const startTime = new Date(event.start)
              const endTime = new Date(event.end)
              const startHour = startTime.getHours()
              const startMinutes = startTime.getMinutes()
              const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
              
              if (startHour >= 6 && startHour < 22) {
                return (
                  <div
                    key={event.id}
                    className="absolute left-2 right-2 p-2 rounded text-white cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: getEventColor(event),
                      top: `${((startHour - 6) * 60 + startMinutes)}px`,
                      height: `${duration * 60}px`,
                      minHeight: '40px'
                    }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs opacity-90">
                      {startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} - 
                      {endTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.location?.address && (
                      <div className="text-xs mt-1 opacity-90">{event.location.address}</div>
                    )}
                    {event.assignedStaff.length > 0 && (
                      <div className="text-xs mt-1">
                        <User className="inline h-3 w-3 mr-1" />
                        {event.assignedStaff.length} personal
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
        
        {/* No events message */}
        {dayEvents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Inga händelser schemalagda denna dag</p>
          </div>
        )}
      </div>
    )
  }

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const weeks = []
    const currentWeek = new Date(startDate)
    
    while (currentWeek <= lastDay || currentWeek.getDay() !== 0) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeek)
        const dayEvents = events.filter(event => {
          const eventDate = new Date(event.start)
          return eventDate.toDateString() === date.toDateString()
        })
        
        week.push({
          date,
          events: dayEvents,
          isCurrentMonth: date.getMonth() === currentDate.getMonth()
        })
        
        currentWeek.setDate(currentWeek.getDate() + 1)
      }
      weeks.push(week)
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weeks.map((week, weekIndex) => (
            week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`min-h-[100px] bg-white p-2 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${
                  day.date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: getEventColor(event), color: 'white' }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{day.events.length - 3} mer
                    </div>
                  )}
                </div>
              </div>
            ))
          ))}
        </div>
      </div>
    )
  }

  const renderResourcesView = () => {
    const vehicleResources = resources.filter(r => r.type === 'vehicle')
    const roomResources = resources.filter(r => r.type === 'room')
    const equipmentResources = resources.filter(r => r.type === 'equipment')

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Fordon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicleResources.map(resource => (
                  <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">{resource.location}</p>
                    </div>
                    <Badge variant={resource.currentBooking ? "destructive" : "default"} className={!resource.currentBooking ? "bg-green-500 text-white" : ""}>
                      {resource.currentBooking ? "Upptagen" : "Tillgänglig"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lokaler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roomResources.map(resource => (
                  <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">Kapacitet: {resource.capacity}</p>
                    </div>
                    <Badge variant={resource.currentBooking ? "destructive" : "default"} className={!resource.currentBooking ? "bg-green-500 text-white" : ""}>
                      {resource.currentBooking ? "Upptagen" : "Tillgänglig"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Utrustning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipmentResources.map(resource => (
                  <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">{resource.location}</p>
                    </div>
                    <Badge variant={resource.currentBooking ? "destructive" : "default"} className={!resource.currentBooking ? "bg-green-500 text-white" : ""}>
                      {resource.currentBooking ? "Upptagen" : "Tillgänglig"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {availability.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Personaltillgänglighet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availability.map(staff => (
                  <div key={staff.staffId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-muted-foreground">{staff.role}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={staff.availabilityPercentage} className="w-24" />
                      <Badge variant={staff.isAvailable ? "default" : "destructive"} className={staff.isAvailable ? "bg-green-500 text-white" : ""}>
                        {staff.isAvailable ? "Tillgänglig" : `${staff.conflicts.length} konflikter`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar kalender...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Felsökning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Om du ser felmeddelanden kan du prova följande:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Acceptera cookies i dialogrutan som visas</li>
              <li>Ladda om sidan (Ctrl/Cmd + R)</li>
              <li>Rensa webbläsarens cache och cookies</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">Hantera schema och resurser</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Alla händelser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla händelser</SelectItem>
              <SelectItem value="job">Flyttuppdrag</SelectItem>
              <SelectItem value="meeting">Möten</SelectItem>
              <SelectItem value="training">Utbildning</SelectItem>
              <SelectItem value="vacation">Semester</SelectItem>
              <SelectItem value="other">Övrigt</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportToICal}>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny händelse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Skapa ny händelse</DialogTitle>
                <DialogDescription>
                  Lägg till en ny händelse i kalendern
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Händelsens titel"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Typ</Label>
                  <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Möte</SelectItem>
                      <SelectItem value="training">Utbildning</SelectItem>
                      <SelectItem value="other">Övrigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Start</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">Slut</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Plats</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Händelsens plats"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beskrivning</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Beskrivning av händelsen"
                  />
                </div>
                <Button onClick={createEvent} className="w-full">
                  Skapa händelse
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent && new Date(selectedEvent.start).toLocaleDateString('sv-SE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tid</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedEvent.start).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(selectedEvent.end).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Plats</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.location.address || selectedEvent.location.name || 'Ingen plats angiven'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedEvent.type === 'job' ? 'Flyttuppdrag' : 
                       selectedEvent.type === 'meeting' ? 'Möte' :
                       selectedEvent.type === 'training' ? 'Utbildning' : 
                       selectedEvent.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Badge variant={selectedEvent.status === 'scheduled' ? 'default' : 'secondary'}>
                      {selectedEvent.status === 'scheduled' ? 'Schemalagd' : selectedEvent.status}
                    </Badge>
                  </div>
                  
                  {selectedEvent.priority && (
                    <Badge variant={selectedEvent.priority === 'high' ? 'destructive' : 'secondary'}>
                      {selectedEvent.priority === 'high' ? 'Hög prioritet' : 'Normal prioritet'}
                    </Badge>
                  )}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Beskrivning</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.customer && (
                <div>
                  <p className="text-sm font-medium mb-1">Kund</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{selectedEvent.customer.name}</span>
                    {selectedEvent.customer.phone && <span>{selectedEvent.customer.phone}</span>}
                    {selectedEvent.customer.email && <span>{selectedEvent.customer.email}</span>}
                  </div>
                </div>
              )}
              
              {selectedEvent.assignedStaff && selectedEvent.assignedStaff.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-1">Tilldelad personal</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.assignedStaff.map((staff, index) => (
                      <Badge key={index} variant="secondary">
                        <User className="h-3 w-3 mr-1" />
                        {typeof staff === 'object' ? staff.name : `Personal ${index + 1}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-1">Tilldelad personal</p>
                  <p className="text-sm text-muted-foreground">Ingen personal tilldelad ännu</p>
                </div>
              )}
              
              {selectedEvent.type === 'job' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (selectedEvent.jobId) {
                        window.location.href = `/crm/uppdrag/${selectedEvent.jobId}`
                      } else {
                        toast.info('Inget jobb kopplat till denna händelse')
                      }
                    }}
                  >
                    Visa jobbdetaljer
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      toast.info('Redigeringsfunktion kommer snart')
                    }}
                  >
                    Redigera
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt händelser</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">denna månad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dagens händelser</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayEvents}</div>
            <p className="text-xs text-muted-foreground">aktiva just nu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kommande</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">nästa 7 dagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resurser</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.filter(r => r.isActive).length}</div>
            <p className="text-xs text-muted-foreground">tillgängliga</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setCurrentDate(newDate)
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setCurrentDate(newDate)
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="month">Månad</TabsTrigger>
                <TabsTrigger value="week">Vecka</TabsTrigger>
                <TabsTrigger value="day">Dag</TabsTrigger>
                <TabsTrigger value="resources">Resurser</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'resources' && renderResourcesView()}
        </CardContent>
      </Card>
    </div>
  )
}