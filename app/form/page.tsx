"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProgressBar } from "@/components/ProgressBar"
import Step1CustomerType from "@/components/form/Step1CustomerType"
import Step2MovingInfo from "@/components/form/Step2MovingInfo"
import Step3Services from "@/components/form/Step3Services"
import Step4Summary from "@/components/form/Step4Summary"
import type { FormData } from "@/types/formData"
import { quoteService } from "@/lib/supabase"

export default function QuoteForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
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
    try {
      // Exkludera step från data som skickas till API
      const { step, ...submissionData } = formData

      const quote = await quoteService.createQuote(submissionData)

      // Navigera till offertvisningssidan
      router.push(`/offer/${quote.id}`)
    } catch (error) {
      console.error("Fel vid skapande av offert:", error)
      alert("Ett fel uppstod vid skapande av offert. Försök igen senare.")
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
          <Step4Summary
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-2">Offertförfrågan</h1>
      <p className="text-sm text-gray-600 text-center py-3 mt-1 mb-6">
        🕊️ Inget är bindande. Du får ett förslag – du väljer sen.
      </p>

      <ProgressBar currentStep={formData.step} totalSteps={4} />

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">{renderStep()}</div>
    </div>
  )
}
