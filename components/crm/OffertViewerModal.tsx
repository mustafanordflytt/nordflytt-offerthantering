'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Download, 
  Send, 
  Edit, 
  Copy, 
  Trash2,
  Eye,
  Clock,
  MapPin,
  Calendar,
  Package,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calculator
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

interface OffertViewerModalProps {
  isOpen: boolean
  onClose: () => void
  offertId: string
  onOffertUpdated?: () => void
}

interface OfferData {
  id: string
  reference: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_type: string
  move_date: string
  move_time: string
  from_address: string
  to_address: string
  total_price: number
  services: string[]
  status: string
  created_at: string
  details?: {
    squareMeters?: number
    roomCount?: number
    fromFloor?: string
    toFloor?: string
    fromElevator?: string
    toElevator?: string
    heavyItems?: string[]
    packingService?: string
    cleaningService?: string
    message?: string
  }
}

export default function OffertViewerModal({
  isOpen,
  onClose,
  offertId,
  onOffertUpdated
}: OffertViewerModalProps) {
  const [offerData, setOfferData] = useState<OfferData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isOpen && offertId) {
      fetchOfferData()
    }
  }, [isOpen, offertId])

  const fetchOfferData = async () => {
    try {
      setLoading(true)
      // Fetch from real API endpoint
      const response = await fetch(`/api/offers/${offertId}`)
      if (response.ok) {
        const data = await response.json()
        setOfferData(data)
      } else {
        throw new Error('Failed to fetch offer')
      }
    } catch (error) {
      console.error('Error fetching offer:', error)
      toast.error('Kunde inte ladda offert')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      toast.loading('Genererar PDF...')
      // Call PDF generation endpoint
      const response = await fetch(`/api/offers/${offertId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `offert-${offerData?.reference || offertId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('PDF nedladdad!')
      }
    } catch (error) {
      toast.error('Kunde inte generera PDF')
    }
  }

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/offers/${offertId}/send`, {
        method: 'POST'
      })
      if (response.ok) {
        toast.success('Offert skickad via e-post!')
        if (onOffertUpdated) onOffertUpdated()
      }
    } catch (error) {
      toast.error('Kunde inte skicka offert')
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/offers/${offertId}/duplicate`, {
        method: 'POST'
      })
      if (response.ok) {
        const newOffer = await response.json()
        toast.success('Offert duplicerad!')
        if (onOffertUpdated) onOffertUpdated()
        onClose()
      }
    } catch (error) {
      toast.error('Kunde inte duplicera offert')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill ta bort denna offert?')) return
    
    try {
      const response = await fetch(`/api/offers/${offertId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Offert borttagen')
        if (onOffertUpdated) onOffertUpdated()
        onClose()
      }
    } catch (error) {
      toast.error('Kunde inte ta bort offert')
    }
  }

  const statusConfig = {
    draft: { label: 'Utkast', variant: 'secondary' as const, icon: FileText },
    sent: { label: 'Skickad', variant: 'default' as const, icon: Send },
    accepted: { label: 'Accepterad', variant: 'success' as const, icon: CheckCircle },
    rejected: { label: 'Avvisad', variant: 'destructive' as const, icon: XCircle },
    expired: { label: 'Utgången', variant: 'outline' as const, icon: Clock }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar offert...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!offerData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p>Kunde inte ladda offert</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const StatusIcon = statusConfig[offerData.status as keyof typeof statusConfig]?.icon || AlertCircle

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold">
                Offert #{offerData.reference}
              </DialogTitle>
              <Badge variant={statusConfig[offerData.status as keyof typeof statusConfig]?.variant}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig[offerData.status as keyof typeof statusConfig]?.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePDF}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
              >
                <Send className="mr-2 h-4 w-4" />
                Skicka
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b px-6">
              <TabsList className="h-12 w-full justify-start">
                <TabsTrigger value="overview">Översikt</TabsTrigger>
                <TabsTrigger value="details">Detaljer</TabsTrigger>
                <TabsTrigger value="pricing">Prissättning</TabsTrigger>
                <TabsTrigger value="timeline">Tidslinje</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kundinformation</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{offerData.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{offerData.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{offerData.customer_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(offerData.move_date), 'dd MMMM yyyy', { locale: sv })}
                        {' kl. '}
                        {offerData.move_time}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Move Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Flyttinformation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Från adress:</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{offerData.from_address}</span>
                      </div>
                      {offerData.details?.fromFloor && (
                        <p className="text-sm text-muted-foreground ml-6">
                          Våning {offerData.details.fromFloor}, 
                          {offerData.details.fromElevator === 'yes' ? ' med hiss' : ' utan hiss'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Till adress:</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{offerData.to_address}</span>
                      </div>
                      {offerData.details?.toFloor && (
                        <p className="text-sm text-muted-foreground ml-6">
                          Våning {offerData.details.toFloor}, 
                          {offerData.details.toElevator === 'yes' ? ' med hiss' : ' utan hiss'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tjänster</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {offerData.services.map((service, index) => (
                        <Badge key={index} variant="secondary">
                          <Package className="mr-1 h-3 w-3" />
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Price Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prisöversikt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {new Intl.NumberFormat('sv-SE', {
                        style: 'currency',
                        currency: 'SEK',
                        minimumFractionDigits: 0
                      }).format(offerData.total_price)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Inklusive moms, efter RUT-avdrag
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {/* Detailed information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detaljerad information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {offerData.details?.squareMeters && (
                      <div>
                        <span className="font-medium">Bostadsyta:</span> {offerData.details.squareMeters} m²
                      </div>
                    )}
                    {offerData.details?.roomCount && (
                      <div>
                        <span className="font-medium">Antal rum:</span> {offerData.details.roomCount}
                      </div>
                    )}
                    {offerData.details?.heavyItems && offerData.details.heavyItems.length > 0 && (
                      <div>
                        <span className="font-medium">Tunga föremål:</span>
                        <ul className="list-disc list-inside mt-1">
                          {offerData.details.heavyItems.map((item, index) => (
                            <li key={index} className="text-sm text-muted-foreground">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {offerData.details?.message && (
                      <div>
                        <span className="font-medium">Meddelande från kund:</span>
                        <p className="text-sm text-muted-foreground mt-1">{offerData.details.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                {/* Pricing breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prisuppdelning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Detaljerad prisuppdelning kommer här...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Händelselogg</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Offert skapad</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(offerData.created_at), 'dd MMMM yyyy HH:mm', { locale: sv })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer with actions */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open edit modal
                toast.info('Redigering kommer snart...')
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Redigera
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Ta bort
            </Button>
          </div>
          
          <Button variant="outline" onClick={onClose}>
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}