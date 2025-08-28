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
import { useRouter } from "next/navigation"
import type { MoveFormData, FormField } from '../types/form'

// Validation function for Step 4
const validateStep4Data = (formData: MoveFormData): boolean => {
  // Base required fields
  const requiredFields: FormField[] = [
    'moveDate',
    'moveTime',
    'startAddress',
    'endAddress',
    'startLivingArea',
    'endLivingArea',
    'startPropertyType',
    'endPropertyType'
  ];

  // Debug logging
  console.log('🔍 Validating Step 4 form data:', {
    moveDate: formData.moveDate,
    moveTime: formData.moveTime,
    startAddress: formData.startAddress,
    endAddress: formData.endAddress,
    startLivingArea: formData.startLivingArea,
    endLivingArea: formData.endLivingArea,
    startPropertyType: formData.startPropertyType,
    endPropertyType: formData.endPropertyType,
    startParkingDistance: formData.startParkingDistance,
    endParkingDistance: formData.endParkingDistance,
    startFloor: formData.startFloor,
    endFloor: formData.endFloor,
    startElevator: formData.startElevator,
    endElevator: formData.endElevator
  });

  // Check base fields
  const baseValid = requiredFields.every(field => {
    const value = formData[field];
    const isValid = value !== undefined && value !== null && String(value).trim() !== '';
    if (!isValid) {
      console.log(`❌ Field '${field}' is invalid:`, value);
    }
    return isValid;
  });

  if (!baseValid) {
    console.log('❌ Base validation failed');
    return false;
  }

  // Check parking distances
  if (formData.startParkingDistance === undefined || formData.startParkingDistance === '') {
    console.log('❌ startParkingDistance is invalid:', formData.startParkingDistance);
    return false;
  }
  if (formData.endParkingDistance === undefined || formData.endParkingDistance === '') {
    console.log('❌ endParkingDistance is invalid:', formData.endParkingDistance);
    return false;
  }

  // Only check floor and elevator for apartments
  if (formData.startPropertyType === 'apartment') {
    if (!formData.startFloor || formData.startFloor === '') {
      console.log('❌ startFloor is required for apartment but invalid:', formData.startFloor);
      return false;
    }
    if (!formData.startElevator || formData.startElevator === '') {
      console.log('❌ startElevator is required for apartment but invalid:', formData.startElevator);
      return false;
    }
  }

  if (formData.endPropertyType === 'apartment') {
    if (!formData.endFloor || formData.endFloor === '') {
      console.log('❌ endFloor is required for apartment but invalid:', formData.endFloor);
      return false;
    }
    if (!formData.endElevator || formData.endElevator === '') {
      console.log('❌ endElevator is required for apartment but invalid:', formData.endElevator);
      return false;
    }
  }

  console.log('✅ All validation passed!');
  return true;
};

export default function BookingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<Language>("sv")
  const [formData, setFormData] = useState<MoveFormData>({
    // Customer information
    customerType: "",
    name: "",
    email: "",
    phone: "",
    
    // Service information
    serviceType: "",
    serviceTypes: [] as string[],
    
    // Move details
    moveDate: "",
    moveTime: "08:00",
    startAddress: "",
    startFloor: "",
    startElevator: "none",
    endAddress: "",
    endFloor: "",
    endElevator: "none",
    startLivingArea: "",
    endLivingArea: "",
    startPropertyType: "apartment" as "apartment" | "house" | "storage",
    endPropertyType: "apartment" as "apartment" | "house" | "storage",
    startParkingDistance: "",
    endParkingDistance: "",
    
    // Form state
    step: 1,
    
    // Optional fields with default values
    valuationTime: "08:00",
    valuationComment: "",

    // Previous form data
    parkingDistance: "", // Legacy field
    startParkingDistance: "",
    endParkingDistance: "",
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
    valuationComment: "",
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [invalidFields, setInvalidFields] = useState<FormField[]>([])
  const [isClient, setIsClient] = useState(false)

  // Använd en ref för att förhindra uppdateringslooppar
  const isUpdatingRef = useRef(false)

  // Use useEffect to handle client-side initialization
  useEffect(() => {
    setIsClient(true)
    
    // Load saved language preference only on client side
    if (typeof window !== 'undefined') {
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
        console.error('Error accessing localStorage:', error)
      }
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

  const handleChange = (field: FormField, value: string | boolean | string[]) => {
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
  const handleSubmit = async (e: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
    
    const isValid = validateStep4Data(formData);
    if (!isValid) {
      setFormSubmitted(true);
      return;
    }

    try {
      // Förhindra dubbla inskickningar genom att kontrollera om vi redan är i processen
      if (formSubmitted) {
        console.log('Form already submitted, preventing double submission');
        return;
      }

      setFormSubmitted(true);
      
      // Uppdatera bara steget i state istället för att navigera
      setStep(step + 1);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Ett fel uppstod. Försök igen.');
    } finally {
      // Återställ formSubmitted efter en kort fördröjning
      setTimeout(() => {
        setFormSubmitted(false);
      }, 1000);
    }
  };

  const renderStep = () => {
    // Only render content on client-side to avoid hydration mismatch
    if (!isClient) {
      return <div className="min-h-screen bg-sand" />;
    }

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
              handleSubmit={handleSubmit}
              formSubmitted={formSubmitted}
              invalidFields={invalidFields}
              prevStep={prevStep}
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

  // Render a minimal shell until client-side code is ready
  if (!isClient) {
    return (
      <main className="min-h-screen bg-sand">
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center h-full">
                <NordflyttLogo />
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sand">
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
