'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Calendar,
  MapPin, 
  Clock,
  User,
  Users,
  Package,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  MoreHorizontal,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  PlayCircle,
  PauseCircle,
  Navigation,
  Camera,
  ClipboardCheck,
  UserPlus,
  Map,
  List,
  Grid3X3,
  Mail,
  MessageSquare,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckSquare
} from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format, isToday, isTomorrow, isPast, addHours, differenceInMinutes } from 'date-fns'
import { sv } from 'date-fns/locale'

// Types
interface Staff {
  id: string
  name: string
  role: 'driver' | 'mover' | 'lead'
  phone: string
  available: boolean
  currentJob?: string
  avatar?: string
}

interface Job {
  id: string
  bookingNumber: string
  customerId: string
  customerName: string
  customerType: 'private' | 'business'
  fromAddress: string
  toAddress: string
  moveDate: string
  moveTime: string
  status: 'scheduled' | 'confirmed' | 'on_route' | 'arrived' | 'loading' | 'in_transit' | 'unloading' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedStaff: Staff[]
  estimatedHours: number
  actualHours: number | null
  totalPrice: number
  services: string[]
  notes: string
  createdAt: string
  updatedAt: string
  requiresPackingService: boolean
  requiresCleaningService: boolean
  hasLargeItems: boolean
  distance: number
  customerEmail: string
  customerPhone: string
  startedAt?: string
  completedAt?: string
  photos?: string[]
  checklistCompleted?: boolean
  customerSignature?: string
  coordinates?: {
    from: { lat: number; lng: number }
    to: { lat: number; lng: number }
  }
}

// Status workflow
const statusWorkflow = {
  scheduled: { next: ['confirmed', 'cancelled'], label: 'Planerad', color: 'bg-gray-100 text-gray-800' },
  confirmed: { next: ['on_route', 'cancelled'], label: 'Bekräftad', color: 'bg-blue-100 text-blue-800' },
  on_route: { next: ['arrived'], label: 'På väg', color: 'bg-yellow-100 text-yellow-800' },
  arrived: { next: ['loading'], label: 'Framme', color: 'bg-orange-100 text-orange-800' },
  loading: { next: ['in_transit'], label: 'Lastar', color: 'bg-purple-100 text-purple-800' },
  in_transit: { next: ['unloading'], label: 'Transport', color: 'bg-indigo-100 text-indigo-800' },
  unloading: { next: ['completed'], label: 'Lastar av', color: 'bg-pink-100 text-pink-800' },
  completed: { next: [], label: 'Slutförd', color: 'bg-green-100 text-green-800' },
  cancelled: { next: [], label: 'Avbokad', color: 'bg-red-100 text-red-800' }
}

// Demo staff
const demoStaff: Staff[] = [
  { id: '1', name: 'Erik Johansson', role: 'lead', phone: '070-111-2222', available: true },
  { id: '2', name: 'Johan Svensson', role: 'driver', phone: '070-333-4444', available: true },
  { id: '3', name: 'Maria Andersson', role: 'mover', phone: '070-555-6666', available: false, currentJob: 'NF-DEMO001' },
  { id: '4', name: 'Lars Nilsson', role: 'mover', phone: '070-777-8888', available: true },
  { id: '5', name: 'Anna Karlsson', role: 'driver', phone: '070-999-0000', available: true },
]

