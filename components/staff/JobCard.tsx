'use client'

import { memo, useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock,
  MapPin,
  AlertTriangle,
  Phone,
  Navigation as NavigationIcon,
  Camera,
  PlayCircle,
  PauseCircle,
  Plus,
  CheckCircle
} from 'lucide-react'
import { cameraHandler } from '../../app/staff/utils/serviceSpecific'
import { startTimeTracking, stopTimeTracking, hasActiveTimeTracking, getTotalWorkTime, getCurrentWorkTime } from '../../lib/time-tracking'
import MaterialCalculation from './MaterialCalculation'
import JobCompletionModal from './JobCompletionModal'

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

interface ServiceConfig {
  name: string
  emoji: string
  color: string
  bgColor: string
  timeRange: string
  systemRecommendation: string
  checklistItems: string[]
  specificActions: {
    primary: { icon: string, label: string, action: string }
    secondary: { icon: string, label: string, action: string }
  }
  specificDetails: {
    items: string[]
    requirements: string[]
  }
}

interface JobCardProps {
  job: TodaysJob
  service: string
  serviceConfig: ServiceConfig
  onJobCardClick: (job: TodaysJob, selectedService: string) => void
  onStartJobClick: (job: TodaysJob) => void
  onAddServiceToJob: (job: TodaysJob) => void
  getJobStatusColor: (status: string) => string
  getJobStatusText: (status: string) => string
}

