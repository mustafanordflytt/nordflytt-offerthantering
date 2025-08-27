'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed'
  priority: 'low' | 'medium' | 'high'
  assignedStaff: string[]
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
}

export default function UppdragPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'moveDate' | 'created' | 'priority' | 'price'>('moveDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/crm/jobs')
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

  // Filter and sort jobs
  const filteredAndSortedJobs = jobs
    .filter(job => {
      const matchesSearch = job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.toAddress.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'moveDate':
          comparison = new Date(a.moveDate).getTime() - new Date(b.moveDate).getTime()
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'price':
          comparison = a.totalPrice - b.totalPrice
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Truck className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planerad'
      case 'confirmed': return 'Bekräftad'
      case 'in_progress': return 'Pågående'
      case 'completed': return 'Slutförd'
      case 'cancelled': return 'Avbruten'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hög'
      case 'medium': return 'Medium'
      case 'low': return 'Låg'
      default: return priority
    }
  }

  // Stats calculations
  const totalJobs = jobs.length
  const todaysJobs = jobs.filter(job => {
    const today = new Date().toDateString()
    return new Date(job.moveDate).toDateString() === today
  }).length
  const inProgressJobs = jobs.filter(job => job.status === 'in_progress').length
  const totalRevenue = jobs.filter(job => job.status === 'completed').reduce((sum, job) => sum + job.totalPrice, 0)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar uppdrag...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error: {error}</p>
            <Button onClick={fetchJobs} className="mt-4">
              Försök igen
            </Button>
          </CardContent>
        </Card>
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
        <div className="flex space-x-2">
          <Link href="/crm/kalender">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Kalendervy
            </Button>
          </Link>
          <Link href="/crm/uppdrag/new">
            <Button className="bg-[#002A5C] hover:bg-[#001a42]">
              <Plus className="mr-2 h-4 w-4" />
              Nytt Uppdrag
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt Uppdrag</p>
                <p className="text-2xl font-bold">{totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Idag</p>
                <p className="text-2xl font-bold">{todaysJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pågående</p>
                <p className="text-2xl font-bold">{inProgressJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                kr
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Intäkter (slutförda)</p>
                <p className="text-2xl font-bold">
                  {totalRevenue.toLocaleString('sv-SE')} kr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sök och Filtrera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök efter kund, bokningsnummer eller adress..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Statusar</SelectItem>
                <SelectItem value="scheduled">Planerad</SelectItem>
                <SelectItem value="confirmed">Bekräftad</SelectItem>
                <SelectItem value="in_progress">Pågående</SelectItem>
                <SelectItem value="completed">Slutförd</SelectItem>
                <SelectItem value="cancelled">Avbruten</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Prioriteter</SelectItem>
                <SelectItem value="high">Hög</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Låg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Uppdragslista ({filteredAndSortedJobs.length} uppdrag)
            </CardTitle>
            <Button onClick={fetchJobs} variant="outline" size="sm">
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bokningsnr</TableHead>
                  <TableHead>Kund</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('moveDate')}
                      className="h-auto p-0 font-semibold"
                    >
                      Flyttdatum
                      {sortBy === 'moveDate' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Rutt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('priority')}
                      className="h-auto p-0 font-semibold"
                    >
                      Prioritet
                      {sortBy === 'priority' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Personal</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('price')}
                      className="h-auto p-0 font-semibold"
                    >
                      Pris
                      {sortBy === 'price' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedJobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Link 
                        href={`/crm/uppdrag/${job.id}`}
                        className="font-medium text-[#002A5C] hover:underline"
                      >
                        {job.bookingNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link 
                          href={`/crm/kunder/${job.customerId}`}
                          className="font-medium hover:text-[#002A5C] hover:underline"
                        >
                          {job.customerName}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{job.customerPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {new Date(job.moveDate).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{job.moveTime}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-gray-600 truncate max-w-32">
                            {job.fromAddress.split(',')[0]}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-gray-600 truncate max-w-32">
                            {job.toAddress.split(',')[0]}
                          </span>
                        </div>
                        {job.distance > 0 && (
                          <div className="text-xs text-gray-500">
                            {job.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusText(job.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(job.priority)}>
                        {getPriorityText(job.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {job.assignedStaff.length > 0 
                            ? `${job.assignedStaff.length} personer`
                            : 'Ej tilldelad'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div className="font-medium">{job.totalPrice.toLocaleString('sv-SE')} kr</div>
                        <div className="text-xs text-gray-500">
                          {job.estimatedHours}h beräknad
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/uppdrag/${job.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visa detaljer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/uppdrag/${job.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Redigera
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/uppdrag/${job.id}/assign`}>
                              <Users className="mr-2 h-4 w-4" />
                              Tilldela personal
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/kunder/${job.customerId}`}>
                              <User className="mr-2 h-4 w-4" />
                              Visa kund
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedJobs.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Inga uppdrag hittades</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Prova att ändra dina sökkriterier'
                  : 'Kom igång genom att skapa ditt första uppdrag'}
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                <div className="mt-6">
                  <Link href="/crm/uppdrag/new">
                    <Button className="bg-[#002A5C] hover:bg-[#001a42]">
                      <Plus className="mr-2 h-4 w-4" />
                      Skapa första uppdraget
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}