export default function EnhancedUppdragPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [staff, setStaff] = useState<Staff[]>(demoStaff)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map' | 'kanban'>('list')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [selectedJobForStaff, setSelectedJobForStaff] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('crm_token')
      const response = await fetch('/api/crm/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setIsLoading(false)
    }
  }

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    const canTransition = statusWorkflow[job.status as keyof typeof statusWorkflow].next.includes(newStatus)
    if (!canTransition) {
      alert('Ogiltig statusändring')
      return
    }

    // Update locally
    setJobs(jobs.map(j => 
      j.id === jobId 
        ? { 
            ...j, 
            status: newStatus as Job['status'],
            startedAt: newStatus === 'on_route' ? new Date().toISOString() : j.startedAt,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : j.completedAt
          }
        : j
    ))

    // Update server
    try {
      await fetch(`/api/crm/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Failed to update job status:', error)
    }
  }

  // Assign staff to job
  const assignStaff = (jobId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId)
    if (!staffMember || !staffMember.available) return

    setJobs(jobs.map(job => 
      job.id === jobId
        ? { ...job, assignedStaff: [...job.assignedStaff, staffMember] }
        : job
    ))

    setStaff(staff.map(s => 
      s.id === staffId
        ? { ...s, available: false, currentJob: jobId }
        : s
    ))
  }

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayJobs = jobs.filter(job => job.moveDate === today)
    const activeJobs = jobs.filter(job => ['on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(job.status))
    const completedToday = jobs.filter(job => job.status === 'completed' && job.completedAt?.startsWith(today))
    const revenue = completedToday.reduce((sum, job) => sum + job.totalPrice, 0)
    const avgCompletionTime = completedToday.length > 0
      ? completedToday.reduce((sum, job) => {
          if (job.startedAt && job.completedAt) {
            return sum + differenceInMinutes(new Date(job.completedAt), new Date(job.startedAt))
          }
          return sum
        }, 0) / completedToday.length
      : 0

    return {
      todayCount: todayJobs.length,
      activeCount: activeJobs.length,
      completedCount: completedToday.length,
      todayRevenue: revenue,
      avgCompletionTime: Math.round(avgCompletionTime / 60 * 10) / 10, // hours
      staffUtilization: Math.round((staff.filter(s => !s.available).length / staff.length) * 100)
    }
  }, [jobs, staff])

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.toAddress.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter
      
      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = isToday(new Date(job.moveDate))
      } else if (dateFilter === 'tomorrow') {
        matchesDate = isTomorrow(new Date(job.moveDate))
      } else if (dateFilter === 'overdue') {
        matchesDate = isPast(new Date(job.moveDate + 'T' + job.moveTime)) && job.status !== 'completed'
      }
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDate
    })
  }, [jobs, searchTerm, statusFilter, priorityFilter, dateFilter])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-gray-500 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusWorkflow[status as keyof typeof statusWorkflow]
    return config || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  // Job Card Component
  const JobCard = ({ job }: { job: Job }) => {
    const statusConfig = getStatusBadge(job.status)
    const isActive = ['on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(job.status)
    
    return (
      <Card className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        isActive && "ring-2 ring-blue-500"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-lg">{job.bookingNumber}</h4>
              <p className="text-sm text-gray-600">{job.customerName}</p>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{format(new Date(job.moveDate), 'dd MMM yyyy', { locale: sv })} {job.moveTime}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="truncate">{job.fromAddress} → {job.toAddress}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div className="flex gap-1">
                {job.assignedStaff.length > 0 ? (
                  job.assignedStaff.map((staff, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {staff.name.split(' ')[0]}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs text-red-600">
                    Ej tilldelad
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Badge className={getPriorityColor(job.priority)}>
              {job.priority === 'urgent' ? 'Akut' : 
               job.priority === 'high' ? 'Hög' :
               job.priority === 'medium' ? 'Medium' : 'Låg'}
            </Badge>
            
            <div className="flex gap-1">
              {isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    const nextStatus = statusWorkflow[job.status as keyof typeof statusWorkflow].next[0]
                    if (nextStatus) updateJobStatus(job.id, nextStatus)
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedJob(job)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visa detaljer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedJobForStaff(job.id)
                    setShowStaffModal(true)
                  }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tilldela personal
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Navigation className="mr-2 h-4 w-4" />
                    Visa rutt
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Phone className="mr-2 h-4 w-4" />
                    Ring kund
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
          <p className="mt-2 text-gray-600">Laddar uppdrag...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uppdrag</h1>
          <p className="text-gray-600">Hantera dina flyttuppdrag och personalschema</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode('calendar')}>
            <Calendar className="mr-2 h-4 w-4" />
            Kalendervy
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nytt Uppdrag
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dagens uppdrag</p>
                <p className="text-2xl font-bold">{kpis.todayCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pågående</p>
                <p className="text-2xl font-bold">{kpis.activeCount}</p>
              </div>
              <Truck className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Slutförda idag</p>
                <p className="text-2xl font-bold">{kpis.completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Personal</p>
                <p className="text-2xl font-bold">{kpis.staffUtilization}%</p>
                <p className="text-xs text-gray-500">utnyttjande</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Snitt-tid</p>
                <p className="text-2xl font-bold">{kpis.avgCompletionTime}h</p>
                <p className="text-xs text-gray-500">per uppdrag</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intäkt idag</p>
                <p className="text-2xl font-bold">{kpis.todayRevenue.toLocaleString()} kr</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sök och Filtrera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Sök efter kund, bokningsnummer eller adress..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Datum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla datum</SelectItem>
                <SelectItem value="today">Idag</SelectItem>
                <SelectItem value="tomorrow">Imorgon</SelectItem>
                <SelectItem value="overdue">Försenade</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                {Object.entries(statusWorkflow).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla prioriteter</SelectItem>
                <SelectItem value="urgent">Akut</SelectItem>
                <SelectItem value="high">Hög</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Låg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Uppdragslista ({filteredJobs.length} uppdrag)</h2>
        
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            onClick={() => setViewMode('kanban')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            onClick={() => setViewMode('map')}
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Jobs View */}
      {viewMode === 'list' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bokningsnr</TableHead>
                <TableHead>Kund</TableHead>
                <TableHead>Flyttdatum</TableHead>
                <TableHead>Rutt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Personal</TableHead>
                <TableHead>Prioritet</TableHead>
                <TableHead>Pris</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const statusConfig = getStatusBadge(job.status)
                const isActive = ['on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(job.status)
                
                return (
                  <TableRow key={job.id} className={cn(isActive && "bg-blue-50")}>
                    <TableCell className="font-medium">{job.bookingNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.customerName}</p>
                        <p className="text-sm text-gray-500">{job.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(job.moveDate), 'dd MMM yyyy', { locale: sv })}</p>
                        <p className="text-sm text-gray-500">{job.moveTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm truncate">{job.fromAddress}</p>
                        <p className="text-sm text-gray-500 truncate">→ {job.toAddress}</p>
                        <p className="text-xs text-gray-400">{job.distance} km</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {job.assignedStaff.length > 0 ? (
                          job.assignedStaff.map((staff, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {staff.name.split(' ')[0]}
                            </Badge>
                          ))
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => {
                              setSelectedJobForStaff(job.id)
                              setShowStaffModal(true)
                            }}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Tilldela
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(job.priority)}>
                        {job.priority === 'urgent' ? 'Akut' : 
                         job.priority === 'high' ? 'Hög' :
                         job.priority === 'medium' ? 'Medium' : 'Låg'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {job.totalPrice.toLocaleString()} kr
                      <p className="text-xs text-gray-500">{job.estimatedHours}h beräknad</p>
                    </TableCell>
                    <TableCell className="text-right">
                      {isActive ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            const nextStatus = statusWorkflow[job.status as keyof typeof statusWorkflow].next[0]
                            if (nextStatus) updateJobStatus(job.id, nextStatus)
                          }}
                        >
                          {job.status === 'on_route' && 'Framme'}
                          {job.status === 'arrived' && 'Börja lasta'}
                          {job.status === 'loading' && 'Kör'}
                          {job.status === 'in_transit' && 'Framme'}
                          {job.status === 'unloading' && 'Slutför'}
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedJob(job)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visa detaljer
                            </DropdownMenuItem>
                            {job.status === 'scheduled' && (
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'confirmed')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Bekräfta
                              </DropdownMenuItem>
                            )}
                            {job.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'on_route')}>
                                <Truck className="mr-2 h-4 w-4" />
                                Starta uppdrag
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Ring kund
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Skicka SMS
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['scheduled', 'confirmed', 'on_route', 'completed'].map((status) => {
            const statusConfig = statusWorkflow[status as keyof typeof statusWorkflow]
            const statusJobs = filteredJobs.filter(job => {
              if (status === 'on_route') {
                return ['on_route', 'arrived', 'loading', 'in_transit', 'unloading'].includes(job.status)
              }
              return job.status === status
            })
            
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{statusConfig.label}</h3>
                  <Badge variant="secondary">{statusJobs.length}</Badge>
                </div>
                
                <div className="space-y-3">
                  {statusJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  
                  {statusJobs.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Inga uppdrag</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Staff Assignment Modal */}
      <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tilldela Personal</DialogTitle>
            <DialogDescription>
              Välj personal att tilldela till uppdraget
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-3">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg",
                    staffMember.available ? "hover:bg-gray-50 cursor-pointer" : "opacity-50"
                  )}
                  onClick={() => {
                    if (staffMember.available && selectedJobForStaff) {
                      assignStaff(selectedJobForStaff, staffMember.id)
                      setShowStaffModal(false)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{staffMember.name}</p>
                      <p className="text-sm text-gray-500">
                        {staffMember.role === 'lead' ? 'Teamledare' : 
                         staffMember.role === 'driver' ? 'Förare' : 'Bärare'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {staffMember.available ? (
                      <Badge variant="outline" className="text-green-600">
                        Tillgänglig
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        Upptagen
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedJob.bookingNumber} - {selectedJob.customerName}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detaljer</TabsTrigger>
                <TabsTrigger value="timeline">Tidslinje</TabsTrigger>
                <TabsTrigger value="documents">Dokument</TabsTrigger>
                <TabsTrigger value="communication">Kommunikation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className={getStatusBadge(selectedJob.status).color}>
                      {getStatusBadge(selectedJob.status).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prioritet</p>
                    <Badge className={getPriorityColor(selectedJob.priority)}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Flyttdatum</p>
                    <p>{format(new Date(selectedJob.moveDate), 'dd MMMM yyyy', { locale: sv })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tid</p>
                    <p>{selectedJob.moveTime}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Från</p>
                    <p>{selectedJob.fromAddress}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Till</p>
                    <p>{selectedJob.toAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avstånd</p>
                    <p>{selectedJob.distance} km</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Beräknad tid</p>
                    <p>{selectedJob.estimatedHours} timmar</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pris</p>
                    <p className="font-semibold">{selectedJob.totalPrice.toLocaleString()} kr</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tjänster</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {selectedJob.services.map((service, i) => (
                        <Badge key={i} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedJob.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Anteckningar</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedJob.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="timeline">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Bokning skapad</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(selectedJob.createdAt), 'dd MMM yyyy HH:mm', { locale: sv })}
                      </p>
                    </div>
                  </div>
                  
                  {selectedJob.startedAt && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <PlayCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Uppdrag startat</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(selectedJob.startedAt), 'dd MMM yyyy HH:mm', { locale: sv })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedJob.completedAt && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Uppdrag slutfört</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(selectedJob.completedAt), 'dd MMM yyyy HH:mm', { locale: sv })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
                    Ladda upp foton
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Öppna checklista
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Kundsignatur
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="communication">
                <div className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Ring {selectedJob.customerName}
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Skicka SMS
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Skicka email
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}