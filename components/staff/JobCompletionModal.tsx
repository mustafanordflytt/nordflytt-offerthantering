'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Camera, FileText, AlertTriangle } from 'lucide-react'
import { stopTimeTrackingWithOvertimeCheck, getCurrentWorkTime } from '../../lib/time-tracking'
import OrderConfirmationModal from './OrderConfirmationModal'

interface JobCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  jobData: any
  onComplete: (completionData: any) => void
}

export default function JobCompletionModal({ 
  isOpen, 
  onClose, 
  jobData,
  onComplete 
}: JobCompletionModalProps) {
  const [completionNotes, setCompletionNotes] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const currentWorkTime = getCurrentWorkTime(jobData.id)

  const handleCompleteJob = async () => {
    setIsCompleting(true)
    
    try {
      // Mock GPS för demo
      const jobLocation = {
        latitude: 59.3293 + (Math.random() - 0.5) * 0.01,
        longitude: 18.0686 + (Math.random() - 0.5) * 0.01,
        address: jobData.toAddress
      }

      // Stoppa tidsloggning
      const timeResult = await stopTimeTrackingWithOvertimeCheck(
        jobData.id,
        jobLocation,
        jobData.endTime,
        (overtimeInfo) => {
          console.log('Overtime detected:', overtimeInfo)
          // Övertid hanteras i OvertimePrompt komponenten
        }
      )

      if (timeResult.success) {
        // Uppdatera jobbstatus
        const completionData = {
          jobId: jobData.id,
          completedAt: new Date().toISOString(),
          notes: completionNotes,
          totalWorkTime: currentWorkTime,
          hasOvertime: timeResult.hasOvertime
        }

        // Spara completion data
        const completions = JSON.parse(localStorage.getItem('job_completions') || '[]')
        completions.push(completionData)
        localStorage.setItem('job_completions', JSON.stringify(completions))

        // Visa orderbekräftelse modal
        setShowOrderConfirmation(true)
        
        // Meddela parent
        onComplete(completionData)
        
        alert(`✅ Jobb avslutat!\n\n${timeResult.message}`)
      } else {
        alert(`❌ Kunde inte avsluta jobb\n\n${timeResult.message}`)
      }
    } catch (error) {
      console.error('Error completing job:', error)
      alert('❌ Ett fel uppstod vid avslutning av jobbet')
    } finally {
      setIsCompleting(false)
    }
  }

  const getMissingItems = () => {
    const missing = []
    
    // Kontrollera foton
    const photos = JSON.parse(localStorage.getItem('photos') || '[]')
    const jobPhotos = photos.filter((p: any) => {
      const photoTime = new Date(p.timestamp)
      const jobStart = new Date()
      jobStart.setHours(parseInt(jobData.moveTime.split(':')[0]), parseInt(jobData.moveTime.split(':')[1]))
      return photoTime >= jobStart
    })

    if (jobPhotos.length < 3) {
      missing.push(`📸 Saknar ${3 - jobPhotos.length} foton (minst 3 krävs)`)
    }

    // Kontrollera arbetstid
    if (!currentWorkTime.isActive && currentWorkTime.hours === 0 && currentWorkTime.minutes === 0) {
      missing.push('⏱️ Ingen arbetstid registrerad')
    }

    return missing
  }

  const missingItems = getMissingItems()
  const canComplete = missingItems.length === 0

  return (
    <>
      <Dialog open={isOpen && !showOrderConfirmation} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span>Avsluta uppdrag</span>
            </DialogTitle>
            <DialogDescription>
              Bekräfta att uppdraget är slutfört för {jobData.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Jobbinfo */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bokningsnummer:</span>
                <span className="font-medium">{jobData.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Arbetstid:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  {currentWorkTime.isActive ? 'Pågående: ' : 'Total: '}
                  {currentWorkTime.hours}h {currentWorkTime.minutes}m
                </Badge>
              </div>
            </div>

            {/* Checklista */}
            {missingItems.length > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900">Saknade moment</h4>
                    <ul className="mt-2 space-y-1">
                      {missingItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Alla moment slutförda</h4>
                    <p className="text-sm text-green-700">Uppdraget är klart att avslutas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Avslutningskommentar */}
            <div className="space-y-2">
              <Label htmlFor="notes">Avslutningskommentar (valfritt)</Label>
              <Textarea
                id="notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Eventuella noteringar om uppdraget..."
                rows={3}
              />
            </div>

            {/* Åtgärdsknappar */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleCompleteJob}
                disabled={!canComplete || isCompleting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCompleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Avsluta uppdrag
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orderbekräftelse Modal */}
      {showOrderConfirmation && (
        <OrderConfirmationModal
          isOpen={showOrderConfirmation}
          onClose={() => {
            setShowOrderConfirmation(false)
            onClose()
          }}
          jobData={jobData}
          onComplete={() => {
            setShowOrderConfirmation(false)
            onClose()
          }}
        />
      )}
    </>
  )
}