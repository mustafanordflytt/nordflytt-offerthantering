'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Plus,
  MessageSquare,
  ShoppingCart,
  Wrench
} from 'lucide-react'

interface OvertimePromptProps {
  isOpen: boolean
  onClose: () => void
  onSubmitReason: (reason: string, notes?: string, addService?: boolean) => void
  jobInfo: {
    id: string
    customerName: string
    overtimeMinutes: number
    scheduledEndTime: string
    currentTime: string
  }
}

export default function OvertimePrompt({ 
  isOpen, 
  onClose, 
  onSubmitReason, 
  jobInfo 
}: OvertimePromptProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [wantToAddService, setWantToAddService] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const reasons = [
    {
      id: 'need_more_time',
      title: 'Behöver mer tid',
      description: 'Uppdraget tar längre tid än beräknat',
      icon: '⏱️',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      id: 'customer_requested',
      title: 'Kund ville ha mer',
      description: 'Kunden bad om ytterligare tjänster',
      icon: '🏠',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      id: 'unexpected_issues',
      title: 'Oförutsedda problem',
      description: 'Tekniska problem eller hinder uppstod',
      icon: '⚠️',
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    },
    {
      id: 'equipment_issues',
      title: 'Utrustningsproblem',
      description: 'Problem med verktyg eller fordon',
      icon: '🔧',
      color: 'bg-red-50 border-red-200 text-red-700'
    }
  ]

  const handleSubmit = async () => {
    if (!selectedReason) return
    
    setIsSubmitting(true)
    
    try {
      const reasonData = reasons.find(r => r.id === selectedReason)
      await onSubmitReason(reasonData?.title || selectedReason, notes, wantToAddService)
      
      // Reset form
      setSelectedReason(null)
      setNotes('')
      setWantToAddService(false)
      
      onClose()
    } catch (error) {
      console.error('Error submitting overtime reason:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg bg-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-gray-800">Övertid pågår</CardTitle>
          </div>
          
          <Alert className="bg-orange-50 border-orange-200 text-left">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-1">
                <div className="font-medium">Uppdrag: {jobInfo.customerName}</div>
                <div className="text-sm">
                  Planerad sluttid: {jobInfo.scheduledEndTime}
                </div>
                <div className="text-sm">
                  Övertid: <span className="font-semibold">{formatTime(jobInfo.overtimeMinutes)}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Varför tar det längre tid?</h3>
            <div className="space-y-2">
              {reasons.map((reason) => (
                <div
                  key={reason.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedReason === reason.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReason(reason.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{reason.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{reason.title}</div>
                      <div className="text-sm text-gray-600">{reason.description}</div>
                    </div>
                    {selectedReason === reason.id && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Service Option */}
          {selectedReason === 'customer_requested' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="add-service"
                  checked={wantToAddService}
                  onChange={(e) => setWantToAddService(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="add-service" className="flex-1 cursor-pointer">
                  <div className="font-medium text-green-800 flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till ny tjänst
                  </div>
                  <div className="text-sm text-green-700">
                    Öppna dialog för att lägga till tilläggstjänst direkt
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kommentar (valfritt)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Beskriv vad som tog extra tid..."
              className="min-h-20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Stäng
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Rapporterar...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Rapportera övertid
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="text-center text-xs text-gray-500">
            Övertid rapporteras automatiskt för korrekt lönehantering
          </div>
        </CardContent>
      </Card>
    </div>
  )
}