'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock,
  Camera,
  CheckCircle,
  Send,
  Download,
  Package,
  AlertTriangle,
  Plus,
  X,
  Eye,
  Mail
} from 'lucide-react'
import { 
  compileOrderConfirmation, 
  sendOrderConfirmation,
  generateOrderConfirmationPDF,
  type OrderConfirmationData 
} from '../../lib/order-confirmation'

interface OrderConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  jobData: any
  onComplete?: () => void
}

export default function OrderConfirmationModal({ 
  isOpen, 
  onClose, 
  jobData,
  onComplete 
}: OrderConfirmationModalProps) {
  const [confirmationData, setConfirmationData] = useState<OrderConfirmationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && jobData) {
      loadConfirmationData()
    }
  }, [isOpen, jobData])

  const loadConfirmationData = async () => {
    setIsLoading(true)
    try {
      const data = await compileOrderConfirmation(jobData.id, jobData)
      setConfirmationData(data)
      setRecipientEmail(jobData.customerEmail || '')
    } catch (error) {
      console.error('Error loading confirmation data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendConfirmation = async () => {
    if (!confirmationData) return
    
    setIsSending(true)
    try {
      const result = await sendOrderConfirmation(confirmationData, recipientEmail)
      if (result.success) {
        alert(result.message)
        onComplete?.()
        onClose()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Fel vid sändning av orderbekräftelse')
    } finally {
      setIsSending(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'before': '📸 Före',
      'during': '🔧 Under arbete',
      'after': '✅ Efter',
      'packing': '📦 Packning',
      'special': '⭐ Speciellt',
      'damage': '⚠️ Skada',
      'additional': '➕ Tillägg'
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'before': 'bg-blue-100 text-blue-800',
      'during': 'bg-yellow-100 text-yellow-800',
      'after': 'bg-green-100 text-green-800',
      'packing': 'bg-purple-100 text-purple-800',
      'damage': 'bg-red-100 text-red-800',
      'additional': 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (!jobData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Lägg till i Flyttpärm - {jobData.bookingNumber}
            </DialogTitle>
            <DialogDescription>
              Sammanställning av utfört arbete för {jobData.customerName} läggs till i kundens befintliga flyttpärm
            </DialogDescription>
          </DialogHeader>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto mb-4"></div>
              <p>Sammanställer orderbekräftelse...</p>
            </div>
          </div>
        ) : confirmationData ? (
          <>
            <div className="flex-1 overflow-hidden">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                  <TabsTrigger value="overview">Översikt</TabsTrigger>
                  <TabsTrigger value="time">Arbetstid</TabsTrigger>
                  <TabsTrigger value="photos">
                    Foton ({confirmationData.photos.length})
                  </TabsTrigger>
                  <TabsTrigger value="additional">Tillägg</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-6">
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="h-5 w-5" />
                          <span>Utförda tjänster</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {confirmationData.completedServices.map((service, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{service.serviceType}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(service.startTime).toLocaleTimeString('sv-SE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} - {service.endTime ? new Date(service.endTime).toLocaleTimeString('sv-SE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : 'Pågår'}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {Math.floor(service.duration / 60)}h {service.duration % 60}m
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Camera className="h-5 w-5" />
                          <span>Fotodokumentation</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(
                            confirmationData.photos.reduce((acc, photo) => {
                              acc[photo.category] = (acc[photo.category] || 0) + 1
                              return acc
                            }, {} as Record<string, number>)
                          ).map(([category, count]) => (
                            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm">{getCategoryLabel(category)}</span>
                              <Badge className={getCategoryColor(category)}>
                                {count} {count === 1 ? 'bild' : 'bilder'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="time" className="mt-0 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Total arbetstid</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-6">
                          <div className="text-4xl font-bold text-[#002A5C]">
                            {confirmationData.totalWorkTime.totalHours}h {confirmationData.totalWorkTime.totalMinutes}m
                          </div>
                          {confirmationData.totalWorkTime.overtimeMinutes > 0 && (
                            <p className="text-sm text-orange-600 mt-2">
                              Inkl. {Math.floor(confirmationData.totalWorkTime.overtimeMinutes / 60)}h {confirmationData.totalWorkTime.overtimeMinutes % 60}m övertid
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-6 space-y-3">
                          <h4 className="font-medium text-gray-700">Per tjänst:</h4>
                          {Object.entries(confirmationData.totalWorkTime.perService).map(([service, time]) => (
                            <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span>{service}</span>
                              <span className="font-medium">{time.hours}h {time.minutes}m</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="photos" className="mt-0 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {confirmationData.photos.map((photo, idx) => (
                        <div 
                          key={photo.id} 
                          className="relative cursor-pointer group"
                          onClick={() => setSelectedPhotoIndex(idx)}
                        >
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={photo.url} 
                              alt={photo.description}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className={getCategoryColor(photo.category)}>
                              {getCategoryLabel(photo.category).split(' ')[0]}
                            </Badge>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3">
                            <p className="text-sm font-medium truncate">{photo.description}</p>
                            <p className="text-xs opacity-90">
                              {new Date(photo.timestamp).toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="additional" className="mt-0 space-y-4">
                    {confirmationData.additionalServices.length > 0 ? (
                      confirmationData.additionalServices.map((service, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium flex items-center space-x-2">
                                  {service.type === 'parking' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                                  {service.type === 'stairs' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                                  {service.type === 'materials' && <Package className="h-4 w-4 text-blue-600" />}
                                  <span>{service.description}</span>
                                </h4>
                                {service.quantity && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Antal/mängd: {service.quantity}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{service.cost} kr</p>
                                {service.photo && (
                                  <Badge variant="secondary" className="mt-1">
                                    <Camera className="h-3 w-3 mr-1" />
                                    Foto
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Plus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">Inga tilläggstjänster registrerade</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="flex-shrink-0 p-6 border-t bg-gray-50">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">Läggs till i kundens flyttpärm</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        All information från detta arbetspass kommer att läggas till kundens befintliga orderbekräftelse i flyttpärmen.
                        Kunden får automatiskt tillgång till uppdaterad information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (confirmationData) {
                        const pdfUrl = await generateOrderConfirmationPDF(confirmationData)
                        // För demo - öppna PDF i ny flik
                        window.open(pdfUrl, '_blank')
                      }
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner PDF
                  </Button>
                  
                  <Button
                    onClick={handleSendConfirmation}
                    disabled={isSending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Lägg till i flyttpärm
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-600">Ingen data tillgänglig</p>
          </div>
        )}
      </DialogContent>

      {/* Photo Viewer Modal */}
      {selectedPhotoIndex !== null && confirmationData && (
        <Dialog open={true} onOpenChange={() => setSelectedPhotoIndex(null)}>
          <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
            <div className="relative h-full">
              <div className="relative bg-black flex items-center justify-center" style={{minHeight: '70vh'}}>
                <img 
                  src={confirmationData.photos[selectedPhotoIndex].url}
                  alt={confirmationData.photos[selectedPhotoIndex].description}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation */}
                {confirmationData.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIndex(
                        selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : confirmationData.photos.length - 1
                      )}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedPhotoIndex(
                        selectedPhotoIndex < confirmationData.photos.length - 1 ? selectedPhotoIndex + 1 : 0
                      )}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {confirmationData.photos[selectedPhotoIndex].description}
                  </h3>
                  <Badge className={getCategoryColor(confirmationData.photos[selectedPhotoIndex].category)}>
                    {getCategoryLabel(confirmationData.photos[selectedPhotoIndex].category)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Tidpunkt:</span>
                    <div>{new Date(confirmationData.photos[selectedPhotoIndex].timestamp).toLocaleString('sv-SE')}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Tjänst:</span>
                    <div>{confirmationData.photos[selectedPhotoIndex].serviceType}</div>
                  </div>
                  {confirmationData.photos[selectedPhotoIndex].location && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Plats:</span>
                      <div>{confirmationData.photos[selectedPhotoIndex].location}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}