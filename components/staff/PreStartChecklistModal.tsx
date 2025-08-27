'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, AlertTriangle, PlayCircle, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PreStartChecklistModalProps {
  isOpen: boolean
  onClose: () => void
  onStartJob: () => void
  jobData: {
    customerName: string
    equipment: string[]
    locationInfo: {
      doorCode: string
      elevator: boolean
      elevatorStatus: string
      parkingDistance: number
      floor: number
    }
    teamMembers: string[]
    services: string[]
    specialRequirements: string[]
    serviceType: 'moving' | 'cleaning' | 'packing'
  }
}

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  required: boolean
}

export default function PreStartChecklistModal({ isOpen, onClose, onStartJob, jobData }: PreStartChecklistModalProps) {
  // console.log('PreStartChecklistModal render - isOpen:', isOpen, 'jobData:', jobData?.customerName)
  
  // Generate dynamic checklist based on job data
  const generateChecklistItems = (): ChecklistItem[] => {
    const items: ChecklistItem[] = []

    // Basic required items for all jobs
    items.push({
      id: 'vehicle',
      label: jobData.locationInfo.parkingDistance > 50 
        ? `⚠️ Fordon parkerat - OBS: ${jobData.locationInfo.parkingDistance}m till dörr` 
        : 'Fordon parkerat och säkrat',
      checked: false,
      required: true
    })

    items.push({
      id: 'team',
      label: `Alla teammedlemmar närvarande (${jobData.teamMembers.length} personer)`,
      checked: false,
      required: true
    })

    // Door code check
    if (jobData.locationInfo.doorCode && jobData.locationInfo.doorCode !== 'Nej') {
      items.push({
        id: 'doorcode',
        label: `Portkod bekräftad: ${jobData.locationInfo.doorCode}`,
        checked: false,
        required: true
      })
    }

    // Elevator status
    if (jobData.locationInfo.floor > 2) {
      items.push({
        id: 'elevator',
        label: `Hissstatus kontrollerad: ${jobData.locationInfo.elevatorStatus}`,
        checked: false,
        required: true
      })
    }

    // Equipment check based on job type
    items.push({
      id: 'equipment',
      label: `Utrustning kontrollerad (${jobData.equipment.length} föremål)`,
      checked: false,
      required: true
    })

    // Special requirements checks
    if (jobData.specialRequirements.includes('Piano')) {
      items.push({
        id: 'piano',
        label: '🎹 Piano-specialutrustning kontrollerad (3+ personer krävs)',
        checked: false,
        required: true
      })
    }

    if (jobData.specialRequirements.includes('Stora möbler')) {
      items.push({
        id: 'furniture',
        label: '🚪 Extra försiktighet för stora möbler planerad',
        checked: false,
        required: true
      })
    }

    // Service-specific checks
    if (jobData.serviceType === 'cleaning') {
      items.push({
        id: 'cleaning',
        label: 'Städmaterial och kemikalier kontrollerade',
        checked: false,
        required: true
      })
    }

    if (jobData.serviceType === 'packing') {
      items.push({
        id: 'packing',
        label: 'Packmaterial (kartonger, tejp, bubbelplast) kontrollerat',
        checked: false,
        required: true
      })
    }

    // Safety briefing
    items.push({
      id: 'safety',
      label: 'Säkerhetsrutiner genomgångna med teamet',
      checked: false,
      required: true
    })

    // Customer contact (optional but recommended)
    items.push({
      id: 'customer',
      label: 'Kund kontaktad och informerad om ankomst (rekommenderat)',
      checked: false,
      required: false
    })

    return items
  }

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(generateChecklistItems())

  const [isStarting, setIsStarting] = useState(false)

  const handleCheckItem = (itemId: string) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const requiredItemsCompleted = checklistItems.filter(item => item.required).every(item => item.checked)
  const completedCount = checklistItems.filter(item => item.checked).length

  const handleStartJob = async () => {
    if (!requiredItemsCompleted) return

    setIsStarting(true)
    
    // Simulate starting job
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onStartJob()
    setIsStarting(false)
    onClose()
  }

  const handleClose = () => {
    if (!isStarting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <PlayCircle className="h-6 w-6 text-[#002A5C]" />
            <span>Förbered uppdrag</span>
          </DialogTitle>
          <DialogDescription>
            Kontrollera följande innan du startar uppdraget för <strong>{jobData.customerName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Framsteg</span>
            <span className="text-sm text-gray-600">{completedCount}/{checklistItems.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#002A5C] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                item.checked 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200 hover:border-[#002A5C]'
              }`}
              onClick={() => handleCheckItem(item.id)}
            >
              <Checkbox
                checked={item.checked}
                onChange={() => handleCheckItem(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1 cursor-pointer">
                <label className={`text-sm cursor-pointer ${
                  item.checked ? 'text-green-800 line-through' : 'text-gray-900'
                }`}>
                  {item.label}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              {item.checked && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          ))}
        </div>

        {/* Equipment List */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">🛠️ Utrustning att kontrollera:</p>
          <div className="flex flex-wrap gap-1">
            {jobData.equipment.map((item, index) => (
              <span key={index} className="text-xs bg-white px-2 py-1 rounded border">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Warning if required items not completed */}
        {!requiredItemsCompleted && completedCount > 0 && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Slutför alla obligatoriska punkter (*) innan du kan starta uppdraget.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isStarting}
            className="flex-1 h-11"
          >
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
          <Button
            onClick={handleStartJob}
            disabled={!requiredItemsCompleted || isStarting}
            className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
          >
            {isStarting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Startar...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Starta uppdrag
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}