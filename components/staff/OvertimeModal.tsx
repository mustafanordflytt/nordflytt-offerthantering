'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, AlertTriangle, DollarSign, Coffee } from 'lucide-react'

interface OvertimeModalProps {
  isOpen: boolean
  onClose: () => void
  jobInfo: {
    id: string
    customerName: string
    scheduledEndTime: string
    actualTime: string
    overtimeMinutes: number
  }
  onSubmit: (reason: string, notes?: string) => void
}

const overtimeReasons = [
  {
    id: 'heavy_items',
    label: 'Tunga föremål',
    icon: '🏋️',
    description: 'Piano, kassaskåp eller andra tunga saker'
  },
  {
    id: 'no_elevator',
    label: 'Ingen hiss',
    icon: '🚶',
    description: 'Trappbärning tog extra tid'
  },
  {
    id: 'long_distance',
    label: 'Lång bärväg',
    icon: '📏',
    description: 'Längre än förväntat till lastbilen'
  },
  {
    id: 'customer_request',
    label: 'Kundens önskemål',
    icon: '🙋',
    description: 'Extra arbete på kundens begäran'
  },
  {
    id: 'traffic',
    label: 'Trafikproblem',
    icon: '🚗',
    description: 'Köer eller svårt att parkera'
  },
  {
    id: 'packing_issues',
    label: 'Packningsproblem',
    icon: '📦',
    description: 'Mer att packa än beräknat'
  },
  {
    id: 'other',
    label: 'Annat',
    icon: '💬',
    description: 'Beskriv i kommentarsfältet'
  }
]

export default function OvertimeModal({ isOpen, onClose, jobInfo, onSubmit }: OvertimeModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatOvertimeTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins} minuter`
  }

  const calculateOvertimeCost = (minutes: number) => {
    // Övertidskostnad: 50% extra per timme (exempel)
    const hourlyRate = 350 // SEK per timme
    const overtimeRate = hourlyRate * 1.5
    const cost = (minutes / 60) * overtimeRate
    return Math.round(cost)
  }

  const handleSubmit = async () => {
    if (!selectedReason) return

    setIsSubmitting(true)
    const selectedReasonData = overtimeReasons.find(r => r.id === selectedReason)
    const reasonText = selectedReasonData ? selectedReasonData.label : selectedReason
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onSubmit(reasonText, additionalNotes)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">Övertidsrapportering</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            Uppdraget tog längre tid än beräknat. Vänligen ange orsak för fakturering.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Overtime Info Card */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Kund:</span>
                  <span className="font-semibold">{jobInfo.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Planerad sluttid:</span>
                  <span className="font-mono">{jobInfo.scheduledEndTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Faktisk tid:</span>
                  <span className="font-mono text-orange-600">{jobInfo.actualTime}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Övertid:</span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatOvertimeTime(jobInfo.overtimeMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Uppskattad extra kostnad:</span>
                    <span className="font-semibold">
                      {calculateOvertimeCost(jobInfo.overtimeMinutes)} kr
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Välj huvudorsak till förseningen:
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              <div className="space-y-2">
                {overtimeReasons.map((reason) => (
                  <label
                    key={reason.id}
                    htmlFor={reason.id}
                    className={`
                      flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedReason === reason.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{reason.icon}</span>
                        <span className="font-medium">{reason.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
              Ytterligare kommentarer (valfritt):
            </Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Beskriv eventuella detaljer som kan vara viktiga för faktureringen..."
              className="min-h-[80px]"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex space-x-2">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Vad händer nu?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Din rapportering sparas i systemet</li>
                  <li>• Kunden informeras om förseningen</li>
                  <li>• Övertid läggs till på fakturan automatiskt</li>
                  <li>• Du får övertidsersättning enligt avtal</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1 bg-[#002A5C] hover:bg-[#001a42]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sparar...
                </>
              ) : (
                'Rapportera övertid'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}