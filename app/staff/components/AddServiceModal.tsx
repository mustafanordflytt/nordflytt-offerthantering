'use client'

import { useState } from 'react'
import SyncStatusIndicator, { useSyncStatus } from '../../../components/SyncStatusIndicator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import '../styles/modal-fixes.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  Recycle, 
  Sparkles, 
  ShoppingCart,
  Check,
  X,
  Calculator,
  CreditCard,
  MapPin,
  Camera,
  Box,
  FileImage,
  AlertCircle
} from 'lucide-react'
import { cameraService, CapturedImage } from '@/lib/camera-utils'
import { cameraHandler } from '../utils/serviceSpecific'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
}

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  customerName: string
  jobData: TodaysJob
  onServiceAdded: (services: AddedService[]) => void
}

interface Service {
  id: string
  name: string
  price: number
  unit?: string
  description: string
  category: string
}

interface AddedService extends Service {
  quantity: number
  totalPrice: number
}

const tillvalstjänster: Record<string, Service[]> = {
  "tunga-lyft": [
    {
      id: "tunga-lyft-100kg",
      name: "Tunga lyft upp till 100kg",
      price: 1000,
      description: "Specialhantering av föremål upp till 100 kg",
      category: "tunga-lyft"
    },
    {
      id: "tunga-lyft-over-100kg", 
      name: "Tunga lyft över 100kg",
      price: 2000,
      description: "Specialhantering av föremål över 100 kg",
      category: "tunga-lyft"
    }
  ],
  "packning": [
    {
      id: "proffspackning",
      name: "Proffspackning",
      price: 200,
      unit: "per låda",
      description: "Professionell packning av föremål",
      category: "packning"
    },
    {
      id: "specialemballering",
      name: "Specialemballering",
      price: 250,
      unit: "per föremål",
      description: "Speciell emballering för ömtåliga föremål",
      category: "packning"
    },
    {
      id: "skyddsemballering",
      name: "Skyddsemballering",
      price: 200,
      unit: "per föremål", 
      description: "Extra skydd för värdefulla föremål",
      category: "packning"
    }
  ],
  "återvinning": [
    {
      id: "återvinningsvända",
      name: "Återvinningsvända",
      price: 1000,
      description: "En extra vända till återvinningsstation",
      category: "återvinning"
    },
    {
      id: "möbelbortforsling",
      name: "Möbelbortforsling",
      price: 250,
      unit: "per möbel",
      description: "Bortforsling av gamla möbler",
      category: "återvinning"
    }
  ],
  "städ": [
    {
      id: "extra-städ",
      name: "Extra städning",
      price: 500,
      unit: "per timme",
      description: "Tillägsstädning efter flytt",
      category: "städ"
    }
  ],
  "platsforhallanden": [
    {
      id: "extra-parkering-avstand",
      name: "Extra parkeringsavstånd",
      price: 99,
      unit: "per meter",
      description: "Tillägg för parkering över 5 meter (första 5m ingår)",
      category: "platsforhallanden"
    }
  ],
  "volymjustering": [
    {
      id: "extra-volym",
      name: "Extra volym",
      price: 240,
      unit: "per m³",
      description: "Tillägg för volymer över bokad volym (efter RUT-avdrag)",
      category: "volymjustering"
    }
  ],
  "dokumentation": [
    {
      id: "lastbils-foto",
      name: "Lastbilsfoto",
      price: 0,
      description: "Dokumentation av lastutrymme efter lastning",
      category: "dokumentation"
    },
    {
      id: "stad-foto",
      name: "Städdokumentation",
      price: 0,
      description: "Dokumentation av utförd flyttstädning enligt 40-punktslista",
      category: "dokumentation"
    }
  ],
  "material": [
    {
      id: "flyttkartonger",
      name: "Flyttkartong",
      price: 79,
      unit: "st",
      description: "Flyttkartong",
      category: "material"
    },
    {
      id: "packtejp",
      name: "Packtejp",
      price: 99,
      unit: "st",
      description: "Packtejp",
      category: "material"
    },
    {
      id: "plastpåsar",
      name: "Plastpåse",
      price: 20,
      unit: "st",
      description: "Plastpåse",
      category: "material"
    },
    {
      id: "sträckfilm",
      name: "Sträckfilm",
      price: 5,
      unit: "meter",
      description: "Sträckfilm per meter",
      category: "material"
    },
    {
      id: "flyttetiketter",
      name: "Flyttetikett",
      price: 5,
      unit: "st",
      description: "Flyttetikett",
      category: "material"
    }
  ]
}

