'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  MapPin, 
  Clock,
  User,
  Users,
  Package,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Edit,
  ArrowLeft,
  Building2,
  Calculator,
  FileText,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

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
  largeItems: string[]
  specialItems: string[]
  startFloor: number
  endFloor: number
  startElevator: string
  endElevator: string
  estimatedVolume: number
  distance: number
  paymentMethod: string
  customerEmail: string
  customerPhone: string
}

export default function UppdragDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string)
    }
  }, [params.id])

  const fetchJob = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/jobs/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }
      const data = await response.json()
      setJob(data.job)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job')
    } finally {
      setIsLoading(false)
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!job) return
    
    try {
      const response = await fetch(`/api/crm/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      await fetchJob(job.id)
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

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

  if (error || !job) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error: {error || 'Uppdrag hittades inte'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Gå tillbaka
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.bookingNumber}</h1>
            <p className="text-gray-600">Uppdrag för {job.customerName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(job.status)}
            <Badge className={getStatusColor(job.status)}>
              {getStatusText(job.status)}
            </Badge>
          </div>
          <Badge className={getPriorityColor(job.priority)}>
            {getPriorityText(job.priority)}
          </Badge>
          <Link href={`/crm/uppdrag/${job.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Redigera
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {job.status === 'scheduled' && (
              <Button 
                onClick={() => handleStatusUpdate('confirmed')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Bekräfta uppdrag
              </Button>
            )}
            {job.status === 'confirmed' && (
              <Button 
                onClick={() => handleStatusUpdate('in_progress')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Truck className="h-4 w-4 mr-2" />
                Starta uppdrag
              </Button>
            )}
            {job.status === 'in_progress' && (
              <Button 
                onClick={() => handleStatusUpdate('completed')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Slutför uppdrag
              </Button>
            )}
            <Link href={`/crm/uppdrag/${job.id}/assign`}>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Tilldela personal
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.open(`tel:${job.customerPhone}`)}>
              <Phone className="h-4 w-4 mr-2" />
              Ring kund
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="details">Detaljer</TabsTrigger>
          <TabsTrigger value="timeline">Tidslinje</TabsTrigger>
          <TabsTrigger value="notes">Anteckningar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Kundinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{job.customerName}</span>
                  {job.customerType === 'business' && (
                    <Building2 className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{job.customerPhone}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => window.open(`tel:${job.customerPhone}`)}
                    >
                      Ring
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{job.customerEmail}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => window.open(`mailto:${job.customerEmail}`)}
                    >
                      E-post
                    </Button>
                  </div>
                </div>
                <Separator />
                <Link href={`/crm/kunder/${job.customerId}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Visa kundprofil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Move Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Flyttinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Från</p>
                      <p className="text-sm text-gray-600">{job.fromAddress}</p>
                      <p className="text-xs text-gray-500">Våning {job.startFloor}, Hiss: {job.startElevator}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-red-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Till</p>
                      <p className="text-sm text-gray-600">{job.toAddress}</p>
                      <p className="text-xs text-gray-500">Våning {job.endFloor}, Hiss: {job.endElevator}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Avstånd</p>
                    <p className="text-gray-600">{job.distance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="font-medium">Volym</p>
                    <p className="text-gray-600">{job.estimatedVolume || 'Ej uppskattat'} m³</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schemalagd tid
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-medium">
                      {new Date(job.moveDate).toLocaleDateString('sv-SE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-medium">{job.moveTime}</span>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Beräknad tid</p>
                    <p className="text-gray-600">{job.estimatedHours} timmar</p>
                  </div>
                  <div>
                    <p className="font-medium">Faktisk tid</p>
                    <p className="text-gray-600">
                      {job.actualHours ? `${job.actualHours} timmar` : 'Ej rapporterad'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Ekonomisk information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#002A5C]">
                    {job.totalPrice.toLocaleString('sv-SE')} kr
                  </p>
                  <p className="text-sm text-gray-600">Totalt pris</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Betalningsmetod:</span>
                    <span className="font-medium capitalize">{job.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pris per timme:</span>
                    <span className="font-medium">
                      {Math.round(job.totalPrice / job.estimatedHours).toLocaleString('sv-SE')} kr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Tjänster</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {job.services.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Packservice</span>
                    <Badge variant={job.requiresPackingService ? "default" : "secondary"}>
                      {job.requiresPackingService ? "Ja" : "Nej"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Städservice</span>
                    <Badge variant={job.requiresCleaningService ? "default" : "secondary"}>
                      {job.requiresCleaningService ? "Ja" : "Nej"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stora föremål</span>
                    <Badge variant={job.hasLargeItems ? "default" : "secondary"}>
                      {job.hasLargeItems ? "Ja" : "Nej"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Tilldelad personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.assignedStaff.length > 0 ? (
                  <div className="space-y-2">
                    {job.assignedStaff.map((staff, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{staff}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ingen personal tilldelad</p>
                    <Link href={`/crm/uppdrag/${job.id}/assign`}>
                      <Button size="sm" className="mt-2">
                        Tilldela personal
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Items */}
            {(job.largeItems.length > 0 || job.specialItems.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Särskilda föremål</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.largeItems.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Stora föremål:</p>
                      <div className="space-y-1">
                        {job.largeItems.map((item, index) => (
                          <Badge key={index} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.specialItems.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Specialföremål:</p>
                      <div className="space-y-1">
                        {job.specialItems.map((item, index) => (
                          <Badge key={index} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Uppdragstidslinje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Uppdrag skapat</p>
                    <p className="text-sm text-gray-600">
                      {new Date(job.createdAt).toLocaleString('sv-SE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Senast uppdaterad</p>
                    <p className="text-sm text-gray-600">
                      {new Date(job.updatedAt).toLocaleString('sv-SE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Schemalagd flyttning</p>
                    <p className="text-sm text-gray-600">
                      {new Date(job.moveDate + 'T' + job.moveTime).toLocaleString('sv-SE')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Anteckningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.notes ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Inga anteckningar tillagda</p>
                  <Link href={`/crm/uppdrag/${job.id}/edit`}>
                    <Button size="sm" className="mt-2">
                      Lägg till anteckning
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}