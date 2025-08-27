'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'

// For now, we'll create a simplified form instead of importing complex components
// import Step1CustomerType from '@/app/components/Step1CustomerType'
// import Step2ContactInfo from '@/app/components/Step2ContactInfo'
// import Step3ServiceType from '@/app/components/Step3ServiceType'
// import Step4MoveDetails from '@/app/components/Step4MoveDetails'
// import Step5Inventory from '@/app/components/Step5Inventory'
// import Step6AdditionalServices from '@/app/components/Step6AdditionalServices'
// import Step7ExtraServices from '@/app/components/Step7ExtraServices'
// import Step8Summary from '@/app/components/Step8Summary'

interface OffertCreationModalProps {
  isOpen: boolean
  onClose: () => void
  customerId?: string
  customerData?: {
    id: string
    name: string
    email?: string
    phone?: string
    address?: string
  }
  onOffertCreated: (offert: any) => void
}

export default function OffertCreationModal({
  isOpen,
  onClose,
  customerId,
  customerData,
  onOffertCreated
}: OffertCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({
    customerType: customerData ? 'business' : 'private',
    // Pre-fill customer data if provided
    customerName: customerData?.name || '',
    email: customerData?.email || '',
    phone: customerData?.phone || '',
    // Initialize other form fields
    serviceType: '',
    moveDate: '',
    moveTime: '',
    fromAddress: '',
    toAddress: '',
    fromFloor: '',
    toFloor: '',
    fromElevator: 'yes',
    toElevator: 'yes',
    squareMeters: '',
    roomCount: '',
    storageArea: '',
    heavyItems: [],
    services: [],
    additionalServices: [],
    packingService: 'no',
    unpackingService: 'no',
    cleaningService: 'no',
    message: ''
  })

  const totalSteps = 8
  const progress = (currentStep / totalSteps) * 100

  const stepTitles = [
    'Kundtyp',
    'Kontaktuppgifter',
    'Tjänstetyp',
    'Flyttdetaljer',
    'Inventarie',
    'Tilläggstjänster',
    'Extra tjänster',
    'Sammanfattning'
  ]

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // Submit to existing API
      const response = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerId: customerId || undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Offert skapad!', {
          description: `Offertnummer: ${result.reference || result.id}`
        })
        
        // Call callback with created offer
        onOffertCreated(result)
        
        // Reset form and close modal
        setCurrentStep(1)
        onClose()
      } else {
        throw new Error('Failed to create offer')
      }
    } catch (error) {
      console.error('Error creating offer:', error)
      toast.error('Kunde inte skapa offert', {
        description: 'Försök igen eller kontakta support'
      })
    }
  }

  const renderStep = () => {
    // Temporary simplified form until we properly integrate the real form
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Offertformulär under utveckling...
        </p>
        <p className="text-sm text-muted-foreground">
          Använd den externa offertformuläret tills vidare.
        </p>
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/form?customerId=${customerId}`, '_blank')
              onClose()
            }}
          >
            Öppna offertformulär →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Skapa ny offert
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Steg {currentStep} av {totalSteps}: {stepTitles[currentStep - 1]}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% klart
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {renderStep()}
        </div>

        {/* Footer with navigation buttons */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Föregående
          </Button>

          <div className="flex items-center gap-2">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index + 1 <= currentStep ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Nästa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-4 w-4" />
              Skapa offert
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}