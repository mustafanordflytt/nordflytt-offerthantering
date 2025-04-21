"use client"

import { useState, useEffect, useRef } from "react"
import { NordflyttLogo } from "./components/NordflyttLogo"
import Step1CustomerType from "./components/Step1CustomerType"
import Step2ContactInfo from "./components/Step2ContactInfo"
import Step3ServiceType from "./components/Step3ServiceType"
import Step4MoveDetails from "./components/Step4MoveDetails"
import Step5Inventory from "./components/Step5Inventory"
import OfficeInventory from "./components/OfficeInventory"
import Step6AdditionalServices from "./components/Step6AdditionalServices"
import Step7ExtraServices from "./components/Step7ExtraServices"
import Step8Summary from "./components/Step8Summary"
import Step9Confirmation from "./components/Step9Confirmation"
import CleaningForm from "./components/CleaningForm"
import ProgressBar from "./components/ProgressBar"
import OfficeMovingFlow from "./components/OfficeMovingFlow"
import { translations, type Language } from "./i18n/translations"
import FurnitureValuationForm from "./components/FurnitureValuationForm"
import LanguageSwitcher from "./components/LanguageSwitcher"
import Script from "next/script"

export default function BookingForm() {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<Language>("sv")
  const [formData, setFormData] = useState({
    // Previous form data
    customerType: "",
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    serviceTypes: [] as string[],
    moveDate: "",
    moveTime: "08:00",
    startAddress: "",
    startFloor: "",
    startElevator: "none",
    endAddress: "",
    endFloor: "",
    endElevator: "none",
    parkingDistance: "", // Legacy field
    startParkingDistance: "",
    endParkingDistance: "",
    startLivingArea: "",
    endLivingArea: "",
    startPropertyType: "apartment" as "apartment" | "house" | "storage",
    endPropertyType: "apartment" as "apartment" | "house" | "storage",
    startDoorCode: "",
    endDoorCode: "",
    largeItems: [] as string[],
    additionalServices: [] as string[],
    cleaningArea: "",
    movingBoxes: 0,
    movingMaterials: [] as string[],
    specialItems: [] as string[],
    specialInstructions: "",
    acceptTerms: false,
    paymentMethod: "",

    // New cleaning-specific form data
    address: "",
    size: "",
    hasBalcony: false,
    additionalAreas: [] as string[],
    wasteRemoval: false,
    condition: "normal" as "normal" | "deep",
    hasUtilities: true,
    keyHandover: "onsite" as "onsite" | "advance" | "other",
    keyHandoverNote: "",
    additionalNotes: "",
    packingService: "",
    cleaningService: "",
    calculatedDistance: "",

    // Office moving specific data
    officeFromAddress: "",
    officeToAddress: "",
    officeType: "",
    storeType: "", // Add this new field
    workstations: "",
    additionalSpaces: [] as string[],
    officeMoveDate: "",
    approximateDestination: false,
    officeSizeSquareMeters: "",
    officeElevator: "none" as "big" | "small" | "none",
    hasLoadingZone: false,
    officeInventory: {} as { [key: string]: number },
    needsLabeling: false,
    labelingType: [] as string[],
    specialHandling: [] as string[],
    estimatedVolume: 0,
    manualVolume: "",
    needsITSetup: false,
    // Furniture valuation specific data
    valuationItems: [] as string[],
    valuationOtherItem: "",
    valuationAddress: "",
    valuationFloor: "",
    valuationElevator: "none" as "big" | "small" | "none",
    valuationTimePreference: "asap" as "asap" | "specific",
    valuationDate: "",
    valuationTime: "08:00",
    valuationComment: "",
  })

  // Använd en ref för att förhindra uppdateringslooppar
  const isUpdatingRef = useRef(false)

  // Load saved language preference
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("preferredLanguage") as Language | null
      if (savedLanguage && (savedLanguage === "sv" || savedLanguage === "en")) {
        setLanguage(savedLanguage)
      } else {
        // If no saved preference, detect from browser
        const browserLang = navigator.language.split("-")[0]
        if (browserLang === "en") {
          setLanguage("en")
        }
      }
    } catch (error) {
      console.error("Error loading language preference:", error)
    }
  }, [])

  // Get translation function
  const t = (key: keyof typeof translations.sv) => translations[language][key]

  const isCleaningOnly = formData.serviceType === "cleaning"
  const isOfficeMoving =
    formData.serviceTypes.includes("office_moving") || formData.serviceTypes.includes("store_moving")
  // I renderStep-funktionen, lägg till en kontroll för sell_furniture
  const isFurnitureValuation = formData.serviceTypes.includes("sell_furniture")
  const totalSteps = isCleaningOnly ? 5 : 9
  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)
  const goToStep = (stepNumber: number) => setStep(stepNumber)

  // Replace the handleChange function with this completely rewritten version
  // that has much stronger protection against update loops

  const handleChange = (field: string, value: any) => {
    // For all fields
    if (isUpdatingRef.current) return

    isUpdatingRef.current = true

    // Use a timeout to ensure we break any update cycles
    setTimeout(() => {
      setFormData((prevData) => {
        // Skip if value is identical (deep comparison)
        const prevValue = prevData[field]
        const isEqual =
          Array.isArray(prevValue) && Array.isArray(value)
            ? JSON.stringify(prevValue.sort()) === JSON.stringify([...value].sort())
            : JSON.stringify(prevValue) === JSON.stringify(value)

        if (isEqual) {
          isUpdatingRef.current = false
          return prevData
        }

        // Create new object with updated value
        const newData = { ...prevData, [field]: value }

        // Log important office moving data updates
        if (
          [
            "officeFromAddress",
            "officeToAddress",
            "officeType",
            "workstations",
            "officeMoveDate",
            "officeSizeSquareMeters",
            "officeElevator",
            "hasLoadingZone",
            "additionalSpaces",
          ].includes(field)
        ) {
          console.log(`Updating ${field} to:`, value)
        }

        isUpdatingRef.current = false
        return newData
      })
    }, 100)
  }

  // Handle language change
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  // Ersätt den befintliga handleSubmit-funktionen med denna:

  const handleSubmit = async () => {
    try {
      // Visa laddningsindikator eller liknande här
      console.log("Skickar formulärdata:", JSON.stringify(formData))

      // Skicka data till API-endpointen
      const response = await fetch("/api/submit-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      // Kontrollera om vi fått svar från API:et
      if (!response.ok) {
        const result = await response.json()
        console.error("API returnerade felstatus:", response.status, result)
        
        // Visa detaljerat felmeddelande
        let errorMessage = "Något gick fel vid bokningen"
        if (result.details) {
          errorMessage = result.details
        } else if (result.error) {
          errorMessage = result.error
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Bokning sparad:", result)

      // Navigera till bekräftelsesidan
      setStep(9)
    } catch (error) {
      console.error("Error submitting booking:", error)
      // Visa detaljerat felmeddelande till användaren 
      alert(`Ett fel uppstod när bokningen skulle skickas: Kunde inte skapa kund: TypeError: fetch failed`)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1CustomerType
            formData={formData}
            handleChange={handleChange}
            nextStep={nextStep}
            language={language}
            t={t}
          />
        )
      case 2:
        return (
          <Step2ContactInfo
            formData={formData}
            handleChange={handleChange}
            nextStep={nextStep}
            prevStep={prevStep}
            language={language}
          />
        )
      case 3:
        return (
          <Step3ServiceType
            formData={formData}
            handleChange={handleChange}
            nextStep={nextStep}
            prevStep={prevStep}
            language={language}
            t={t}
          />
        )
      case 4:
        if (isCleaningOnly) {
          return (
            <CleaningForm
              formData={formData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              language={language}
              t={t}
            />
          )
        } else if (isOfficeMoving) {
          // Determine if it's an office move or store move
          const isStoreMove = formData.serviceTypes.includes("store_moving")

          // Log the data being passed to OfficeMovingFlow
          console.log("Passing to OfficeMovingFlow:", {
            officeFromAddress: formData.officeFromAddress,
            officeToAddress: formData.officeToAddress,
            officeType: formData.officeType,
            storeType: formData.storeType,
            workstations: formData.workstations,
            officeMoveDate: formData.officeMoveDate,
            officeSizeSquareMeters: formData.officeSizeSquareMeters,
            officeElevator: formData.officeElevator,
            hasLoadingZone: formData.hasLoadingZone,
            moveType: isStoreMove ? "store" : "office",
          })

          return (
            <OfficeMovingFlow
              formData={formData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              currentStep={4}
              totalSteps={9}
              moveType={isStoreMove ? "store" : "office"}
              language={language}
              t={t}
            />
          )
        } else if (isFurnitureValuation) {
          // Create a custom submit handler that bypasses the summary step
          const handleFurnitureValuationSubmit = () => {
            // Skip to step 9 (confirmation) directly
            setStep(9)
          }

          return (
            <FurnitureValuationForm
              formData={formData}
              handleChange={handleChange}
              nextStep={handleFurnitureValuationSubmit} // Use the custom handler instead of nextStep
              prevStep={prevStep}
              currentStep={4}
              totalSteps={9}
              language={language}
              t={t}
            />
          )
        } else {
          return (
            <Step4MoveDetails
              formData={formData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              language={language}
              t={t}
            />
          )
        }
      case 5:
        if (isCleaningOnly) {
          return <Step9Confirmation formData={formData} language={language} t={t} />
        } else if (isOfficeMoving) {
          // Make sure we're passing all the necessary data to OfficeInventory
          console.log("Main page - Passing to OfficeInventory:", {
            workstations: formData.workstations,
            officeSizeSquareMeters: formData.officeSizeSquareMeters,
            additionalSpaces: formData.additionalSpaces,
            estimatedVolume: formData.estimatedVolume,
          })

          // Create a clean copy of the formData to avoid any reference issues
          const officeInventoryData = {
            ...formData,
            // Ensure these critical fields are properly passed
            workstations: formData.workstations || "",
            officeSizeSquareMeters: formData.officeSizeSquareMeters || "",
            additionalSpaces: [...(formData.additionalSpaces || [])],
            estimatedVolume: formData.estimatedVolume || 0,
          }

          // Determine if it's an office move or store move
          const isStoreMove = formData.serviceTypes.includes("store_moving")

          return (
            <OfficeInventory
              formData={officeInventoryData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              moveType={isStoreMove ? "store" : "office"}
              language={language}
              t={t}
            />
          )
        } else if (isFurnitureValuation) {
          // For furniture valuation, go directly to confirmation
          setStep(9)
          return null
        } else {
          return (
            <Step5Inventory
              formData={formData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              language={language}
              t={t}
            />
          )
        }
      case 6:
        return (
          <Step6AdditionalServices
            formData={formData}
            handleChange={handleChange}
            nextStep={nextStep}
            prevStep={prevStep}
            language={language}
            t={t}
          />
        )
      case 7:
        // Hoppa över flyttmaterial för företagskunder
        if (isOfficeMoving || isFurnitureValuation) {
          // Gå direkt till sammanfattningen
          return (
            <Step8Summary
              formData={formData}
              handleChange={handleChange}
              nextStep={handleSubmit}
              prevStep={prevStep}
              goToStep={goToStep}
              language={language}
              t={t}
            />
          )
        } else {
          return (
            <Step7ExtraServices
              formData={formData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              language={language}
              t={t}
            />
          )
        }
      case 8:
        return (
          <Step8Summary
            formData={formData}
            handleChange={handleChange}
            nextStep={handleSubmit}
            prevStep={prevStep}
            goToStep={goToStep}
            language={language}
            t={t}
          />
        )
      case 9:
        return <Step9Confirmation formData={formData} language={language} t={t} />
      default:
        return <div>Steg inte hittat</div>
    }
  }

  return (
    <main className="min-h-screen bg-sand">
      {/* Ta bort Google Maps API Script då det nu finns i layout.tsx */}
      
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center h-full">
              <NordflyttLogo />
            </div>
            <div className="flex items-center h-full gap-4">
              <LanguageSwitcher currentLanguage={language} onChange={handleLanguageChange} />
              <a 
                href="tel:+46105551289" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full shadow-md transition-all duration-300 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Ring oss
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        <div className="mt-8">{renderStep()}</div>
      </div>
    </main>
  )
}

// Ta bort eller kommentera bort den gamla saveOfferToDatabase-funktionen
// eftersom vi nu sparar direkt till Supabase via API-endpointen

// const saveOfferToDatabase = async (offer: any) => {
//   // Implement your database saving logic here. This is a placeholder.
//   console.log("Saving offer to database:", offer)

//   // Log specific office moving data to help with debugging
//   if (offer.customerType === "business") {
//     console.log("Business customer office moving data:", {
//       officeFromAddress: offer.officeFromAddress,
//       officeToAddress: offer.officeToAddress,
//       officeType: offer.officeType,
//       workstations: offer.workstations,
//       officeSizeSquareMeters: offer.officeSizeSquareMeters,
//       officeElevator: offer.officeElevator,
//       hasLoadingZone: offer.hasLoadingZone,
//       officeMoveDate: offer.officeMoveDate,
//       additionalSpaces: offer.additionalSpaces,
//     })
//   }

//   return { id: 1, ...offer } // Replace with actual database response
// }
