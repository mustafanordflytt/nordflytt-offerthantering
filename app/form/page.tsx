"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useKeyboardAware, useScrollIntoViewOnFocus } from "@/hooks/use-keyboard-aware"
import ProgressBar from "@/components/ProgressBar"
import Step1CustomerType from "@/components/form/Step1CustomerType"
import Step2MovingInfo from "@/components/form/Step2MovingInfo"
import Step3Services from "@/components/form/Step3Services"
import Step4SummaryWithCreditCheck from "@/components/form/Step4SummaryWithCreditCheck"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ButtonLoadingSpinner, LoadingSpinner, ContentSkeleton } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import type { FormData } from "@/types/formData"

const FORM_STORAGE_KEY = 'nordflytt-form-data'

export default function QuoteForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const viewport = useKeyboardAware()
  useScrollIntoViewOnFocus()
  
  // Load saved form data from localStorage
  const getSavedFormData = (): FormData => {
    if (typeof window === 'undefined') return getDefaultFormData()
    
    const saved = localStorage.getItem(FORM_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Make sure step is valid
        if (parsed.step < 1 || parsed.step > 4) {
          parsed.step = 1
        }
        return { ...getDefaultFormData(), ...parsed }
      } catch (e) {
        console.error('Failed to parse saved form data', e)
      }
    }
    return getDefaultFormData()
  }
  
  const getDefaultFormData = (): FormData => ({
    customerType: "private",
    customerInfo: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    moveDetails: {
      moveType: "local",
      startAddress: "",
      endAddress: "",
      moveSize: "medium",
      floors: {
        start: 0,
        end: 0,
      },
      elevator: {
        start: false,
        end: false,
      },
      parkingDistance: {
        start: 0,
        end: 0,
      },
    },
    inventory: {
      items: [],
      totalVolume: 0,
    },
    services: ["moving"],
    additionalServices: [],
    totalPrice: 0,
    step: 1,
  })
  
  const [formData, setFormData] = useState<FormData>(getDefaultFormData())
  
  // Load saved data on mount
  useEffect(() => {
    const savedData = getSavedFormData()
    setFormData(savedData)
    setIsLoading(false)
  }, [])
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading && formData) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData))
    }
  }, [formData, isLoading])

  const nextStep = () => {
    setFormData((prev) => ({ ...prev, step: prev.step + 1 }))
  }

  const prevStep = () => {
    setFormData((prev) => ({ ...prev, step: prev.step - 1 }))
  }

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Exkludera step från data som skickas till API
      const { step, ...submissionData } = formData
      
      // Använd rätt endpoint beroende på om kreditprövning är gjord
      const endpoint = formData.creditCheckId 
        ? '/api/submit-booking-with-credit' 
        : '/api/submit-booking';
      
      // Använd fetch API för att skicka data direkt till vår submit-booking endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        throw new Error(`API-anrop misslyckades med status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Hantera deposition om det krävs
      if (result.depositRequired && result.depositAmount) {
        // I produktion, omdirigera till betalningssida här
        console.log('Deposition krävs:', result.depositAmount, 'kr');
      }
      
      // Clear saved form data on successful submission
      localStorage.removeItem(FORM_STORAGE_KEY)
      
      // Använd den returnerade redirectUrl från API:et istället för hårdkodad offert-ID
      if (result.redirectUrl) {
        console.log('Omdirigerar till:', result.redirectUrl);
        router.push(result.redirectUrl);
      } else {
        console.log('Ingen redirect URL i svaret, använder bookingId:', result.bookingId);
        router.push(`/offer/${result.bookingId}`);
      }
    } catch (error) {
      console.error("Fel vid skapande av offert:", error)
      toast.error("Ett fel uppstod vid skapande av offert. Försök igen senare.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (formData.step) {
      case 1:
        return <Step1CustomerType formData={formData} updateFormData={updateFormData} nextStep={nextStep} />
      case 2:
        return (
          <Step2MovingInfo
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )
      case 3:
        return (
          <Step3Services formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
        )
      case 4:
        return (
          <Step4SummaryWithCreditCheck
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" label="Laddar formulär..." />
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl keyboard-aware-container">
      <div className={`step-form-container ${viewport.isKeyboardOpen ? 'keyboard-open' : ''}`}>
        <div className="step-form-header">
          <h1 className="text-3xl font-bold text-center mb-2">Offertförfrågan</h1>
          <p className="text-sm text-gray-600 text-center py-3 mt-1 mb-6 hide-on-landscape-keyboard">
            🕊️ Inget är bindande. Du får ett förslag – du väljer sen.
          </p>
          <ProgressBar currentStep={formData.step} totalSteps={4} />
        </div>

        <div className="step-form-content">
          <div className="bg-white rounded-lg shadow-md p-6">
            <ErrorBoundary>
              {renderStep()}
            </ErrorBoundary>
          </div>
          
          {/* Info om sparad data */}
          {formData.step > 1 && !viewport.isKeyboardOpen && (
            <p className="text-xs text-gray-500 text-center mt-4 hide-on-keyboard">
              Dina uppgifter sparas automatiskt om du behöver avbryta
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
