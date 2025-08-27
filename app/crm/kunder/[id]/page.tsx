'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Phone, 
  Mail, 
  User, 
  Building2,
  Calendar,
  MapPin,
  Package,
  DollarSign,
  Clock,
  Edit,
  Plus,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Bot
} from 'lucide-react'
import Link from 'next/link'
// Temporarily removed components that don't exist yet
// import CustomerOffertSection from '@/components/crm/CustomerOffertSection'
// import { CustomerIntelligence } from '@/components/ai/CustomerIntelligence'
// import { AutomatedJobCreation } from '@/components/ai/AutomatedJobCreation'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  customerType: 'private' | 'business'
  notes: string
  createdAt: Date
  updatedAt: Date
  bookingCount: number
  totalValue: number
  lastBooking: Date | null
  status: 'active' | 'inactive' | 'blacklisted'
}

interface Booking {
  id: string
  bookingNumber: string
  fromAddress: string
  toAddress: string
  moveDate: Date
  moveTime: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  totalPrice: number
  services: string[]
  notes: string
  createdAt: Date
  livingArea?: number
  floors?: number
  elevator?: boolean
  packingService?: boolean
  cleaningService?: boolean
  distance?: number
  volume?: number
}

interface CustomerStats {
  totalBookings: number
  completedBookings: number
  totalValue: number
  averageBookingValue: number
  lastBookingDate: Date | null
  customerSince: Date
  statusCounts: {
    pending: number
    confirmed: number
    completed: number
    cancelled: number
  }
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('crm-token') || ''
      
