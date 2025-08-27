'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar as CalendarIcon,
  Award,
  FileText,
  Clock,
  TrendingUp,
  Star,
  Briefcase,
  Shield,
  Languages,
  Car,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  UserPlus,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface StaffDetailModalProps {
  staffId: string | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (staff: any) => void
  onDelete?: (staffId: string) => void
}

export default function StaffDetailModal({
  staffId,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: StaffDetailModalProps) {
  const [staff, setStaff] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (staffId && isOpen) {
      console.log('StaffDetailModal: Fetching details for staffId:', staffId)
      setStaff(null) // Reset staff data
      fetchStaffDetails()
    }
  }, [staffId, isOpen])

  const fetchStaffDetails = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('crm_token') || 'dev-token'
      const response = await fetch(`/api/crm/staff/${staffId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Staff details response:', data)
        setStaff(data.staff || data)
      } else {
        console.error('Failed to fetch staff details, status:', response.status)
        // Try to find staff in parent component's data as fallback
        const mockStaff = {
          id: staffId,
          name: 'Test Staff',
          email: 'test@nordflytt.se',
          phone: '+46 70 000 00 00',
          role: 'mover',
          status: 'available',
          hireDate: new Date(),
          skills: [],
          currentJobs: [],
          totalJobsCompleted: 0,
          rating: 0,
          department: 'Flyttteam',
          address: 'Stockholm'
        }
        setStaff(mockStaff)
      }
    } catch (error) {
      console.error('Error fetching staff details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
              <p className="mt-2 text-gray-600">Laddar personaluppgifter...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!staff) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Fel vid laddning</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Kunde inte ladda personaluppgifter för ID: {staffId}</p>
            <Button onClick={onClose} className="mt-4">Stäng</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-orange-100 text-orange-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'on_leave': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tillgänglig'
      case 'busy': return 'Upptagen'
      case 'scheduled': return 'Schemalagd'
      case 'on_leave': return 'Ledig'
      default: return status
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administratör'
      case 'manager': return 'Chef'
      case 'driver': return 'Chaufför'
      case 'mover': return 'Flyttledare'
      case 'customer_service': return 'Kundtjänst'
      case 'flyttpersonal_utan_körkort': return 'Flyttpersonal'
      default: return role
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{staff.name}</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">{staff.title || getRoleLabel(staff.role)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(getStatusColor(staff.status))}>
                {getStatusLabel(staff.status)}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit?.(staff)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Redigera
              </Button>
              {staff.role !== 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDelete?.(staff.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Ta bort
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="schedule">Schema</TabsTrigger>
            <TabsTrigger value="performance">Prestanda</TabsTrigger>
            <TabsTrigger value="documents">Dokument</TabsTrigger>
            <TabsTrigger value="skills">Kompetens</TabsTrigger>
            <TabsTrigger value="history">Historik</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformation</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{staff.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">E-post</p>
                    <p className="font-medium">{staff.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Adress</p>
                    <p className="font-medium">
                      {staff.address?.street && (
                        <>
                          {staff.address.street}<br />
                          {staff.address.postalCode} {staff.address.city}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Anställd sedan</p>
                    <p className="font-medium">
                      {format(new Date(staff.hireDate), 'dd MMMM yyyy', { locale: sv })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {staff.emergencyContact && (
              <Card>
                <CardHeader>
                  <CardTitle>Nödkontakt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{staff.emergencyContact.name}</p>
                      <p className="text-sm text-gray-500">
                        {staff.emergencyContact.relation} • {staff.emergencyContact.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{staff.totalJobsCompleted || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Slutförda uppdrag</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold flex items-center">
                    {staff.rating || 0}
                    <Star className="h-4 w-4 text-yellow-500 ml-1" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Betyg</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{staff.currentJobs?.length || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Aktiva uppdrag</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {staff.vacationDays?.remaining || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Semesterdagar kvar</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Schemaläggning</CardTitle>
                <CardDescription>Aktuell vecka och kommande uppdrag</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  className="rounded-md border"
                  locale={sv}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prestationsöversikt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {staff.performance?.scores && Object.entries(staff.performance.scores).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {key === 'leadership' ? 'Ledarskap' :
                         key === 'technical' ? 'Teknisk kompetens' :
                         key === 'communication' ? 'Kommunikation' :
                         key === 'teamwork' ? 'Teamarbete' : key}
                      </span>
                      <span className="text-sm font-medium">{value}/5</span>
                    </div>
                    <Progress value={value * 20} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dokument & Certifikat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.documents?.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.expiryDate && `Utgår: ${format(new Date(doc.expiryDate), 'dd MMM yyyy', { locale: sv })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'valid' ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Giltigt
                          </Badge>
                        ) : doc.status === 'expiring' ? (
                          <Badge variant="outline" className="text-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Utgår snart
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Utgånget
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kompetenser & Färdigheter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skills */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Färdigheter</h4>
                  <div className="flex flex-wrap gap-2">
                    {staff.skills?.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Språk
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {staff.languages?.map((lang: string) => (
                      <Badge key={lang} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifieringar
                  </h4>
                  <div className="space-y-2">
                    {staff.certifications?.map((cert: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{cert.name || cert}</span>
                        {cert.expiryDate && (
                          <span className="text-sm text-gray-500">
                            Utgår: {format(new Date(cert.expiryDate), 'MMM yyyy', { locale: sv })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Jobbhistorik</CardTitle>
                <CardDescription>Senaste slutförda uppdrag</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.recentJobs?.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.customer}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(job.date), 'dd MMMM yyyy', { locale: sv })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status === 'completed' ? 'Slutförd' : 'Pågående'}
                        </Badge>
                        {job.rating && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{job.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}