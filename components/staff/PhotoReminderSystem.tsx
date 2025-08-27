'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  X,
  Truck,
  Home,
  Sparkles,
  Eye,
  Upload,
  Image
} from 'lucide-react'

interface PhotoReminder {
  id: string
  type: 'before' | 'during' | 'after'
  category: 'truck' | 'cleaning' | 'damage' | 'inventory'
  title: string
  description: string
  required: boolean
  timing: string
  icon: string
  completed: boolean
  location?: string
  photoUrl?: string
  photoTakenAt?: string
  uploadStatus?: 'uploading' | 'uploaded' | 'failed'
}

interface PhotoReminderSystemProps {
  jobData: {
    serviceType: 'moving' | 'cleaning' | 'packing'
    services: string[]
    specialRequirements: string[]
    customerName: string
    toAddress: string
  }
  currentPhase: 'before' | 'during' | 'after'
  onPhotoTaken: (reminder: PhotoReminder) => void
  onDismiss: () => void
}

export default function PhotoReminderSystem({ 
  jobData, 
  currentPhase, 
  onPhotoTaken, 
  onDismiss 
}: PhotoReminderSystemProps) {
  const [reminders, setReminders] = useState<PhotoReminder[]>([])
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(false)

  useEffect(() => {
    generateSmartReminders()
  }, [jobData, currentPhase])

  const generateSmartReminders = () => {
    const newReminders: PhotoReminder[] = []

    // Before job starts
    if (currentPhase === 'before') {
      // Always take truck photo before starting
      newReminders.push({
        id: 'truck-before',
        type: 'before',
        category: 'truck',
        title: 'Lastbil - Före lossning',
        description: 'Dokumentera lastbilens innehåll innan lossning',
        required: true,
        timing: 'Innan lossning påbörjas',
        icon: '🚛',
        completed: false
      })

      // If cleaning service, document before state
      if (jobData.services.some(s => s.toLowerCase().includes('städ'))) {
        newReminders.push({
          id: 'cleaning-before',
          type: 'before',
          category: 'cleaning',
          title: 'Städning - Före-tillstånd',
          description: 'Dokumentera lokalens skick innan städning',
          required: true,
          timing: 'Innan städning påbörjas',
          icon: '🧹',
          completed: false,
          location: 'I lokalen som ska städas'
        })
      }

      // Special requirements
      if (jobData.specialRequirements.includes('Piano')) {
        newReminders.push({
          id: 'piano-before',
          type: 'before',
          category: 'inventory',
          title: 'Piano - Skyddsdokumentation',
          description: 'Dokumentera pianots skick och skyddsåtgärder',
          required: true,
          timing: 'Innan piano flyttas',
          icon: '🎹',
          completed: false
        })
      }
    }

    // During job
    if (currentPhase === 'during') {
      // Progress documentation for complex jobs
      if (jobData.specialRequirements.length > 0) {
        newReminders.push({
          id: 'progress-update',
          type: 'during',
          category: 'inventory',
          title: 'Framstegsdokumentation',
          description: 'Dokumentera kritiska moment under flytten',
          required: false,
          timing: 'Vid behov under arbetet',
          icon: '📸',
          completed: false
        })
      }

      // Damage documentation (always available)
      newReminders.push({
        id: 'damage-report',
        type: 'during',
        category: 'damage',
        title: 'Skaderapport (vid behov)',
        description: 'Dokumentera eventuella skador omedelbart',
        required: false,
        timing: 'Om skada upptäcks',
        icon: '⚠️',
        completed: false
      })
    }

    // After job completion
    if (currentPhase === 'after') {
      // Always document truck after unloading
      newReminders.push({
        id: 'truck-after',
        type: 'after',
        category: 'truck',
        title: 'Lastbil - Efter lossning',
        description: 'Bekräfta att lastbilen är helt tömd',
        required: true,
        timing: 'Efter all lossning',
        icon: '✅',
        completed: false
      })

      // Cleaning after documentation
      if (jobData.services.some(s => s.toLowerCase().includes('städ'))) {
        newReminders.push({
          id: 'cleaning-after',
          type: 'after',
          category: 'cleaning',
          title: 'Städning - Slutresultat',
          description: 'Dokumentera det färdiga städresultatet',
          required: true,
          timing: 'Efter slutförd städning',
          icon: '✨',
          completed: false,
          location: 'I alla städade utrymmen'
        })
      }

      // Final inspection
      newReminders.push({
        id: 'final-inspection',
        type: 'after',
        category: 'inventory',
        title: 'Slutkontroll lokaler',
        description: 'Dokumentera att alla lokaler är tomma och städade',
        required: true,
        timing: 'Innan avresa',
        icon: '🔍',
        completed: false
      })
    }

    setReminders(newReminders)
    setCurrentReminderIndex(0)
  }

  const currentReminder = reminders[currentReminderIndex]
  const totalReminders = reminders.length
  const completedReminders = reminders.filter(r => r.completed).length
  const requiredReminders = reminders.filter(r => r.required && !r.completed).length

  const handleTakePhoto = async () => {
    if (!currentReminder) return

    try {
      setIsCapturing(true)
      
      // Simulate photo capture with mock data
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create mock photo URL (in real app, this would be the actual photo)
      const mockPhotoUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="150" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
          <text x="100" y="75" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
            ${currentReminder.icon} ${currentReminder.title}
          </text>
          <text x="100" y="90" font-family="Arial" font-size="10" text-anchor="middle" fill="#888">
            ${new Date().toLocaleTimeString('sv-SE')}
          </text>
        </svg>
      `)}`
      
      // Mark as completed with photo data
      const updatedReminders = reminders.map(r => 
        r.id === currentReminder.id ? { 
          ...r, 
          completed: true,
          photoUrl: mockPhotoUrl,
          photoTakenAt: new Date().toISOString(),
          uploadStatus: 'uploading' as const
        } : r
      )
      setReminders(updatedReminders)
      
      // Show thumbnail immediately
      setShowThumbnail(true)
      
      // Simulate upload progress
      setTimeout(() => {
        setReminders(prev => prev.map(r => 
          r.id === currentReminder.id ? { ...r, uploadStatus: 'uploaded' as const } : r
        ))
      }, 2000)

      // Notify parent component
      onPhotoTaken({ 
        ...currentReminder, 
        completed: true,
        photoUrl: mockPhotoUrl,
        photoTakenAt: new Date().toISOString(),
        uploadStatus: 'uploaded'
      })

      // Show success feedback for 2 seconds
      setTimeout(() => {
        setShowThumbnail(false)
        
        // Move to next reminder or complete
        if (currentReminderIndex < totalReminders - 1) {
          setCurrentReminderIndex(prev => prev + 1)
        } else {
          // All reminders completed
          setTimeout(() => {
            onDismiss()
          }, 500)
        }
      }, 2500)

    } catch (error) {
      console.error('Photo capture failed:', error)
      alert('❌ Kunde inte ta foto. Försök igen.')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleSkipPhoto = () => {
    if (currentReminder?.required) {
      if (!confirm('Denna foto är obligatorisk. Är du säker på att du vill hoppa över?')) {
        return
      }
    }

    if (currentReminderIndex < totalReminders - 1) {
      setCurrentReminderIndex(prev => prev + 1)
    } else {
      onDismiss()
    }
  }

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 'before': return 'Före uppdraget'
      case 'during': return 'Under uppdraget'
      case 'after': return 'Efter uppdraget'
    }
  }

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'before': return <Truck className="h-5 w-5 text-blue-600" />
      case 'during': return <Home className="h-5 w-5 text-orange-600" />
      case 'after': return <Sparkles className="h-5 w-5 text-green-600" />
    }
  }

  if (!currentReminder) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {getPhaseIcon()}
            <CardTitle className="text-lg">{getPhaseTitle()}</CardTitle>
          </div>
          <div className="text-sm text-gray-600">
            Fotodokumentation för {jobData.customerName}
          </div>
          
          {/* Progress */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-600">
              {currentReminderIndex + 1} av {totalReminders}
            </span>
            <div className="flex space-x-1">
              {reminders.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full ${
                    index <= currentReminderIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Reminder */}
          <div className="text-center space-y-3">
            <div className="text-4xl">{currentReminder.icon}</div>
            <div>
              <h3 className="font-bold text-lg">{currentReminder.title}</h3>
              <p className="text-gray-600 text-sm">{currentReminder.description}</p>
            </div>

            {currentReminder.location && (
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{currentReminder.location}</span>
              </div>
            )}

            <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{currentReminder.timing}</span>
            </div>

            {currentReminder.required && (
              <Badge variant="destructive" className="text-xs">
                Obligatorisk
              </Badge>
            )}
          </div>

          {/* Warning for required photos */}
          {requiredReminders > 0 && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                {requiredReminders} obligatoriska foton kvar
              </AlertDescription>
            </Alert>
          )}

          {/* Photo Thumbnail & Upload Status */}
          {showThumbnail && currentReminder.photoUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="text-center">
                <div className="inline-block relative">
                  <img 
                    src={currentReminder.photoUrl} 
                    alt={currentReminder.title}
                    className="w-32 h-24 object-cover rounded-lg border-2 border-green-300"
                  />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="font-medium text-green-800 flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Foto taget!</span>
                </div>
                
                {currentReminder.uploadStatus === 'uploading' && (
                  <div className="text-sm text-blue-600 flex items-center justify-center space-x-2">
                    <Upload className="h-4 w-4 animate-bounce" />
                    <span>Laddar upp...</span>
                  </div>
                )}
                
                {currentReminder.uploadStatus === 'uploaded' && (
                  <div className="text-sm text-green-600 flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Uppladdad till servern</span>
                  </div>
                )}
                
                {currentReminder.uploadStatus === 'failed' && (
                  <div className="text-sm text-red-600 flex items-center justify-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Uppladdning misslyckades</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnail(false)}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visa mindre
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {!showThumbnail && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleSkipPhoto}
                className="h-12"
                disabled={isCapturing}
              >
                <X className="h-4 w-4 mr-2" />
                {currentReminder.required ? 'Hoppa över ändå' : 'Hoppa över'}
              </Button>
              <Button
                onClick={handleTakePhoto}
                className="h-12 bg-blue-600 hover:bg-blue-700"
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Tar foto...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Ta foto
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Completion Status with Thumbnail Gallery */}
          {completedReminders > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="text-center text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                {completedReminders} av {totalReminders} foton tagna
              </div>
              
              {/* Mini thumbnail gallery */}
              <div className="flex flex-wrap gap-2 justify-center">
                {reminders.filter(r => r.completed && r.photoUrl).map((reminder, index) => (
                  <div key={reminder.id} className="relative group">
                    <img 
                      src={reminder.photoUrl} 
                      alt={reminder.title}
                      className="w-12 h-9 object-cover rounded border-2 border-green-300 cursor-pointer hover:border-green-500 transition-colors"
                      onClick={() => {
                        // Show enlarged view
                        const modal = document.createElement('div')
                        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'
                        modal.innerHTML = `
                          <div class="relative max-w-lg max-h-96 bg-white rounded-lg p-4">
                            <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onclick="document.body.removeChild(this.parentElement.parentElement)">
                              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                            <img src="${reminder.photoUrl}" alt="${reminder.title}" class="w-full h-auto rounded" />
                            <p class="text-center text-sm text-gray-600 mt-2">${reminder.title}</p>
                            <p class="text-center text-xs text-gray-500">${new Date(reminder.photoTakenAt!).toLocaleString('sv-SE')}</p>
                          </div>
                        `
                        document.body.appendChild(modal)
                      }}
                    />
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {reminder.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}