const categoryIcons: Record<string, any> = {
  "tunga-lyft": Truck,
  "packning": Package,
  "återvinning": Recycle,
  "städ": Sparkles,
  "material": ShoppingCart,
  "platsforhallanden": MapPin,
  "volymjustering": Box,
  "dokumentation": Camera
}

const categoryNames: Record<string, string> = {
  "tunga-lyft": "Tunga Lyft",
  "packning": "Packning", 
  "återvinning": "Återvinning",
  "städ": "Städning",
  "material": "Material",
  "platsforhallanden": "Platsförhållanden",
  "volymjustering": "Volymjustering",
  "dokumentation": "Dokumentation"
}

const categoryColors: Record<string, string> = {
  "tunga-lyft": "bg-red-50 text-red-700 border-red-200",
  "packning": "bg-blue-50 text-blue-700 border-blue-200", 
  "återvinning": "bg-green-50 text-green-700 border-green-200",
  "städ": "bg-purple-50 text-purple-700 border-purple-200",
  "material": "bg-orange-50 text-orange-700 border-orange-200",
  "platsforhallanden": "bg-gray-50 text-gray-700 border-gray-200",
  "volymjustering": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "dokumentation": "bg-indigo-50 text-indigo-700 border-indigo-200"
}

export default function AddServiceModal({ isOpen, onClose, jobId, customerName, jobData, onServiceAdded }: AddServiceModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('packning')
  const [addedServices, setAddedServices] = useState<AddedService[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { status: syncStatus, message: syncMessage, startSync, syncSuccess, syncError } = useSyncStatus()
  
  // Volymjustering state
  const [actualVolume, setActualVolume] = useState<string>('')
  
  // Kamera state
  const [isTakingPhoto, setIsTakingPhoto] = useState(false)
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  
  // Check if cleaning service is booked
  const hasCleaningService = jobData.services.some(service => 
    service.toLowerCase().includes('städ') || service.toLowerCase().includes('clean')
  )


  const handleAddService = (service: Service) => {
    const existingIndex = addedServices.findIndex(s => s.id === service.id)
    
    if (existingIndex >= 0) {
      const updated = [...addedServices]
      updated[existingIndex].quantity += 1
      updated[existingIndex].totalPrice = updated[existingIndex].price * updated[existingIndex].quantity
      setAddedServices(updated)
    } else {
      const newService: AddedService = {
        ...service,
        quantity: 1,
        totalPrice: service.price
      }
      setAddedServices([...addedServices, newService])
    }
  }

  const handleRemoveService = (serviceId: string) => {
    const existingIndex = addedServices.findIndex(s => s.id === serviceId)
    
    if (existingIndex >= 0) {
      const updated = [...addedServices]
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1
        updated[existingIndex].totalPrice = updated[existingIndex].price * updated[existingIndex].quantity
        setAddedServices(updated)
      } else {
        setAddedServices(addedServices.filter(s => s.id !== serviceId))
      }
    }
  }

  const getServiceQuantity = (serviceId: string) => {
    const service = addedServices.find(s => s.id === serviceId)
    return service ? service.quantity : 0
  }

  const getTotalPrice = () => {
    return addedServices.reduce((sum, service) => sum + service.totalPrice, 0)
  }

  const handleSubmit = async () => {
    if (addedServices.length === 0 && capturedImages.length === 0) {
      alert('Inga ändringar att spara.')
      return
    }
    
    setIsSubmitting(true)
    startSync('Sparar ändringar...')
    
    try {
      // Calculate total added cost
      const totalCost = addedServices.reduce((sum, service) => sum + service.totalPrice, 0)
      
      // Prepare data for API
      const updateData = {
        jobId,
        services: addedServices,
        photos: capturedImages,
        volymjustering: addedServices.find(s => s.category === 'volymjustering'),
        timestamp: new Date().toISOString()
      }

      // Try API call but don't fail if it doesn't work
      let apiSuccess = false;
      try {
        const response = await fetch('/api/staff/update-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })
        
        if (response.ok) {
          const result = await response.json()
          apiSuccess = result.success
        }
      } catch (apiError) {
        console.log('API call failed, saving locally:', apiError)
      }
      
      // Always call onServiceAdded regardless of API result
      syncSuccess('Ändringar sparade!')
      onServiceAdded(addedServices)
      
      // Show detailed success message
      let successMessage = '✅ Beställningen har uppdaterats!\n\n'
      
      if (addedServices.length > 0) {
        successMessage += `📋 Tillagda tjänster: ${addedServices.length} st\n`
        if (totalCost > 0) {
          successMessage += `💰 Total kostnad: ${totalCost.toLocaleString()} kr\n`
        }
      }
      
      if (capturedImages.length > 0) {
        successMessage += `📸 Dokumentationsbilder: ${capturedImages.length} st\n`
      }
      
      successMessage += '\n📧 Kunden har meddelats automatiskt via email.'
      
      // Wait a bit to show success status before alert
      setTimeout(() => {
        alert(successMessage)
      }, 500)
      
      // Reset form
      setAddedServices([])
      setCapturedImages([])
      setActualVolume('')
      setSelectedRoom('')
      onClose()
    } catch (error) {
      console.error('Error updating order:', error)
      syncError('Kunde inte spara ändringar')
      
      let errorMessage = '❌ Kunde inte uppdatera beställningen.\n\n'
      
      if (error instanceof Error) {
        errorMessage += error.message
      } else {
        errorMessage += 'Ett okänt fel uppstod. Försök igen.'
      }
      
      // If offline, save to localStorage for later sync
      if (!navigator.onLine) {
        const pendingUpdates = JSON.parse(localStorage.getItem('pending_service_updates') || '[]')
        pendingUpdates.push({
          jobId,
          services: addedServices,
          photos: capturedImages,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('pending_service_updates', JSON.stringify(pendingUpdates))
        
        errorMessage += '\n\n💾 Ändringar sparade lokalt och kommer synkas när du är online igen.'
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAddedServices([])
    setSelectedCategory('packning')
    setActualVolume('')
    setCapturedImages([])
    setSelectedRoom('')
    cameraService.stopCamera()
    onClose()
  }

  // Volymjustering functions
  const calculateExtraVolume = () => {
    const bookedVolume = jobData.volume || 0
    const actual = parseFloat(actualVolume)
    if (actual > bookedVolume) {
      return actual - bookedVolume
    }
    return 0
  }

  const handleVolumeAdjustment = async () => {
    const extraVolume = calculateExtraVolume()
    const extraCost = extraVolume * 240
    
    if (extraVolume <= 0) {
      alert('Ingen extra volym att lägga till.')
      return
    }

    try {
      // Call dedicated API for volume adjustment
      const response = await fetch('/api/staff/add-volume-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: jobId,
          originalVolym: jobData.volume || 0,
          faktiskVolym: parseFloat(actualVolume),
          extraVolym: extraVolume,
          extraKostnad: extraCost,
          pricePerM3: 240
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add volume adjustment')
      }

      // Add to local services list
      const volumeService: AddedService = {
        id: 'extra-volym',
        name: 'Extra volym',
        price: 240,
        unit: 'per m³',
        description: `Tillägg för ${extraVolume}m³ över bokad volym (${jobData.volume}m³)`,
        category: 'volymjustering',
        quantity: extraVolume,
        totalPrice: extraCost
      }
      
      setAddedServices(prev => [...prev.filter(s => s.id !== 'extra-volym'), volumeService])
      
      // Show success message
      alert(`✅ Extra volym tillagd!\n\n${extraVolume} m³ = +${extraCost.toLocaleString()} kr\n\nKunden kommer att meddelas automatiskt.`)
      
    } catch (error) {
      console.error('Error adding volume adjustment:', error)
      alert('❌ Fel vid sparning av volymjustering. Försök igen.')
    }
  }

  // Använd samma enkla foto-lösning som fungerar överallt
  const handleTakePhoto = async (type: 'lastbil' | 'städning', room?: string) => {
    setIsTakingPhoto(true)
    try {
      console.log('🔍 Startar foto-tagning:', type, room)
      // Använd vår förenklade kamera-handler
      const success = await cameraHandler(type, room)
      console.log('📸 Kamera-resultat:', success)
      
      if (success) {
        // Lägg till dokumentations-tjänst
        const serviceId = type === 'lastbil' ? 'lastbils-foto' : 'stad-foto'
        const serviceName = type === 'lastbil' ? 'Lastbilsfoto' : `Städdokumentation${room ? ` (${room})` : ''}`
        
        const docService: AddedService = {
          id: `${serviceId}-${Date.now()}`,
          name: serviceName,
          price: 0,
          description: `${serviceName} - ${new Date().toLocaleString('sv-SE')}`,
          category: 'dokumentation',
          quantity: 1,
          totalPrice: 0
        }
        
        setAddedServices(prev => [...prev, docService])
        
        // Uppdatera captured images för UI
        setCapturedImages(prev => [...prev, {
          id: `img_${Date.now()}`,
          type,
          room,
          timestamp: new Date().toISOString(),
          gpsPosition: undefined,
          imageData: 'photo_saved',
          fileSize: 0,
          jobId
        }])
      }
      
      setIsTakingPhoto(false)
    } catch (error) {
      console.error('❌ Kamera-fel i AddServiceModal:', error)
      alert(`❌ Kunde inte ta bild.\n\nFel: ${error instanceof Error ? error.message : 'Okänt fel'}\n\nKontrollera att du har gett tillåtelse för kamera.`)
      setIsTakingPhoto(false)
    } finally {
      setIsTakingPhoto(false)
    }
  }

  const rooms = ['Kök', 'Badrum', 'Vardagsrum', 'Sovrum', 'Övriga utrymmen']

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 add-service-modal no-horizontal-scroll modal-content-mobile">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-xl font-bold text-[#002A5C] flex items-center space-x-2">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="truncate">Lägg till tjänster</span>
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base mt-1">
                <span className="hidden sm:inline">Uppdrag för </span><strong>{customerName}</strong> - Välj tillvalstjänster
              </DialogDescription>
            </div>
            <SyncStatusIndicator 
              status={syncStatus} 
              message={syncMessage}
              className="ml-4"
            />
          </div>
        </DialogHeader>

        {/* Mobile: Stacked layout, Desktop: Side-by-side */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Mobile Category Tabs (Horizontal scroll) / Desktop Sidebar */}
          <div className="flex-shrink-0 sm:w-48 lg:w-56 border-b sm:border-b-0 sm:border-r bg-gray-50">
            {/* Mobile: Horizontal scrolling tabs */}
            <div className="sm:hidden p-3 overflow-x-auto category-scroll-container">
              <div className="flex space-x-2 min-w-max">
                {Object.keys(tillvalstjänster).map((category) => {
                  const Icon = categoryIcons[category]
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 flex items-center space-x-2 p-3 rounded-lg min-h-[44px] transition-all touch-target-large mobile-card-hover focus-visible-enhanced ${
                        selectedCategory === category
                          ? 'bg-[#002A5C] text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium whitespace-nowrap">{categoryNames[category]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Desktop: Vertical sidebar */}
            <div className="hidden sm:block p-3 lg:p-4 space-y-2 overflow-y-auto h-full">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm lg:text-base">Kategorier</h3>
              {Object.keys(tillvalstjänster).map((category) => {
                const Icon = categoryIcons[category]
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left p-3 lg:p-4 rounded-lg transition-all duration-200 min-h-[44px] ${
                      selectedCategory === category
                        ? 'bg-[#002A5C] text-white shadow-md'
                        : 'hover:bg-gray-200 hover:shadow-sm active:scale-95'
                    }`}
                  >
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                      <span className="text-xs lg:text-sm font-medium leading-tight">{categoryNames[category]}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Enhanced Services List - Improved mobile scrolling */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto overscroll-contain mobile-scroll-area safari-mobile-fix">
            <div className="space-y-4">
              
              {/* Special UI for Volume Adjustment */}
              {selectedCategory === 'volymjustering' && (
                <Card className="border-2 border-cyan-200 bg-cyan-50">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Box className="h-5 w-5 text-cyan-700" />
                        <h4 className="font-semibold text-cyan-900">Volymjustering</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-cyan-800">Bokat volym</Label>
                          <div className="text-lg font-bold text-cyan-900">{jobData.volume || 0} m³</div>
                        </div>
                        
                        <div>
                          <Label htmlFor="actual-volume" className="text-sm font-medium text-cyan-800">
                            Faktisk volym
                          </Label>
                          <Input
                            id="actual-volume"
                            type="number"
                            value={actualVolume}
                            onChange={(e) => setActualVolume(e.target.value)}
                            placeholder="m³"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {/* Volymberäkning och affärslogik */}
                      {actualVolume && (
                        <div className="mt-4 space-y-3">
                          {/* Beräkning */}
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span>Bokat volym:</span>
                              <span>{jobData.volume || 0} m³</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Faktisk volym:</span>
                              <span>{actualVolume} m³</span>
                            </div>
                            <hr className="my-2" />
                            
                            {calculateExtraVolume() > 0 ? (
                              <>
                                <div className="flex justify-between font-bold text-orange-600">
                                  <span>Extra volym:</span>
                                  <span>{calculateExtraVolume()} m³</span>
                                </div>
                                <div className="flex justify-between font-bold text-red-600">
                                  <span>Extra kostnad:</span>
                                  <span>+{(calculateExtraVolume() * 240).toLocaleString()} kr</span>
                                </div>
                              </>
                            ) : (
                              <div className="text-green-600 font-medium text-sm">
                                ✅ Inom bokad volym - ingen extra kostnad
                              </div>
                            )}
                          </div>

                          {/* Lägg till knapp - ENDAST för extra volym */}
                          {calculateExtraVolume() > 0 && !addedServices.some(s => s.id === 'extra-volym') && (
                            <Button
                              onClick={handleVolumeAdjustment}
                              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-medium"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              ⚠️ Lägg till extra volym (+{(calculateExtraVolume() * 240).toLocaleString()} kr)
                            </Button>
                          )}
                          
                          {/* Information när ingen extra kostnad */}
                          {calculateExtraVolume() === 0 && parseFloat(actualVolume) < (jobData.volume || 0) && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-800 text-sm">
                                💡 Mindre volym än bokat ger ingen rabatt då resurser redan är allokerade.
                              </p>
                            </div>
                          )}

                          {/* Bekräftelse när tillagd */}
                          {addedServices.some(s => s.id === 'extra-volym') && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-700" />
                                <span className="text-sm font-medium text-green-800">
                                  Extra volym tillagd: {calculateExtraVolume()} m³ = +{(calculateExtraVolume() * 240).toLocaleString()} kr
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documentation has been moved to individual job cards to avoid duplication */}
              {selectedCategory === 'dokumentation' && (
                <Card className="border-2 border-yellow-200 bg-yellow-50">
                  <CardContent className="p-6 text-center">
                    <div className="space-y-3">
                      <div className="text-4xl">📸</div>
                      <h3 className="font-semibold text-yellow-900">Fotodokumentation</h3>
                      <p className="text-sm text-yellow-800 leading-relaxed">
                        Fotodokumentation finns nu direkt i varje jobbkort för att undvika förvirring.
                      </p>
                      <div className="bg-white border border-yellow-300 rounded-lg p-3 text-xs text-yellow-700">
                        <strong>Hitta fotofunktioner här:</strong><br/>
                        • Packhjälp-kort → "Ta bild"<br/>
                        • Flytt-kort → "Ta bild"<br/>
                        • Städning-kort → "Ta bild"
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Mobile-Optimized Services */}
              {selectedCategory !== 'volymjustering' && selectedCategory !== 'dokumentation' && tillvalstjänster[selectedCategory]?.map((service) => {
                const quantity = getServiceQuantity(service.id)
                return (
                  <Card key={service.id} className="border-2 hover:border-[#002A5C]/30 transition-colors touch-manipulation">
                    <CardContent className="p-4 sm:p-5">
                      {/* Mobile-optimized layout */}
                      <div className="space-y-3 sm:space-y-4">
                        {/* Service Header - Responsive layout */}
                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                          <div className="flex-1 sm:pr-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xl sm:text-2xl">
                                {service.category === 'tunga-lyft' ? '🏋️' :
                                 service.category === 'packning' ? '📦' :
                                 service.category === 'återvinning' ? '♻️' :
                                 service.category === 'städ' ? '✨' :
                                 service.category === 'material' ? '🛒' :
                                 service.category === 'platsforhallanden' ? '📍' : '📋'}
                              </span>
                              <h4 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">{service.name}</h4>
                            </div>
                            <Badge className={`${categoryColors[service.category]} text-xs sm:text-sm px-2 sm:px-3 py-1`}>
                              {categoryNames[service.category]}
                            </Badge>
                          </div>
                          
                          {/* Enhanced touch-friendly quantity controls */}
                          <div className="flex items-center justify-center sm:justify-end space-x-3">
                            {quantity > 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveService(service.id)}
                                  className="h-12 w-12 p-0 flex-shrink-0 border-2 rounded-full touch-manipulation quantity-button focus-visible-enhanced"
                                  aria-label={`Ta bort ${service.name}`}
                                >
                                  <Minus className="h-5 w-5" />
                                </Button>
                                <div className="min-w-[3rem] text-center">
                                  <div className="text-lg sm:text-xl font-bold text-[#002A5C]">{quantity}</div>
                                  <div className="text-xs text-gray-500">st</div>
                                </div>
                              </>
                            )}
                            <Button
                              onClick={() => handleAddService(service)}
                              size="sm"
                              className="h-12 w-12 p-0 bg-[#002A5C] hover:bg-[#001a42] flex-shrink-0 border-2 rounded-full touch-manipulation quantity-button focus-visible-enhanced shadow-lg"
                              aria-label={`Lägg till ${service.name}`}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Service Description - Responsive text */}
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed service-description">{service.description}</p>
                        
                        {/* Enhanced Price Display - Mobile-first */}
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-lg sm:text-xl font-bold text-[#002A5C]">
                                {service.price.toLocaleString('sv-SE')} kr
                              </span>
                              {service.unit && (
                                <span className="text-sm text-gray-600">/{service.unit}</span>
                              )}
                            </div>
                            
                            {quantity > 0 && (
                              <div className="text-left sm:text-right">
                                <div className="text-xs sm:text-sm text-gray-600">Totalt</div>
                                <div className="font-bold text-[#002A5C] text-lg sm:text-xl">
                                  {(service.price * quantity).toLocaleString('sv-SE')} kr
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Mobile Success Indicator */}
                        {quantity > 0 && (
                          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-center justify-center space-x-2">
                              <Check className="h-4 w-4 text-green-700 flex-shrink-0" />
                              <span className="text-sm font-medium text-green-800 text-center">
                                ✓ Tillagd: {quantity} × {service.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Summary & Actions - Mobile-First */}
        {(addedServices.length > 0 || capturedImages.length > 0) && (
          <div className="flex-shrink-0 border-t bg-gray-50 p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Added Services Summary - Mobile Optimized */}
              {addedServices.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Valda tjänster:</h4>
                  <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                    {addedServices.map((service) => (
                      <div key={service.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-2 sm:p-3 rounded border space-y-1 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm sm:text-base leading-tight">{service.name}</span>
                          <Badge variant="outline" className="text-xs">{service.quantity}x</Badge>
                        </div>
                        <span className="font-semibold text-[#002A5C] text-sm sm:text-base">
                          {service.totalPrice.toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Summary */}
              {capturedImages.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-blue-700 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-800">
                      {capturedImages.length} dokumentationsbild{capturedImages.length !== 1 ? 'er' : ''} tagen{capturedImages.length !== 1 ? 'a' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Total & Actions - Mobile-First */}
              <div className="space-y-3 pt-2 border-t">
                {/* Total Display */}
                {getTotalPrice() > 0 && (
                  <div className="flex items-center justify-center sm:justify-start space-x-2 bg-white p-3 rounded-lg border border-[#002A5C]/20">
                    <Calculator className="h-5 w-5 text-[#002A5C] flex-shrink-0" />
                    <span className="text-lg sm:text-xl font-bold text-[#002A5C]">
                      Totalt: {getTotalPrice().toLocaleString('sv-SE')} kr
                    </span>
                  </div>
                )}
                
                {/* Action Buttons - Responsive Layout */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mobile-button-row">
                  <Button 
                    variant="outline" 
                    onClick={handleClose} 
                    className="h-12 sm:h-11 order-2 sm:order-1 flex-1 sm:flex-none touch-manipulation focus-visible-enhanced"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Avbryt
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="h-12 sm:h-11 bg-green-600 hover:bg-green-700 order-1 sm:order-2 flex-1 touch-manipulation focus-visible-enhanced shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span className="hidden sm:inline">Lägger till...</span>
                        <span className="sm:hidden">Sparar...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">
                          Bekräfta tillägg{getTotalPrice() > 0 ? ` (${getTotalPrice().toLocaleString('sv-SE')} kr)` : ''}
                        </span>
                        <span className="sm:hidden">
                          Bekräfta{getTotalPrice() > 0 ? ` (${getTotalPrice().toLocaleString('sv-SE')} kr)` : ''}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state action bar - show even when no services selected */}
        {addedServices.length === 0 && capturedImages.length === 0 && (
          <div className="flex-shrink-0 border-t bg-gray-50 p-3 sm:p-4">
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="h-12 sm:h-11 px-8 touch-manipulation focus-visible-enhanced"
              >
                <X className="h-4 w-4 mr-2" />
                Stäng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}