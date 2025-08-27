'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Navigation as NavigationIcon,
  Box,
  Truck,
  AlertTriangle,
  CheckCircle,
  Edit,
  Calculator,
  Plus,
  X,
  PlayCircle,
  PauseCircle,
  Camera,
  Image
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getServiceConfig, cameraHandler } from '../../app/staff/utils/serviceSpecific'
import { startTimeTracking, stopTimeTracking, hasActiveTimeTracking, getTotalWorkTime } from '../../lib/time-tracking'
import CleaningChecklist from './CleaningChecklist'
import { photoStorage, StorageManager } from '../../lib/storage-utils'

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

interface JobDetailModalProps {
  isOpen: boolean
  onClose: () => void
  job: TodaysJob | null
  selectedService?: string | null
  onAddService?: (jobId: string) => void
}

export default function JobDetailModal({ isOpen, onClose, job, selectedService, onAddService }: JobDetailModalProps) {
  const [actualParkingDistance, setActualParkingDistance] = useState<number | null>(null)
  const [isEditingParking, setIsEditingParking] = useState(false)
  const [tempParkingDistance, setTempParkingDistance] = useState('')
  const [isActiveTracking, setIsActiveTracking] = useState(false)
  const [totalTime, setTotalTime] = useState({ hours: 0, minutes: 0 })
  const [savedPhotos, setSavedPhotos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCleaningChecklist, setShowCleaningChecklist] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  // Check tracking status and load photos on modal open
  useEffect(() => {
    if (isOpen && job) {
      // Check if time tracking is active
      const tracking = hasActiveTimeTracking(job.id)
      setIsActiveTracking(tracking)
      
      // Get total work time
      const time = getTotalWorkTime(job.id)
      setTotalTime(time)
      
      // Load photos for this job using enhanced storage
      console.log('Loading photos for modal, service:', selectedService)
      const jobPhotos = photoStorage.getPhotos(selectedService || undefined)
      console.log('Filtered photos:', jobPhotos)
      console.log('Storage report:', StorageManager.getStorageReport())
      
      setSavedPhotos(jobPhotos)
    }
  }, [isOpen, job, selectedService])

  if (!job) return null

  // Get config for selected service
  const selectedServiceConfig = selectedService ? getServiceConfig(selectedService, job) : null
  
  // Mock GPS location for job address (stable for SSR)
  const jobLocation = {
    latitude: 59.3293 + (parseInt(job.id) % 100 - 50) * 0.0001,
    longitude: 18.0686 + (parseInt(job.id) % 100 - 50) * 0.0001,
    address: job.toAddress
  }

  // Calculate estimated materials based on volume
  const calculateMaterials = (volume: number) => {
    // Base calculations: 
    // ~1.5 boxes per m³
    // ~5m bubble wrap per m³
    // ~1 roll of tape per 20 boxes
    const boxes = Math.ceil(volume * 1.5)
    const bubbleWrap = Math.ceil(volume * 5)
    const tapeRolls = Math.ceil(boxes / 20)
    const plasticBags = Math.ceil(volume * 0.5)
    
    return {
      boxes,
      bubbleWrap,
      tapeRolls,
      plasticBags
    }
  }
  
  const estimatedMaterials = calculateMaterials(job.volume || 20)

  const calculateParkingCost = (distance: number) => {
    const extraMeters = Math.max(0, distance - 5)
    return extraMeters * 99
  }

  const currentParkingDistance = actualParkingDistance || job.locationInfo.parkingDistance
  const parkingCost = calculateParkingCost(currentParkingDistance)
  const hasExtraMeters = currentParkingDistance > 5

  const handleSaveParkingDistance = () => {
    const newDistance = parseInt(tempParkingDistance)
    if (newDistance && newDistance > 0) {
      setActualParkingDistance(newDistance)
      if (newDistance > job.locationInfo.parkingDistance && onAddService) {
        // Automatically add parking service if distance increased
        onAddService(job.id)
      }
    }
    setIsEditingParking(false)
    setTempParkingDistance('')
  }

  const handleStartTracking = async () => {
    setIsLoading(true)
    const result = await startTimeTracking(job.id, selectedService || '', jobLocation)
    
    if (result.success) {
      setIsActiveTracking(true)
      alert(result.message)
    } else {
      alert(result.message)
    }
    setIsLoading(false)
  }

  const handleStopTracking = async () => {
    setIsLoading(true)
    const result = await stopTimeTracking(job.id, jobLocation)
    
    if (result.success) {
      setIsActiveTracking(false)
      const time = getTotalWorkTime(job.id)
      setTotalTime(time)
      alert(result.message)
    } else {
      alert(result.message)
    }
    setIsLoading(false)
  }

  const handleTakePhoto = async () => {
    console.log('Taking photo for service:', selectedService)
    
    // Try camera first
    const success = await cameraHandler(selectedService || '', 'dokumentation')
    console.log('Camera handler result:', success)
    
    if (success) {
      // Reload photos using enhanced storage
      const jobPhotos = photoStorage.getPhotos(selectedService || undefined)
      console.log('Photos after camera success:', jobPhotos)
      
      setSavedPhotos(jobPhotos)
      
      // Show success feedback
      alert(`✅ Bild sparad!\n\nTjänst: ${selectedService}\nAntal bilder nu: ${jobPhotos.length}`)
    } else {
      console.log('Camera handler failed, creating mock photo for demo')
      
      // Fallback: Create mock photo for demo/testing
      const now = new Date()
      const mockPhoto = {
        id: now.getTime(),
        serviceType: selectedService,
        room: 'dokumentation',
        timestamp: now.toLocaleString('sv-SE'),
        gpsText: 'Mock GPS: Stockholm centrum',
        gpsPosition: { latitude: 59.3293, longitude: 18.0686 },
        fileName: `mock_photo_${now.getTime()}.jpg`,
        fileSize: 25000,
        dataUrl: `data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#e8f4f8" stroke="#3b82f6" stroke-width="2"/>
            <circle cx="200" cy="120" r="30" fill="#3b82f6" opacity="0.1"/>
            <text x="200" y="125" font-family="Arial" font-size="24" text-anchor="middle" fill="#3b82f6">📸</text>
            <text x="200" y="155" font-family="Arial" font-size="14" text-anchor="middle" fill="#1e40af" font-weight="bold">
              ${selectedService} - Foto
            </text>
            <text x="200" y="180" font-family="Arial" font-size="11" text-anchor="middle" fill="#64748b">
              ${now.toLocaleString('sv-SE')}
            </text>
            <text x="200" y="200" font-family="Arial" font-size="10" text-anchor="middle" fill="#64748b">
              Dokumentation sparad
            </text>
          </svg>
        `)}`,
        width: 400,
        height: 300,
        quality: 0.8
      }
      
      // Save using enhanced storage manager
      const saveSuccess = photoStorage.savePhoto(mockPhoto)
      
      if (saveSuccess) {
        // Update state
        const jobPhotos = photoStorage.getPhotos(selectedService || undefined)
        setSavedPhotos(jobPhotos)
        
        alert(`✅ Demo-bild skapad!\n\nTjänst: ${selectedService}\nAntal bilder nu: ${jobPhotos.length}`)
      } else {
        alert(`⚠️ Kunde inte spara bild - lagringsutrymme fullt.\n\nProva att rensa gamla bilder.`)
      }
    }
  }

  const statusColor = {
    upcoming: 'text-blue-600 bg-blue-50',
    in_progress: 'text-green-600 bg-green-50',
    completed: 'text-gray-600 bg-gray-50'
  }

  const priorityColor = {
    low: 'text-gray-600 bg-gray-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedServiceConfig && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedServiceConfig.emoji}</span>
                    <div>
                      <div className={`text-lg font-bold ${selectedServiceConfig.color}`}>
                        {selectedServiceConfig.name.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedServiceConfig.timeRange}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xl">{job.customerName}</span>
                  {selectedService && (
                    <div className="text-sm text-gray-600 mt-1">
                      Du arbetar med {selectedService}
                    </div>
                  )}
                </div>
              </div>
              <Badge className={statusColor[job.status]}>
                {job.status === 'upcoming' ? 'Kommande' : 
                 job.status === 'in_progress' ? 'Pågående' : 'Slutfört'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Uppdrag #{job.bookingNumber} • {job.moveTime} - {job.endTime}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Action Buttons - Start/Stop Job */}
        <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
          <div className="space-y-3">
            <div className="flex-1">
              {!isActiveTracking ? (
                <Button 
                  onClick={handleStartTracking}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Starta {selectedService || 'uppdrag'}
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">Uppdrag pågår</span>
                    </div>
                    <span className="text-sm text-green-600">
                      {totalTime.hours > 0 && `${totalTime.hours}h `}{totalTime.minutes}m
                    </span>
                  </div>
                  <Button 
                    onClick={handleStopTracking}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <PauseCircle className="h-5 w-5 mr-2" />
                        Avsluta {selectedService || 'uppdrag'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Quick Actions Row */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Show mock overtime modal
                  const now = new Date()
                  const mockOvertimeInfo = {
                    jobId: job.id,
                    overtimeMinutes: 30,
                    scheduledEndTime: job.endTime,
                    actualEndTime: now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
                  }
                  // In real implementation, this would trigger the overtime modal via parent component
                  alert(`Övertidsrapportering för jobb ${job.bookingNumber}\nÖvertid: 30 minuter\nFunktionen kommer snart!`)
                }}
                className="flex-1 h-10"
              >
                <Clock className="h-4 w-4 mr-2" />
                Rapportera övertid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Show mock hours modal  
                  alert('Mina Timmar - visas i huvudmenyn!\nKlicka på klock-ikonen i headern.')
                }}
                className="flex-1 h-10"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Mina timmar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 modal-scroll-container p-6 pt-4 space-y-4">
          {/* Customer Notes */}
          {job.customerNotes && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-800">📝 Kundnotering</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-blue-700">{job.customerNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Priority Alert */}
          {job.priority === 'high' && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Hög prioritet</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Addresses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Adresser</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <Label className="text-xs text-gray-600">Från</Label>
                <p className="text-sm font-medium">{job.fromAddress}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Till</Label>
                <p className="text-sm font-medium">{job.toAddress}</p>
              </div>
              <div className="text-xs text-gray-500">
                Avstånd: {job.distance} km
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">🏢 Platsinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Portkod</Label>
                  <p className="text-sm font-medium">{job.locationInfo.doorCode || 'Ingen'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Våning</Label>
                  <p className="text-sm font-medium">{job.locationInfo.floor}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Hiss</Label>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">
                    {job.locationInfo.elevator ? 'Ja' : 'Nej'}
                  </p>
                  {job.locationInfo.elevatorStatus !== 'Fungerar' && (
                    <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                      {job.locationInfo.elevatorStatus}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Parking Distance with Edit Capability */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600">🅿️ Parkering</Label>
                  {!isEditingParking && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditingParking(true)
                        setTempParkingDistance(currentParkingDistance.toString())
                      }}
                      className="h-11 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {isEditingParking ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="number"
                      value={tempParkingDistance}
                      onChange={(e) => setTempParkingDistance(e.target.value)}
                      className="h-8 w-20"
                      placeholder="meter"
                    />
                    <Button size="sm" onClick={handleSaveParkingDistance} className="h-11">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingParking(false)}
                      className="h-11"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <p className="text-sm font-medium">
                      {currentParkingDistance}m
                      {actualParkingDistance && actualParkingDistance !== job.locationInfo.parkingDistance && (
                        <span className="text-xs text-blue-600 ml-1">(uppdaterat)</span>
                      )}
                    </p>
                    {hasExtraMeters && (
                      <div className="text-xs text-orange-600 mt-1 bg-orange-50 p-2 rounded">
                        <Calculator className="h-3 w-3 inline mr-1" />
                        {currentParkingDistance - 5}m över gräns → {parkingCost.toLocaleString()} kr tillägg
                      </div>
                    )}
                  </div>
                )}
              </div>

              {job.locationInfo.accessNotes && (
                <div>
                  <Label className="text-xs text-gray-600">Åtkomstnoteringar</Label>
                  <p className="text-sm">{job.locationInfo.accessNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume and Boxes */}
          {(job.volume || job.boxCount) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Box className="h-4 w-4" />
                  <span>Volym & Material</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  {job.volume && (
                    <div>
                      <Label className="text-xs text-gray-600">Volym</Label>
                      <p className="text-sm font-medium">{job.volume} m³</p>
                    </div>
                  )}
                  {job.boxCount && (
                    <div>
                      <Label className="text-xs text-gray-600">Flyttkartonger</Label>
                      <p className="text-sm font-medium">{job.boxCount} st</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Service Details */}
          {selectedService && selectedServiceConfig && (
            <Card className={`${selectedServiceConfig.bgColor} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${selectedServiceConfig.color} flex items-center space-x-2`}>
                  <span className="text-xl">{selectedServiceConfig.emoji}</span>
                  <span>Detaljer för {selectedServiceConfig.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Special requirements for this service */}
                {job.specialRequirements.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-sm font-medium text-gray-700">Specialkrav:</h6>
                    <div className="flex flex-wrap gap-1">
                      {job.specialRequirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-yellow-200 text-yellow-700">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service-specific checklist */}
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    Checklista för {selectedServiceConfig.name}
                  </h5>
                  <div className="space-y-3">
                    {selectedServiceConfig.checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          id={`check-${selectedService}-${idx}`}
                        />
                        <label 
                          htmlFor={`check-${selectedService}-${idx}`} 
                          className="text-sm text-gray-700 flex-1 cursor-pointer"
                        >
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service-specific details based on selected service */}
                <div className="bg-white p-4 rounded-lg border">
                  <h6 className="font-medium text-gray-800 mb-3">Specifikt för {selectedServiceConfig.name}</h6>
                  
                  {selectedService === 'Packhjälp' && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <span>📦</span>
                        <span>Beräknat material (baserat på {job.volume || 20}m³):</span>
                      </div>
                      <div className="ml-7 space-y-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span>Flyttkartonger:</span>
                          <span className="font-medium">{estimatedMaterials.boxes} st</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Bubbelplast:</span>
                          <span className="font-medium">{estimatedMaterials.bubbleWrap}m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Packtejp:</span>
                          <span className="font-medium">{estimatedMaterials.tapeRolls} rullar</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Plastpåsar:</span>
                          <span className="font-medium">{estimatedMaterials.plasticBags} st</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>👥</span>
                        <span>Antal personer: {job.teamMembers.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>⏱️</span>
                        <span>Tidsåtgång: {job.estimatedHours}h</span>
                      </div>
                    </div>
                  )}

                  {selectedService === 'Flytt' && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <span>🚚</span>
                        <span>Bohagsvolym: {job.volume || 85} m³</span>
                      </div>
                      {(!job.locationInfo.elevator && job.locationInfo.floor > 1) && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <span>⛔</span>
                          <span>Våning {job.locationInfo.floor}, ingen hiss</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span>📷</span>
                        <span>Krav på förefoton</span>
                      </div>
                      {job.specialRequirements.some(req => req.toLowerCase().includes('piano') || req.toLowerCase().includes('tung')) && (
                        <div className="flex items-center space-x-2 text-orange-600">
                          <span>🧠</span>
                          <span>Notering om piano eller tunga möbler</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedService === 'Flyttstädning' && (
                    <div className="space-y-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <span>🧽</span>
                          <span>Städutrustning: Dammsugare, rengöringsmedel, trasor</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>🕓</span>
                          <span>Tidsfönster: {selectedServiceConfig.timeRange}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>🧼</span>
                          <span>Kontroll: 40-punktslista att gå igenom med kund</span>
                        </div>
                      </div>
                      
                      {/* 40-punkts checklista knapp */}
                      <div className="pt-2">
                        <Button
                          onClick={() => setShowCleaningChecklist(true)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Öppna 40-punkts checklista
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-3 rounded text-sm ${selectedServiceConfig.color} bg-white/70 border`}>
                  💡 {selectedServiceConfig.systemRecommendation}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Documentation Section */}
          {selectedService && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>Fotodokumentation</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {savedPhotos.length} {savedPhotos.length === 1 ? 'bild' : 'bilder'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Take Photo Button */}
                <Button 
                  onClick={handleTakePhoto}
                  variant="outline"
                  className="w-full h-12 bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Camera className="h-5 w-5 mr-2 text-blue-600" />
                  Ta bild för {selectedService}
                </Button>

                {/* Enhanced Photo Gallery with Preview */}
                {savedPhotos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h6 className="text-sm font-medium text-gray-700">Sparade bilder:</h6>
                      <Badge variant="secondary" className="text-xs">
                        {savedPhotos.length} {savedPhotos.length === 1 ? 'bild' : 'bilder'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {savedPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border hover:border-blue-400 transition-colors">
                          <img 
                            src={photo.dataUrl} 
                            alt={`${photo.serviceType} - ${photo.timestamp}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedPhotoIndex(idx)}
                          />
                          <div className="absolute top-2 right-2">
                            <div className="bg-green-500 w-3 h-3 rounded-full border border-white"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2">
                            <div className="font-medium truncate">{photo.room || 'Allmänt'}</div>
                            <div className="opacity-90">
                              {new Date(photo.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Status Message */}
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span>Bilder sparas automatiskt och skickas till kundbekräftelse</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Services Available */}
          {job.services.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Övriga tjänster i detta uppdrag</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {job.services.filter(service => service !== selectedService).map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Equipment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Utrustning</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {job.equipment.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Team</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {job.teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#002A5C] text-white text-xs">
                        {member.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{member}</span>
                    {index === 0 && <Badge variant="outline" className="text-xs">Chaufför</Badge>}
                    {index === 1 && <Badge variant="outline" className="text-xs">Bärare</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button 
              variant="outline"
              onClick={() => window.open(`tel:${job.customerPhone}`)}
              className="h-12"
            >
              <Phone className="h-4 w-4 mr-2" />
              Ring kund
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.toAddress)}`
                window.open(mapUrl, '_blank')
              }}
              className="h-12"
            >
              <NavigationIcon className="h-4 w-4 mr-2" />
              Navigation
            </Button>
          </div>

          {onAddService && (
            <div className="pt-4 pb-2">
              <Button 
                onClick={() => onAddService(job.id)}
                className="w-full h-12 bg-[#002A5C] hover:bg-[#001a42]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till tjänst
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Cleaning Checklist Modal */}
      {job && (
        <CleaningChecklist
          isOpen={showCleaningChecklist}
          onClose={() => setShowCleaningChecklist(false)}
          jobId={job.id}
          customerName={job.customerName}
          address={job.toAddress}
        />
      )}

      {/* Photo Viewer Modal */}
      {selectedPhotoIndex !== null && savedPhotos[selectedPhotoIndex] && (
        <Dialog open={true} onOpenChange={() => setSelectedPhotoIndex(null)}>
          <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
            <div className="relative h-full">
              {/* Photo Display */}
              <div className="relative bg-black flex items-center justify-center" style={{minHeight: '70vh'}}>
                <img 
                  src={savedPhotos[selectedPhotoIndex].dataUrl}
                  alt={`Bild ${selectedPhotoIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation Arrows */}
                {savedPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : savedPhotos.length - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex < savedPhotos.length - 1 ? selectedPhotoIndex + 1 : 0)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Photo Info */}
              <div className="p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Bild {selectedPhotoIndex + 1} av {savedPhotos.length}
                  </h3>
                  <Badge variant="secondary">
                    {savedPhotos[selectedPhotoIndex].serviceType}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Rum/Område:</span>
                    <div>{savedPhotos[selectedPhotoIndex].room || 'Allmänt'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Tidpunkt:</span>
                    <div>{savedPhotos[selectedPhotoIndex].timestamp}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">GPS-position:</span>
                    <div>{savedPhotos[selectedPhotoIndex].gpsText}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Filstorlek:</span>
                    <div>{Math.round(savedPhotos[selectedPhotoIndex].fileSize / 1024)} KB</div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}