      const response = await fetch(`/api/crm/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer details')
      }
      
      const data = await response.json()
      // Handle the response structure
      if (data.customer) {
        setCustomer(data.customer)
      } else {
        throw new Error('Invalid response format')
      }
      
      // Fetch bookings separately
      const bookingsResponse = await fetch(`/api/crm/customers/${customerId}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        // Transform bookings to match expected format
        const transformedBookings = bookingsData.bookings.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          fromAddress: b.start_address,
          toAddress: b.end_address,
          moveDate: new Date(b.move_date),
          moveTime: b.move_time,
          status: mapStatus(b.status),
          priority: 'medium',
          totalPrice: b.total_price,
          services: extractServices(b),
          notes: b.special_instructions || '',
          createdAt: new Date(b.created_at)
        }))
        setBookings(transformedBookings)
        
        // Calculate stats
        const stats = {
          totalBookings: transformedBookings.length,
          completedBookings: transformedBookings.filter((b: any) => b.status === 'completed').length,
          totalValue: transformedBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0),
          averageBookingValue: transformedBookings.length > 0
            ? Math.round(transformedBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0) / transformedBookings.length)
            : 0,
          lastBookingDate: transformedBookings.length > 0 ? transformedBookings[0].moveDate : null,
          customerSince: new Date(data.customer.createdAt),
          statusCounts: {
            pending: transformedBookings.filter((b: any) => b.status === 'scheduled').length,
            confirmed: transformedBookings.filter((b: any) => b.status === 'scheduled').length,
            completed: transformedBookings.filter((b: any) => b.status === 'completed').length,
            cancelled: transformedBookings.filter((b: any) => b.status === 'cancelled').length
          }
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching customer details:', error)
      setError('Failed to load customer details')
    } finally {
      setIsLoading(false)
    }
  }
  
  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'scheduled',
      'confirmed': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    }
    return statusMap[status] || 'scheduled'
  }
  
  const extractServices = (booking: any): string[] => {
    const services: string[] = []
    if (booking.service_type) {
      const serviceLabels: Record<string, string> = {
        'moving': 'Flytt',
        'moving_with_packing': 'Flytt med packning',
        'packing_only': 'Endast packning',
        'cleaning': 'Städning',
        'storage': 'Magasinering'
      }
      services.push(serviceLabels[booking.service_type] || booking.service_type)
    }
    if (booking.additional_services?.length > 0) {
      services.push(...booking.additional_services)
    }
    return services
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'blacklisted': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const handleCallCustomer = () => {
    if (customer) {
      window.location.href = `tel:${customer.phone}`
    }
  }

  const handleEmailCustomer = () => {
    if (customer) {
      window.location.href = `mailto:${customer.email}`
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar kunddetaljer...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error || 'Kunden kunde inte hittas'}</p>
            <div className="mt-4 space-x-2">
              <Button onClick={fetchCustomerDetails}>
                Försök igen
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Gå tillbaka
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-600">Kunddetaljer och bokningshistorik</p>
            </div>
          </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCallCustomer}>
            <Phone className="mr-2 h-4 w-4" />
            Ring
          </Button>
          <Button variant="outline" onClick={handleEmailCustomer}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Link href={`/crm/kunder/${customer.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Redigera
            </Button>
          </Link>
          {/* <AutomatedJobCreation customerId={customer.id} customerData={customer} /> */}
        </div>
      </div>
    </div>

      {/* Customer Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-[#002A5C] text-white text-xl">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Kontaktinformation</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Kundtyp & Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {customer.customerType === 'business' ? (
                      <Building2 className="h-4 w-4 text-gray-400" />
                    ) : (
                      <User className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      {customer.customerType === 'business' ? 'Företagskund' : 'Privatkund'}
                    </span>
                  </div>
                  <Badge className={getStatusColor(customer.status)}>
                    {customer.status === 'active' ? 'Aktiv' : 
                     customer.status === 'inactive' ? 'Inaktiv' : 'Blacklistad'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Bokningsstatistik</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{customer.bookingCount} bokningar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{(customer.totalValue || 0).toLocaleString('sv-SE')} kr</span>
                  </div>
                  {customer.lastBooking && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        Senast: {new Date(customer.lastBooking).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Tidslinje</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Kund sedan: {new Date(customer.createdAt).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Edit className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Uppdaterad: {new Date(customer.updatedAt).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {customer.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-2">Anteckningar</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Customer Intelligence - Coming soon */}
      {/* <CustomerIntelligence customerId={customer.id} /> */}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Totala Bokningar</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avslutade</p>
                  <p className="text-2xl font-bold">{stats.completedBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Totalt Värde</p>
                  <p className="text-2xl font-bold">{(stats?.totalValue || 0).toLocaleString('sv-SE')} kr</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Snittbelopp</p>
                  <p className="text-2xl font-bold">
                    {(stats?.averageBookingValue || 0).toLocaleString('sv-SE')} kr
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Section */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Bokningar ({bookings.length})</TabsTrigger>
          <TabsTrigger value="offers">Offerter</TabsTrigger>
          <TabsTrigger value="stats">Statistik</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Bokningshistorik</CardTitle>
              <CardDescription>
                Alla bokningar för {customer.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Inga bokningar</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Denna kund har inga bokningar ännu
                  </p>
                  <div className="mt-6">
                    <Link href={`/crm/uppdrag/new?customer=${customer.id}`}>
                      <Button className="bg-[#002A5C] hover:bg-[#001a42]">
                        <Plus className="mr-2 h-4 w-4" />
                        Skapa första bokningen
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bokningsnummer</TableHead>
                        <TableHead>Flyttdatum</TableHead>
                        <TableHead>Från - Till</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioritet</TableHead>
                        <TableHead>Tjänster</TableHead>
                        <TableHead className="text-right">Pris</TableHead>
                        <TableHead>Skapad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Link 
                              href={`/crm/uppdrag/${booking.id}`}
                              className="font-medium hover:text-[#002A5C] hover:underline"
                            >
                              {booking.bookingNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {new Date(booking.moveDate).toLocaleDateString('sv-SE')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.moveTime}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="text-sm font-medium truncate">
                                {booking.fromAddress}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                → {booking.toAddress}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBookingStatusColor(booking.status)}>
                              {booking.status === 'completed' ? 'Avslutad' :
                               booking.status === 'in_progress' ? 'Pågående' :
                               booking.status === 'scheduled' ? 'Planerad' : 'Avbruten'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getPriorityColor(booking.priority)}>
                              {booking.priority === 'high' ? 'Hög' :
                               booking.priority === 'medium' ? 'Medium' : 'Låg'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {booking.services.length > 0 ? (
                                <div className="space-y-1">
                                  {booking.services.slice(0, 2).map((service, index) => (
                                    <div key={index} className="truncate">{service}</div>
                                  ))}
                                  {booking.services.length > 2 && (
                                    <div className="text-gray-500">
                                      +{booking.services.length - 2} fler
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Inga tjänster</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">
                              {(booking.totalPrice || 0).toLocaleString('sv-SE')} kr
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(booking.createdAt).toLocaleDateString('sv-SE')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Offerter</CardTitle>
              <CardDescription>
                Offerthantering kommer snart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Kommer snart</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Här kommer du kunna se och hantera offerter för denna kund
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bokningsstatus Fördelning</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Väntande</span>
                      <span className="font-medium">{stats.statusCounts.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bekräftade</span>
                      <span className="font-medium">{stats.statusCounts.confirmed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avslutade</span>
                      <span className="font-medium">{stats.statusCounts.completed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avbrutna</span>
                      <span className="font-medium">{stats.statusCounts.cancelled}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kundrelation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kund sedan</span>
                    <span className="font-medium">
                      {stats && new Date(stats.customerSince).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Senaste bokning</span>
                    <span className="font-medium">
                      {stats?.lastBookingDate 
                        ? new Date(stats.lastBookingDate).toLocaleDateString('sv-SE')
                        : 'Aldrig'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Genomsnittligt bokningsvärde</span>
                    <span className="font-medium">
                      {stats?.averageBookingValue?.toLocaleString('sv-SE') || 0} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitetslogg</CardTitle>
              <CardDescription>
                Senaste aktiviteter för denna kund
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aktivitetslogg kommer snart</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Här kommer du kunna se all aktivitet relaterad till denna kund
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}