const JobCard = memo(function JobCard({
  job,
  service,
  serviceConfig,
  onJobCardClick,
  onStartJobClick,
  onAddServiceToJob,
  getJobStatusColor,
  getJobStatusText
}: JobCardProps) {
  const isActiveTracking = hasActiveTimeTracking(job.id)
  const [currentTime, setCurrentTime] = useState(getCurrentWorkTime(job.id))
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  // Update time every 10 seconds if tracking is active
  useEffect(() => {
    if (isActiveTracking) {
      // Update immediately when starting
      const updateTime = () => {
        const newTime = getCurrentWorkTime(job.id)
        console.log('Updating time for job:', job.id, newTime)
        setCurrentTime(newTime)
      }
      
      updateTime() // Initial update
      
      const interval = setInterval(updateTime, 10000) // Update every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [isActiveTracking, job.id])
  
  // Mock GPS för jobbadressen (i verkligheten från Google Maps API)
  const jobLocation = {
    latitude: 59.3293 + (Math.random() - 0.5) * 0.01, // Stockholm med lite variation
    longitude: 18.0686 + (Math.random() - 0.5) * 0.01,
    address: job.toAddress
  }

  const handleStartTracking = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const result = await startTimeTracking(job.id, serviceConfig.name, jobLocation)
    
    if (result.success) {
      alert(result.message)
      // Force immediate time update
      setCurrentTime(getCurrentWorkTime(job.id))
      // Uppdatera jobstatus till in_progress om det var upcoming
      if (job.status === 'upcoming') {
        onStartJobClick(job)
      }
    } else {
      alert(result.message)
    }
  }

  const handleStopTracking = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const result = await stopTimeTracking(job.id, jobLocation)
    alert(result.message)
  }

  const handleJobCompletion = (completionData: any) => {
    // Uppdatera jobbstatus till completed
    console.log('Job completed:', completionData)
    // I verkligheten skulle detta trigga en uppdatering av jobbstatus via API/state management
    window.location.reload() // Temporär lösning för demo
  }
  return (
    <div 
      className={`bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden`}
      onClick={() => onJobCardClick(job, service)}
    >
      {/* Tjänstespecifik checklista */}
      <div className={`mb-4 p-3 rounded-lg border ${serviceConfig.bgColor}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">{serviceConfig.emoji}</span>
          <span className={`text-sm font-medium ${serviceConfig.color}`}>Checklista för {serviceConfig.name}</span>
        </div>
        <div className="space-y-2">
          {serviceConfig.checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-xs">
              <input type="checkbox" className="rounded w-3 h-3" />
              <span className={serviceConfig.color}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Huvud med rätt tid per tjänst */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{serviceConfig.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{job.customerName}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Badge className={`${serviceConfig.bgColor} ${serviceConfig.color} text-xs px-2 py-1`}>
                {serviceConfig.name}
              </Badge>
              <Clock className="h-4 w-4" />
              <span className="font-medium">{serviceConfig.timeRange}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <Badge className={getJobStatusColor(job.status)}>
            {getJobStatusText(job.status)}
          </Badge>
          {job.priority === 'high' && (
            <div className="text-xs text-red-600 font-medium mt-1">⚠️ Hög prioritet</div>
          )}
          
          {/* Tidsloggning status */}
          {isActiveTracking && (
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              Pågående loggning
            </div>
          )}
          
          {(currentTime.hours > 0 || currentTime.minutes > 0 || currentTime.isActive) && (
            <div className="text-xs text-gray-600 mt-1">
              ⏱️ {currentTime.isActive ? (
                currentTime.hours === 0 && currentTime.minutes === 0 ? 
                  'Precis startad' : 
                  `Pågående: ${currentTime.hours}h ${currentTime.minutes}m`
              ) : (
                `Total: ${currentTime.hours}h ${currentTime.minutes}m`
              )}
            </div>
          )}
        </div>
      </div>


      {/* Adress och varningar med bättre layout */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-700">
          <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
          <span className="truncate">{job.toAddress}</span>
        </div>
        
        {/* Materialberäkning för ALLA tjänstetyper */}
        <MaterialCalculation 
          serviceType={job.serviceType} 
          jobData={job}
          onCalculationUpdate={(materials, cost) => {
            // Kan användas för att uppdatera parent state om behövs
            console.log('Material updated:', materials, 'Total cost:', cost)
          }}
        />

        
        {/* Kritiska varningar */}
        {!job.locationInfo.elevator && job.locationInfo.floor > 1 && (
          <div className="flex items-center text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 mr-3 flex-shrink-0" />
            <span>Våning {job.locationInfo.floor} - Ingen hiss tillgänglig</span>
          </div>
        )}
        
        {job.locationInfo.elevatorStatus !== 'Fungerar' && job.locationInfo.elevator && (
          <div className="flex items-center text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 mr-3 flex-shrink-0" />
            <span>{job.locationInfo.elevatorStatus}</span>
          </div>
        )}
        
        {job.locationInfo.parkingDistance > 20 && (
          <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-4 py-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 mr-3 flex-shrink-0" />
            <span>Lång parkeringsdistans: {job.locationInfo.parkingDistance}m</span>
          </div>
        )}
      </div>

      {/* Tjänstespecifik detaljvy */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <span className="mr-2">{serviceConfig.emoji}</span>
          Specifikt för {serviceConfig.name}
        </h4>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {serviceConfig.specificDetails.items.map((item, idx) => (
            <div key={idx} className="flex items-center text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <span>{item}: {
                item === 'Bohagsvolym' ? `${job.volume || 0} m³` :
                item === 'Antal kartonger' ? `${job.boxCount || 0} st` :
                item === 'Antal personer' ? `${job.teamMembers.length} st` :
                item === 'Tidsåtgång' ? `${job.estimatedHours}h` :
                'Se jobbdetaljer'
              }</span>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          {serviceConfig.specificDetails.requirements.map((req, idx) => (
            <div key={idx} className="flex items-center">
              <span className="text-orange-500 mr-2">⚠️</span>
              <span>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamiska åtgärdsknappar baserat på tjänst */}
      <div className="pt-6 border-t border-gray-200 mt-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Button 
            variant="outline"
            size="sm"
            className="h-14 text-xs flex flex-col items-center justify-center p-2"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`tel:${job.customerPhone}`)
            }}
          >
            <Phone className="h-4 w-4 mb-1" />
            <span>Ring kund</span>
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className="h-14 text-xs flex flex-col items-center justify-center p-2"
            onClick={(e) => {
              e.stopPropagation()
              const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.toAddress)}`
              window.open(mapUrl, '_blank')
            }}
          >
            <NavigationIcon className="h-4 w-4 mb-1" />
            <span>Navigera</span>
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className="h-14 text-xs flex flex-col items-center justify-center p-2 bg-blue-50 border-blue-200 text-blue-700"
            onClick={async (e) => {
              e.stopPropagation()
              try {
                await cameraHandler(serviceConfig.name, 'generell')
              } catch (error) {
                console.error('Kamerafel:', error)
                alert('⚠️ Kunde inte öppna kamera')
              }
            }}
          >
            <Camera className="h-4 w-4 mb-1" />
            <span>Generell foto</span>
          </Button>
        </div>

        {/* Tjänstespecifika primära knappar */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button 
            variant="outline"
            size="sm"
            className="h-14 text-xs flex flex-col items-center justify-center p-2 bg-green-50 border-green-200 text-green-700"
            onClick={async (e) => {
              e.stopPropagation()
              if (serviceConfig.specificActions.primary.action === 'photo_furniture') {
                await cameraHandler(serviceConfig.name, 'stora_möbler')
              } else if (serviceConfig.specificActions.primary.action === 'count_materials') {
                alert('📊 Materialräkning startar...\n\nKartonger: 0\nTejp: 0\nPlastpåsar: 0')
              } else if (serviceConfig.specificActions.primary.action === 'checklist_40') {
                alert('📋 40-punktslista öppnas...\n\n✓ Kök\n✓ Badrum\n✓ Vardagsrum\n○ Sovrum')
              }
            }}
          >
            <span className="text-base mb-1">{serviceConfig.specificActions.primary.icon}</span>
            <span className="text-center leading-tight">{serviceConfig.specificActions.primary.label}</span>
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className="h-14 text-xs flex flex-col items-center justify-center p-2 bg-yellow-50 border-yellow-200 text-yellow-700"
            onClick={async (e) => {
              e.stopPropagation()
              if (serviceConfig.specificActions.secondary.action === 'add_stairs') {
                alert('🏋️ Trappbärning läggs till uppdraget\n\n+500 kr våning 3+\nKräver 2 personer')
              } else if (serviceConfig.specificActions.secondary.action === 'photo_labeling') {
                await cameraHandler(serviceConfig.name, 'kartonmärkning')
              } else if (serviceConfig.specificActions.secondary.action === 'photo_rooms') {
                await cameraHandler(serviceConfig.name, 'rum_före')
              }
            }}
          >
            <span className="text-base mb-1">{serviceConfig.specificActions.secondary.icon}</span>
            <span className="text-center leading-tight">{serviceConfig.specificActions.secondary.label}</span>
          </Button>
        </div>
        
        {/* Tidsloggning och huvudknappar */}
        <div className="space-y-3">
          {/* Tidsloggning-knappar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Tryck på kortet för detaljer</span>
            
            <div className="flex items-center space-x-2">
              {!isActiveTracking ? (
                <Button 
                  size="sm"
                  onClick={handleStartTracking}
                  className="bg-green-600 hover:bg-green-700 text-white h-9 px-3"
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Starta tid
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={handleStopTracking}
                  className="bg-red-600 hover:bg-red-700 text-white h-9 px-3"
                >
                  <PauseCircle className="h-4 w-4 mr-1" />
                  Stoppa tid
                </Button>
              )}
            </div>
          </div>

          {/* Sekundära åtgärdsknappar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {isActiveTracking ? '🟢 Tid loggas' : '⚪ Ej startad'}
            </div>
            
            {job.status === 'upcoming' && !isActiveTracking && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onStartJobClick(job)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                Påbörja {serviceConfig.name}
              </Button>
            )}
            
            {job.status === 'in_progress' && (
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddServiceToJob(job)
                  }}
                  variant="outline"
                  className="h-9"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till tjänst
                </Button>
                
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCompletionModal(true)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white h-9"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Avsluta uppdrag
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Job Completion Modal */}
      {showCompletionModal && (
        <JobCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          jobData={job}
          onComplete={handleJobCompletion}
        />
      )}
    </div>
  )
})

export default JobCard