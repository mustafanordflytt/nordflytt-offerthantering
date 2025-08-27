"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import {
  Package,
  X,
  Star,
  CheckCircle,
  ThumbsUp,
  AlertTriangle,
  Timer,
  Building2,
  Coins,
  Wrench,
  Recycle,
  Shield,
  Server,
  Clock,
  Home,
  Sparkles,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Language, TranslationKey } from "../i18n/translations"

interface Service {
  name: string
  description: string
  icon: React.ReactNode
  price?: string
  isDefault?: boolean
  tooltip?: string
  popular?: boolean
  timeComparison?: string
  benefitText?: string
  order?: number
  riskText?: string
  warningText?: string
  checklistItems?: string[]
  businessValue?: string
  mostPopular?: boolean
}

// Uppdaterade tjänster för företagsflytt
const businessPackingServices: Service[] = [
  {
    name: "Ingen packning",
    description: "Vi hanterar packningen själva",
    icon: <X className="w-6 h-6 text-gray-400" />,
    isDefault: true,
    tooltip: "Ert företag ansvarar själva för att packa och förbereda alla tillhörigheter inför flytten.",
    order: 1,
    riskText: "Att packa själv tar värdefull arbetstid från er personal och ökar risken för skador på utrustning.",
    warningText:
      "Packning av ett kontor tar i genomsnitt 20-30 arbetstimmar och kräver specialkunskap för IT-utrustning.",
    checklistItems: [
      "Tar 20-30 arbetstimmar från er personal",
      "Ökad risk för skador på känslig utrustning",
      "Ni behöver köpa in packmaterial själva",
    ],
  },
  {
    name: "Packning av hela bohag",
    description: "Vi packar hela kontoret",
    icon: <Package className="w-8 h-8" />,
    price: "från 5 500 kr",
    tooltip:
      "Våra experter packar och emballerar hela kontoret inklusive IT-utrustning, dokument och personliga tillhörigheter på ett säkert och effektivt sätt.",
    popular: true,
    mostPopular: true,
    timeComparison: "Sparar i genomsnitt 20-30 arbetstimmar för er personal",
    benefitText: "Minimerar produktionsbortfall och säkerställer affärskontinuitet",
    businessValue: "**Minimerar produktionsbortfall** och **säkerställer affärskontinuitet**",
    order: 2,
    checklistItems: [
      "Sparar 20-30 arbetstimmar för er personal",
      "Professionell hantering av känslig utrustning",
      "Inventarieförteckning och märkning ingår",
    ],
  },
  {
    name: "Skyddsemballering av IT & möbler",
    description: "Vi skyddar er värdefulla utrustning",
    icon: <Shield className="w-8 h-8" />,
    price: "från 3 200 kr",
    tooltip: "Specialemballering av IT-utrustning, servrar, skärmar och känsliga möbler med anpassat skyddsmaterial.",
    timeComparison: "Sparar i genomsnitt 10-15 arbetstimmar för er IT-personal",
    benefitText: "Minimerar risken för skador på värdefull utrustning",
    businessValue: "**Säkerställer** att er **IT-infrastruktur förblir intakt** under flytten",
    order: 3,
    checklistItems: [
      "Specialemballering av servrar och datorer",
      "Skydd för skärmar och känslig elektronik",
      "Dokumentation av kabeldragning",
      "Säker transport av känslig utrustning",
    ],
  },
]

// Uppdaterade städtjänster för företagsflytt
const businessCleaningServices: Service[] = [
  {
    name: "Ingen städning",
    description: "Vi hanterar städningen själva",
    icon: <X className="w-6 h-6 text-gray-400" />,
    isDefault: true,
    tooltip: "Ert företag ansvarar själva för städning av lokalerna efter flytt.",
    order: 1,
    riskText: "Många hyresavtal kräver professionell städning - undvik förseningar och extra kostnader.",
    warningText: "Städning av kontorslokaler tar i genomsnitt 15-20 arbetstimmar och kräver specialutrustning.",
    checklistItems: [
      "Tar 15-20 arbetstimmar från er personal",
      "Risk för underkänd besiktning",
      "Kräver specialutrustning och rengöringsmedel",
    ],
  },
  {
    name: "Avflyttningsstädning",
    description: "Professionell städning av era lokaler",
    icon: <Building2 className="w-8 h-8" />,
    price: "från 4 500 kr",
    tooltip:
      "Omfattande städning enligt branschstandard som uppfyller hyresvärdens krav. Inkluderar rengöring av alla ytor, fönster, toaletter och kök.",
    popular: true,
    mostPopular: true,
    timeComparison: "Sparar i genomsnitt 15-20 arbetstimmar för er personal",
    benefitText: "Godkänd besiktning garanterad",
    businessValue: "**Säkerställer** att ni **uppfyller alla krav** i hyresavtalet",
    order: 2,
    checklistItems: [
      "Godkänd besiktning garanterad",
      "Professionell rengöring av alla ytor",
      "Fönsterputsning ingår",
      "Rengöring av ventilationsdon",
    ],
  },
]

// Nya tjänster för företagsflytt
const additionalBusinessServices: Service[] = [
  {
    name: "Demontering & montering",
    description: "Vi demonterar och monterar era möbler",
    icon: <Wrench className="w-8 h-8" />,
    price: "från 3 800 kr",
    tooltip: "Professionell demontering och återmontering av kontorsmöbler, hyllsystem och arbetsplatser.",
    timeComparison: "Sparar i genomsnitt 15-20 arbetstimmar för er personal",
    benefitText: "Minimerar avbrott i verksamheten",
    businessValue: "**Snabbare återgång** till normal verksamhet efter flytten",
    order: 1,
    checklistItems: [
      "Demontering av alla möbler och inredning",
      "Återmontering på den nya adressen",
      "Alla verktyg och fästmaterial ingår",
      "Erfarna montörer med kontorsvana",
    ],
  },
  {
    name: "Nätverksinstallation & IT-drift",
    description: "Vi säkerställer att er IT fungerar direkt",
    icon: <Server className="w-8 h-8" />,
    price: "från 7 500 kr",
    tooltip: "Installation och konfiguration av nätverk, servrar och arbetsstationer på den nya platsen.",
    timeComparison: "Minimerar driftstopp med upp till 80%",
    benefitText: "Minimalt avbrott i er IT-drift",
    businessValue: "**Säkerställer kontinuitet** i er verksamhet",
    popular: true,
    mostPopular: true,
    order: 2,
    checklistItems: [
      "Installation av nätverk och servrar",
      "Konfiguration av arbetsstationer",
      "Test av alla system före driftsättning",
      "Support under första arbetsdagen",
    ],
  },
  {
    name: "Avfallshantering & återvinning",
    description: "Vi tar hand om det ni inte vill ta med",
    icon: <Recycle className="w-8 h-8" />,
    price: "från 2 900 kr",
    tooltip:
      "Miljövänlig hantering och återvinning av möbler, elektronik och annat material ni inte vill ta med till nya lokaler.",
    timeComparison: "Sparar i genomsnitt 10-15 arbetstimmar för er personal",
    benefitText: "Miljövänlig avfallshantering",
    businessValue: "**Stärker ert miljöarbete** och CSR-profil",
    order: 3,
    checklistItems: [
      "Sortering och återvinning av elektronik",
      "Bortforsling av möbler och inventarier",
      "Miljöcertifierad hantering",
      "Dokumentation för er miljöredovisning",
    ],
  },
]

// Tjänster för privatpersoner
const privatePackingServices: Service[] = [
  {
    name: "Ingen packning",
    description: "Jag packar själv",
    icon: <X className="w-6 h-6 text-gray-400" />,
    isDefault: true,
    tooltip: "Du ansvarar själv för att packa och förbereda alla tillhörigheter inför flytten.",
    order: 1,
    riskText: "Att packa själv tar mycket tid och ökar risken för skador på dina ägodelar.",
    warningText: "Packning av ett hem tar i genomsnitt 15-25 timmar och kräver rätt packmaterial.",
    checklistItems: [
      "Tar 15-25 timmar av din tid",
      "Ökad risk för skador på ömtåliga föremål",
      "Du behöver köpa in packmaterial själv",
    ],
  },
  {
    name: "Packning & emballering",
    description: "Vi packar hela ditt hem",
    icon: <Package className="w-8 h-8" />,
    price: "från 3 500 kr",
    tooltip:
      "Våra experter packar och emballerar hela ditt hem inklusive ömtåliga föremål, kläder och personliga tillhörigheter på ett säkert och effektivt sätt.",
    popular: true,
    mostPopular: true,
    timeComparison: "Sparar i genomsnitt 15-25 timmar av din tid",
    benefitText: "Minimerar stress och säkerställer en smidig flytt",
    order: 2,
    checklistItems: [
      "Sparar 15-25 timmar av din tid",
      "Professionell hantering av ömtåliga föremål",
      "Allt packmaterial ingår",
      "Märkning av lådor ingår",
    ],
  },
  {
    name: "Packning av kök",
    description: "Vi packar ditt kök säkert och effektivt",
    icon: <Package className="w-8 h-8" />,
    price: "från 1 800 kr",
    tooltip: "Professionell packning av köksartiklar, porslin, glas och andra ömtåliga föremål i köket.",
    timeComparison: "Sparar i genomsnitt 5-8 timmar av din tid",
    benefitText: "Minimerar risken för skador på ömtåliga köksföremål",
    order: 3,
    checklistItems: [
      "Säker packning av porslin och glas",
      "Skydd för köksredskap och apparater",
      "Professionellt packmaterial ingår",
      "Märkning av lådor för enkel uppackning",
    ],
  },
]

// Städtjänster för privatpersoner
const privateCleaningServices: Service[] = [
  {
    name: "Ingen städning",
    description: "Jag städar själv",
    icon: <X className="w-6 h-6 text-gray-400" />,
    isDefault: true,
    tooltip: "Du ansvarar själv för städning av bostaden efter flytt.",
    order: 1,
    riskText: "De flesta hyresavtal kräver professionell flyttstädning - undvik förseningar och extra kostnader.",
    warningText: "Flyttstädning tar i genomsnitt 8-12 timmar och kräver specialutrustning.",
    checklistItems: [
      "Tar 8-12 timmar av din tid",
      "Risk för underkänd besiktning",
      "Kräver specialutrustning och rengöringsmedel",
    ],
  },
  {
    name: "Flyttstädning",
    description: "Professionell städning av din bostad",
    icon: <Home className="w-8 h-8" />,
    price: "från 2 500 kr",
    tooltip:
      "Omfattande städning enligt branschstandard som uppfyller hyresvärdens krav. Inkluderar rengöring av alla ytor, fönster, badrum och kök.",
    popular: true,
    mostPopular: true,
    timeComparison: "Sparar i genomsnitt 8-12 timmar av din tid",
    benefitText: "Godkänd besiktning garanterad",
    order: 2,
    checklistItems: [
      "Godkänd besiktning garanterad",
      "Professionell rengöring av alla ytor",
      "Fönsterputsning ingår",
      "Rengöring av vitvaror",
    ],
  },
  {
    name: "Allergistädning",
    description: "Extra grundlig städning för allergiker",
    icon: <Sparkles className="w-8 h-8" />,
    price: "från 3 200 kr",
    tooltip:
      "Specialanpassad städning för allergiker med fokus på att minimera allergener. Inkluderar djuprengöring av ventilation, textilier och svåråtkomliga ytor.",
    timeComparison: "Sparar i genomsnitt 10-15 timmar av din tid",
    benefitText: "Minimerar allergener och förbättrar inomhusmiljön",
    order: 3,
    checklistItems: [
      "Djuprengöring av ventilationsdon",
      "Specialrengöring av textilier",
      "Allergianpassade rengöringsmedel",
      "Extra fokus på dammsamlande ytor",
    ],
  },
]

// Tilläggstjänster för privatpersoner
const additionalPrivateServices: Service[] = [
  {
    name: "Möbelmontering",
    description: "Vi monterar dina möbler i nya hemmet",
    icon: <Wrench className="w-8 h-8" />,
    price: "från 1 500 kr",
    tooltip: "Professionell montering av möbler och inredning i ditt nya hem.",
    timeComparison: "Sparar i genomsnitt 5-8 timmar av din tid",
    benefitText: "Snabbare på plats i ditt nya hem",
    order: 1,
    checklistItems: ["Montering av alla möbler", "Alla verktyg ingår", "Erfarna montörer", "Bortforsling av emballage"],
  },
  {
    name: "Upphängning & installation",
    description: "Vi hänger upp tavlor och installerar lampor",
    icon: <Sparkles className="w-8 h-8" />,
    price: "från 1 200 kr",
    tooltip: "Upphängning av tavlor, speglar, gardiner och installation av lampor och andra tillbehör.",
    timeComparison: "Sparar i genomsnitt 4-6 timmar av din tid",
    benefitText: "Ditt hem blir komplett direkt",
    popular: true,
    mostPopular: true,
    order: 2,
    checklistItems: [
      "Upphängning av tavlor och speglar",
      "Installation av lampor",
      "Uppsättning av gardiner",
      "Montering av TV och hemmabiosystem",
    ],
  },
  {
    name: "Bortforsling & återvinning",
    description: "Vi tar hand om det du inte vill ta med",
    icon: <Recycle className="w-8 h-8" />,
    price: "från 1 800 kr",
    tooltip: "Miljövänlig hantering och återvinning av möbler, elektronik och annat material du inte vill ta med dig.",
    timeComparison: "Sparar i genomsnitt 3-5 timmar av din tid",
    benefitText: "Miljövänlig avfallshantering",
    order: 3,
    checklistItems: [
      "Sortering och återvinning av elektronik",
      "Bortforsling av möbler",
      "Miljöcertifierad hantering",
      "Upp till 3 kubikmeter avfall ingår",
    ],
  },
]

interface Step6Props {
  formData: {
    packingService: string
    cleaningService: string
    additionalBusinessServices?: string[]
    customerType: string
  }
  handleChange: (field: string, value: string) => void
  handleArrayChange?: (field: string, value: string, add: boolean) => void
  nextStep: () => void
  prevStep: () => void
  currentStep?: number
  totalSteps?: number
  isBusinessCustomer?: boolean
  language?: Language
  t?: (key: TranslationKey) => string
}

export default function Step6AdditionalServices({
  formData,
  handleChange,
  handleArrayChange,
  nextStep,
  prevStep,
  currentStep = 6,
  totalSteps = 9,
  isBusinessCustomer,
  language = "sv",
  t,
}: Step6Props) {
  const [hasPaidPackingService, setHasPaidPackingService] = useState(false)
  const [hasPaidCleaningService, setHasPaidCleaningService] = useState(false)
  const [canSelectNoService, setCanSelectNoService] = useState(true)
  const noServiceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedAdditionalService, setSelectedAdditionalService] = useState<string | null>(null)

  // Determine if we're dealing with a business or private customer
  const isBusinessType = formData.customerType === "business" || isBusinessCustomer

  // Select the appropriate services based on customer type
  const packingServices = isBusinessType ? businessPackingServices : privatePackingServices
  const cleaningServices = isBusinessType ? businessCleaningServices : privateCleaningServices
  const additionalServices = isBusinessType ? additionalBusinessServices : additionalPrivateServices

  // First, let's add the useEffect for initializing
  useEffect(() => {
    // Initialize additionalBusinessServices array if it doesn't exist
    if (!formData.additionalBusinessServices || !Array.isArray(formData.additionalBusinessServices)) {
      handleChange("additionalBusinessServices", [])
    }

    // Set initial values for packingService and cleaningService if they are empty
    // Changed: Now we ensure "Ingen packning" and "Ingen städning" are set as defaults
    if (!formData.packingService) {
      // Set to default "Ingen packning" instead of a paid service
      handleChange("packingService", "Ingen packning")
    }

    if (!formData.cleaningService) {
      // Set to default "Ingen städning" instead of a paid service
      handleChange("cleaningService", "Ingen städning")
    }

    // Check if user has selected paid services
    setHasPaidPackingService(formData.packingService !== "Ingen packning")
    setHasPaidCleaningService(formData.cleaningService !== "Ingen städning")

    // Add a small delay before allowing selection of "no service" options
    setCanSelectNoService(false)
    noServiceTimeoutRef.current = setTimeout(() => {
      setCanSelectNoService(true)
    }, 1000)

    return () => {
      if (noServiceTimeoutRef.current) {
        clearTimeout(noServiceTimeoutRef.current)
      }
    }
  }, [formData, handleChange])

  // Now let's define the service colors at the top of the component, after the state declarations:
  const serviceColors = {
    // Business colors
    "Demontering & montering": {
      bg: "bg-[#4CAF50]/10",
      text: "text-[#4CAF50]",
      border: "border-[#4CAF50]",
      hover: "hover:bg-[#4CAF50]/5",
    },
    "Nätverksinstallation & IT-drift": {
      bg: "bg-[#2196F3]/10",
      text: "text-[#2196F3]",
      border: "border-[#2196F3]",
      hover: "hover:bg-[#2196F3]/5",
    },
    "Avfallshantering & återvinning": {
      bg: "bg-[#FF9800]/10",
      text: "text-[#FF9800]",
      border: "border-[#FF9800]",
      hover: "hover:bg-[#FF9800]/5",
    },
    // Private colors
    Möbelmontering: {
      bg: "bg-[#4CAF50]/10",
      text: "text-[#4CAF50]",
      border: "border-[#4CAF50]",
      hover: "hover:bg-[#4CAF50]/5",
    },
    "Upphängning & installation": {
      bg: "bg-[#2196F3]/10",
      text: "text-[#2196F3]",
      border: "border-[#2196F3]",
      hover: "hover:bg-[#2196F3]/5",
    },
    "Bortforsling & återvinning": {
      bg: "bg-[#FF9800]/10",
      text: "text-[#FF9800]",
      border: "border-[#FF9800]",
      hover: "hover:bg-[#FF9800]/5",
    },
  }

  // Helper function to check if additional service is selected
  const isAdditionalServiceSelected = (serviceName: string): boolean => {
    if (Array.isArray(formData.additionalBusinessServices)) {
      return formData.additionalBusinessServices.includes(serviceName)
    } else if (typeof formData.additionalBusinessServices === 'string' && formData.additionalBusinessServices) {
      const services = formData.additionalBusinessServices.split(',').filter(s => s.trim())
      return services.includes(serviceName)
    }
    return false
  }

  // Sort services by order
  const sortedPackingServices = [...packingServices].sort((a, b) => (a.order || 0) - (b.order || 0))
  const sortedCleaningServices = [...cleaningServices].sort((a, b) => (a.order || 0) - (b.order || 0))
  const additionalServicesSorted = [...additionalServices].sort((a, b) => (a.order || 0) - (b.order || 0))

  // Also update the handleServiceSelection function to include the same animation for packing and cleaning services
  const handleServiceSelection = (e: React.MouseEvent, field: string, value: string) => {
    // Prevent default behavior
    e.preventDefault()
    e.stopPropagation()

    // If trying to select "no service" option but the delay hasn't finished, don't allow it
    if (!canSelectNoService && (value === "Ingen packning" || value === "Ingen städning")) {
      return
    }

    // Get the current value to check if we're selecting or deselecting
    const currentValue = (formData as any)[field]
    const isSelecting = currentValue !== value && value !== "Ingen packning" && value !== "Ingen städning"

    handleChange(field, value)

    if (field === "packingService") {
      setHasPaidPackingService(value !== "Ingen packning")
    } else if (field === "cleaningService") {
      setHasPaidCleaningService(value !== "Ingen städning")
    }

    // If selecting a paid service (not "Ingen..."), show the animation
    if (isSelecting) {
      // Find the card element that was clicked
      const cardElement = e.currentTarget as HTMLElement

      // Create and append the animated checkmark
      const checkmark = document.createElement("div")
      checkmark.className = "animated-checkmark"
      cardElement.appendChild(checkmark)

      // Remove the checkmark after animation completes
      setTimeout(() => {
        if (cardElement.contains(checkmark)) {
          cardElement.removeChild(checkmark)
        }
      }, 1500)
    }
  }

  // Fix handleAdditionalServiceSelection to properly update formData and prevent scrolling
  const handleAdditionalServiceSelection = (e: React.MouseEvent, serviceName: string) => {
    // Prevent default behavior
    e.preventDefault()
    e.stopPropagation()

    // Ensure we have an array to work with - handle both array and string cases
    let currentServices: string[] = []
    if (Array.isArray(formData.additionalBusinessServices)) {
      currentServices = formData.additionalBusinessServices
    } else if (typeof formData.additionalBusinessServices === 'string' && formData.additionalBusinessServices) {
      currentServices = formData.additionalBusinessServices.split(',').filter(s => s.trim())
    }
    
    const isSelected = currentServices.includes(serviceName)

    // Create new array with or without the service
    const newServices = isSelected
      ? currentServices.filter((service) => service !== serviceName)
      : [...currentServices, serviceName]

    // Update parent formData - always pass as array
    handleChange("additionalBusinessServices", newServices)

    // Set the selected service for feedback message
    setSelectedAdditionalService(isSelected ? null : serviceName)

    // If selecting (not deselecting), show the animation
    if (!isSelected) {
      // Find the card element that was clicked
      const cardElement = e.currentTarget as HTMLElement

      // Create and append the animated checkmark
      const checkmark = document.createElement("div")
      checkmark.className = "animated-checkmark"
      cardElement.appendChild(checkmark)

      // Remove the checkmark after animation completes
      setTimeout(() => {
        if (cardElement.contains(checkmark)) {
          cardElement.removeChild(checkmark)
        }
      }, 1500)
    }
  }

  // Get the icon for a service
  const getServiceIcon = (serviceName: string) => {
    const allServices = [...packingServices, ...cleaningServices, ...additionalServices]
    const service = allServices.find((s) => s.name === serviceName)
    return service?.icon || <CheckCircle className="w-4 h-4" />
  }

  // Helper function to render business value with bold parts
  const renderBusinessValue = (value: string) => {
    if (!value) return null

    return value.split("**").map((part, i) => (i % 2 === 0 ? part : <strong key={i}>{part}</strong>))
  }

  // Get appropriate title and description based on customer type
  const getTitle = () => {
    return isBusinessType ? "Tilläggstjänster för en smidig kontorsflytt" : "Tilläggstjänster för en smidig flytt"
  }

  const getSocialProofText = () => {
    return isBusinessType ? "Rekommenderas av ledande fastighetsägare" : "Rekommenderas av tusentals nöjda kunder"
  }

  const getSubText = () => {
    return isBusinessType ? "Pålitligt val för Balder och 500+ företagskunder" : "Över 4.8/5 i kundbetyg på Google"
  }

  const getAlertText = () => {
    return isBusinessType
      ? "Våra tilläggstjänster minimerar produktionsbortfall och säkerställer en smidig övergång till era nya lokaler. De flesta företagskunder väljer minst två av våra tjänster."
      : "Våra tilläggstjänster gör din flytt smidigare och sparar värdefull tid. De flesta kunder väljer minst en av våra tjänster."
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#0A2540]">{getTitle()}</h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
          Steg {currentStep} av {totalSteps}
        </div>
      </div>

      {/* Compact Social Proof Banner */}
      <div className="mb-6 p-4 bg-[#EAF2FF] rounded-md border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ska%CC%88rmavbild%202025-03-10%20kl.%2000.03.18-oEKEx4pA0Tp41heFr7k7o4C10FYeuL.png"
              alt="Balder"
              className="w-12 h-12 object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-[#0A2540]">{getSocialProofText()}</p>
              <p className="text-xs text-[#0052CC]">{getSubText()}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm font-bold text-gray-800">4.8/5</span>
          </div>
        </div>
      </div>

      <Alert className="mb-8 bg-[#EAF2FF] border-blue-200 shadow-sm">
        <Timer className="h-4 w-4 text-[#0052CC]" />
        <AlertDescription className="text-[#0A2540] font-medium">{getAlertText()}</AlertDescription>
      </Alert>

      {/* Packning & emballering */}
      <div className="bg-[#F8F9FB] p-8 rounded-md mb-12 shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-[#0A2540]">Packning & emballering</h3>
        <p className="mb-6 text-gray-600">
          {isBusinessType
            ? "Välj hur ni vill hantera packning och emballering av kontoret"
            : "Välj hur du vill hantera packning och emballering av ditt hem"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-8 pt-4">
          {sortedPackingServices.map((service) => (
            <TooltipProvider key={service.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="sm:col-span-4 relative">
                    <Card
                      className={`cursor-pointer transition-all ${
                        service.isDefault
                          ? "bg-gray-100 hover:bg-gray-200 opacity-75 not-recommended-card"
                          : "hover:shadow-md transform hover:scale-[1.02]"
                      } ${
                        formData.packingService === service.name
                          ? service.isDefault
                            ? "border border-gray-300"
                            : "border-2 border-[#0052CC] shadow-md"
                          : service.isDefault
                            ? "border border-gray-200"
                            : "border border-gray-300"
                      } ${!service.isDefault ? "bg-white" : ""}`}
                      style={{ minHeight: "380px", borderRadius: "4px" }}
                      onClick={(e) => {
                        handleServiceSelection(e, "packingService", service.name)
                      }}
                    >
                      {service.isDefault && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-md border border-amber-200 whitespace-nowrap z-20 shadow-sm">
                          <AlertTriangle className="w-3 h-3 inline-block mr-1" />
                          Mindre fördelaktigt val
                        </div>
                      )}

                      {!service.isDefault && service.mostPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#8A2BE2] text-white text-[10px] font-medium py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-sm">
                          <Star className="w-2.5 h-2.5 mr-1 inline-block" /> Rekommenderas
                        </div>
                      )}

                    <div
                      className={`flex flex-col items-center justify-between text-center p-4 sm:p-5 space-y-3 h-full w-full card-content`}
                    >
                      <div
                        className={`w-14 h-14 flex items-center justify-center rounded-full mb-2 ${
                          service.isDefault ? "bg-gray-300 text-gray-500" : "bg-[#0052CC]/10 text-[#0052CC]"
                        }`}
                      >
                        {service.icon}
                      </div>
                      <h4 className={`text-lg font-bold ${service.isDefault ? "text-gray-500" : "text-[#0A2540]"}`}>
                        {service.name}
                      </h4>
                      <p
                        className={`text-sm ${service.isDefault ? "text-gray-400" : "text-gray-600"} leading-relaxed mb-2 w-[90%] mx-auto break-words line-height-[1.5]`}
                      >
                        {service.description}
                      </p>

                      {service.price && <p className="text-base font-bold text-[#0052CC] mt-4 mb-2">{service.price}</p>}

                      {service.popular && (
                        <Badge className="absolute top-0 right-0 translate-x-1 -translate-y-1 mt-[-2px] bg-[#0052CC] shadow-md z-10 rounded-sm">
                          <Star className="w-3 h-3 mr-1" /> Mest valt
                        </Badge>
                      )}

                      {service.businessValue && !service.isDefault && (
                        <div
                          className="mt-2 p-3 bg-[#EAF2FF] rounded-md w-full shadow-sm"
                          style={{ minHeight: "70px" }}
                        >
                          <div className="flex items-start text-xs text-[#0052CC]">
                            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-[#0052CC]" />
                            <div className="flex-1 text-left leading-relaxed">
                              <strong className="block mb-1 text-[#0A2540]">
                                {isBusinessType ? "Affärsvärde:" : "Fördelar:"}
                              </strong>
                              <span className="font-medium">{renderBusinessValue(service.businessValue)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {service.checklistItems && (
                        <ul
                          className={`w-full mt-3 text-left text-xs space-y-3 ${
                            service.isDefault ? "text-gray-500" : "text-gray-700"
                          }`}
                        >
                          {service.checklistItems.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-5 flex-shrink-0 text-center">
                                {item.includes("Tar") ||
                                item.includes("Ökad") ||
                                item.includes("Ni behöver") ||
                                item.includes("Du behöver") ||
                                item.includes("Risk") ||
                                item.includes("Kräver") ? (
                                  <span className="text-red-500">❌</span>
                                ) : (
                                  <span className="text-[#0052CC]">✓</span>
                                )}
                              </span>
                              <span className="flex-1 leading-relaxed break-words">
                                {item.includes("Sparar") ||
                                item.includes("Professionell") ||
                                item.includes("Minimerar") ||
                                item.includes("Säker packning") ||
                                item.includes("Skydd för") ||
                                item.includes("Allt packmaterial") ||
                                item.includes("Märkning av") ||
                                item.includes("Godkänd besiktning") ||
                                item.includes("Fönsterputsning") ||
                                item.includes("Rengöring av") ? (
                                  <strong>{item}</strong>
                                ) : (
                                  item
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs z-50 tooltip-content bg-[#0A2540] text-white p-3 rounded-md"
                >
                  {service.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Enhanced warning messages */}
        {formData.packingService === "Ingen packning" ? (
          <div className="flex items-start p-4 bg-amber-50 rounded-md border border-amber-200 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">
                {isBusinessType
                  ? "Visste du att 85% av våra företagskunder väljer professionell packning?"
                  : "Visste du att 75% av våra kunder väljer professionell packning?"}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {isBusinessType
                  ? "Att packa ett kontor själv tar i genomsnitt 20-30 arbetstimmar från er personal och ökar risken för skador på värdefull utrustning. Låt våra experter hantera det för minimal störning i er verksamhet."
                  : "Att packa ett hem själv tar i genomsnitt 15-25 timmar och ökar risken för skador på värdefulla ägodelar. Låt våra experter hantera det för en stressfri flytt."}
              </p>
            </div>
          </div>
        ) : formData.packingService !== "" && formData.packingService !== "Ingen packning" ? (
          <div className="flex items-start p-4 bg-green-50 rounded-md border border-green-200 shadow-sm">
            <CheckCircle className="w-5 h-5 text-[#0052CC] mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#0052CC]">
                {isBusinessType
                  ? "Smart val! Ni minimerar produktionsbortfall och säkerställer en smidig övergång."
                  : "Smart val! Du sparar tid och säkerställer en smidig flytt."}
              </p>
              <p className="text-xs text-[#0052CC] mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {isBusinessType
                  ? "Ni har valt samma som 85% av våra företagskunder och sparar i genomsnitt 25 timmar per anställd!"
                  : "Du har valt samma som 75% av våra kunder och sparar i genomsnitt 20 timmar!"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-[#F8F9FB] p-8 rounded-md mb-12 shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-[#0A2540]">Städning</h3>
        <p className="mb-6 text-gray-600">
          {isBusinessType
            ? "Välj hur ni vill hantera städning av era lokaler"
            : "Välj hur du vill hantera städning av din bostad"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pt-4">
          {sortedCleaningServices.map((service) => (
            <TooltipProvider key={service.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Card
                      className={`cursor-pointer transition-all ${
                        service.isDefault
                          ? "bg-gray-100 hover:bg-gray-200 opacity-75 not-recommended-card"
                          : "hover:shadow-md transform hover:scale-[1.02]"
                      } ${
                        formData.cleaningService === service.name
                          ? service.isDefault
                            ? "border border-gray-300"
                            : "border-2 border-[#0052CC] shadow-md"
                          : service.isDefault
                            ? "border border-gray-200"
                            : "border border-gray-300"
                      } ${!service.isDefault ? "bg-white" : ""}`}
                      style={{ minHeight: "380px", borderRadius: "4px" }}
                      onClick={(e) => {
                        handleServiceSelection(e, "cleaningService", service.name)
                      }}
                    >
                      {service.isDefault && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-md border border-amber-200 whitespace-nowrap z-20 shadow-sm">
                          <AlertTriangle className="w-3 h-3 inline-block mr-1" />
                          Mindre fördelaktigt val
                        </div>
                      )}

                      {!service.isDefault && service.mostPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0052CC] text-white text-[10px] font-medium py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-sm">
                          {isBusinessType ? (
                            <>
                              <Building2 className="w-2.5 h-2.5 mr-1 inline-block" /> Krav i de flesta hyresavtal
                            </>
                          ) : (
                            <>
                              <Home className="w-2.5 h-2.5 mr-1 inline-block" /> Krav i de flesta hyresavtal
                            </>
                          )}
                        </div>
                      )}

                    <div
                      className={`flex flex-col items-center justify-between text-center p-4 sm:p-5 space-y-3 h-full w-full card-content`}
                    >
                      <div
                        className={`w-14 h-14 flex items-center justify-center rounded-full mb-2 ${
                          service.isDefault ? "bg-gray-300 text-gray-500" : "bg-[#0052CC]/10 text-[#0052CC]"
                        }`}
                      >
                        {service.icon}
                      </div>
                      <h4 className={`text-lg font-bold ${service.isDefault ? "text-gray-500" : "text-[#0A2540]"}`}>
                        {service.name}
                      </h4>
                      <p
                        className={`text-sm ${service.isDefault ? "text-gray-400" : "text-gray-600"} leading-relaxed mb-2 w-[90%] mx-auto break-words line-height-[1.5]`}
                      >
                        {service.description}
                      </p>

                      {service.price && <p className="text-base font-bold text-[#0052CC] mt-4 mb-2">{service.price}</p>}

                      {service.popular && (
                        <Badge className="absolute top-0 right-0 translate-x-1 -translate-y-1 mt-[-2px] bg-[#0052CC] shadow-md z-10 rounded-sm">
                          <Star className="w-3 h-3 mr-1" /> Mest valt
                        </Badge>
                      )}

                      {service.businessValue && !service.isDefault && (
                        <div
                          className="mt-2 p-3 bg-[#EAF2FF] rounded-md w-full shadow-sm"
                          style={{ minHeight: "70px" }}
                        >
                          <div className="flex items-start text-xs text-[#0052CC]">
                            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-[#0052CC]" />
                            <div className="flex-1 text-left leading-relaxed">
                              <strong className="block mb-1 text-[#0A2540]">
                                {isBusinessType ? "Affärsvärde:" : "Fördelar:"}
                              </strong>
                              <span className="font-medium">{renderBusinessValue(service.businessValue)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#0052CC] mt-2">
                            <strong>Undvik förseningar och extra kostnader med en professionell städning</strong>
                          </p>
                        </div>
                      )}

                      {service.checklistItems && (
                        <ul
                          className={`w-full mt-3 text-left text-xs space-y-3 ${
                            service.isDefault ? "text-gray-500" : "text-gray-700"
                          }`}
                        >
                          {service.checklistItems.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-5 flex-shrink-0 text-center">
                                {item.includes("Tar") || item.includes("Risk") || item.includes("Kräver") ? (
                                  <span className="text-red-500">❌</span>
                                ) : (
                                  <span className="text-[#0052CC]">✓</span>
                                )}
                              </span>
                              <span className="flex-1 leading-relaxed break-words">
                                {item.includes("Godkänd") ||
                                item.includes("Professionell") ||
                                item.includes("Sparar") ||
                                item.includes("Djuprengöring") ||
                                item.includes("Specialrengöring") ||
                                item.includes("Allergianpassade") ||
                                item.includes("Extra fokus") ? (
                                  <strong>{item}</strong>
                                ) : (
                                  item
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs z-50 tooltip-content bg-[#0A2540] text-white p-3 rounded-md"
                >
                  {service.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {formData.cleaningService === "Ingen städning" ? (
          <div className="flex items-start p-4 bg-amber-50 rounded-md border border-amber-200 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 leading-relaxed">
                {isBusinessType
                  ? "Visste du att 90% av våra företagskunder väljer professionell städning?"
                  : "Visste du att 85% av våra kunder väljer professionell städning?"}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>
                  {isBusinessType
                    ? "Avflyttningsstädning är ett krav i de flesta hyresavtal"
                    : "Flyttstädning är ett krav i de flesta hyresavtal"}
                </strong>{" "}
                och tar i genomsnitt {isBusinessType ? "15-20 arbetstimmar" : "8-12 timmar"}. Undvik förseningar och
                extra kostnader med vår professionella städtjänst.
              </p>
            </div>
          </div>
        ) : formData.cleaningService !== "" && formData.cleaningService !== "Ingen städning" ? (
          <div className="flex items-start p-4 bg-green-50 rounded-md border border-green-200 shadow-sm">
            <CheckCircle className="w-5 h-5 text-[#0052CC] mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#0052CC]">
                {isBusinessType
                  ? "Smart val! Ni säkerställer en godkänd besiktning och smidig överlämning av lokalerna."
                  : "Smart val! Du säkerställer en godkänd besiktning och smidig överlämning av bostaden."}
              </p>
              <p className="text-xs text-[#0052CC] mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {isBusinessType
                  ? "Ni har valt samma som 90% av våra företagskunder och undviker förseningar vid överlämning!"
                  : "Du har valt samma som 85% av våra kunder och undviker förseningar vid överlämning!"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Ytterligare tjänster */}
      <div className="bg-[#F8F9FB] p-8 rounded-md mb-12 shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-[#0A2540]">Ytterligare tjänster</h3>
        <p className="mb-6 text-gray-600">
          {isBusinessType
            ? "Välj ytterligare tjänster för en smidigare kontorsflytt"
            : "Välj ytterligare tjänster för en smidigare flytt"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Add this to the additionalBusinessServices mapping */}
          {additionalServicesSorted.map((service) => {
            return (
              <TooltipProvider key={service.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={`cursor-pointer transition-all relative hover:shadow-md transform hover:scale-[1.02] ${
                        isAdditionalServiceSelected(service.name)
                          ? `border-2 border-[#0052CC] shadow-md`
                          : "border border-gray-300"
                      } bg-white`}
                      style={{ minHeight: "400px", borderRadius: "4px" }}
                      onClick={(e) => {
                        handleAdditionalServiceSelection(e, service.name)
                      }}
                    >
                      {service.mostPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 mb-1 bg-[#8A2BE2] text-white text-[10px] font-medium py-1 px-2 rounded-md whitespace-nowrap z-20 shadow-sm">
                          <Star className="w-2.5 h-2.5 mr-1 inline-block" /> Rekommenderas
                        </div>
                      )}

                      <div className="flex flex-col items-center justify-between text-center p-4 sm:p-5 space-y-3 h-full w-full card-content">
                        <div
                          className={`w-14 h-14 flex items-center justify-center rounded-full mb-2 ${
                            (serviceColors as any)[service.name]?.bg || "bg-[#0052CC]/10"
                          } ${(serviceColors as any)[service.name]?.text || "text-[#0052CC]"}`}
                        >
                          {service.icon}
                        </div>
                        <h4 className="text-lg font-bold text-[#0A2540]">{service.name}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed mb-2 w-[90%] mx-auto break-words line-height-[1.5]">
                          {service.description}
                        </p>

                        {service.price && (
                          <p className="text-base font-bold text-[#0052CC] mt-4 mb-2">{service.price}</p>
                        )}

                        {service.popular && (
                          <Badge className="absolute top-0 right-0 translate-x-1 -translate-y-1 mt-[-2px] bg-[#0052CC] shadow-md z-10 rounded-sm">
                            <Star className="w-3 h-3 mr-1" /> Mest valt
                          </Badge>
                        )}

                        {service.businessValue && (
                          <div
                            className="mt-2 p-3 bg-[#EAF2FF] rounded-md w-full shadow-sm"
                            style={{ minHeight: "70px" }}
                          >
                            <div className="flex items-start text-xs text-[#0052CC]">
                              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-[#0052CC]" />
                              <div className="flex-1 text-left leading-relaxed">
                                <strong className="block mb-1 text-[#0A2540]">
                                  {isBusinessType ? "Affärsvärde:" : "Fördelar:"}
                                </strong>
                                <span className="font-medium">{renderBusinessValue(service.businessValue)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {service.checklistItems && (
                          <ul className="w-full mt-3 text-left text-xs space-y-3 text-gray-700">
                            {service.checklistItems.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-5 flex-shrink-0 text-center">
                                  <span className={(serviceColors as any)[service.name]?.text || "text-[#0052CC]"}>✓</span>
                                </span>
                                <span className="flex-1 leading-relaxed break-words">
                                  {item.includes("Installation") ||
                                  item.includes("Montering") ||
                                  item.includes("Demontering") ||
                                  item.includes("Miljöcertifierad") ||
                                  item.includes("Test av alla system") ||
                                  item.includes("Support under första") ||
                                  item.includes("Dokumentation för") ||
                                  item.includes("Upphängning") ||
                                  item.includes("Sortering") ||
                                  item.includes("Bortforsling") ||
                                  item.includes("Upp till 3 kubikmeter") ||
                                  item.includes("Alla verktyg") ||
                                  item.includes("Erfarna montörer") ? (
                                    <strong>{item}</strong>
                                  ) : (
                                    item
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div
                          className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                            isAdditionalServiceSelected(service.name)
                              ? "bg-[#0052CC] text-white shadow-sm hover:bg-[#003D99]"
                              : "bg-white text-[#0052CC] border border-[#0052CC] hover:bg-[#EAF2FF]"
                          }`}
                          onClick={(e) => {
                            handleAdditionalServiceSelection(e, service.name)
                          }}
                        >
                          {isAdditionalServiceSelected(service.name)
                            ? "Tjänst vald ✓"
                            : "Välj denna tjänst"}
                        </div>
                      </div>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs z-50 tooltip-content bg-[#0A2540] text-white p-3 rounded-md"
                  >
                    {service.tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
        {selectedAdditionalService && (
          <div className="flex items-start p-4 bg-green-50 rounded-md border border-green-200 shadow-sm mt-4">
            <CheckCircle className="w-5 h-5 text-[#0052CC] mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#0052CC]">
                Smart val!{" "}
                {isBusinessType ? (
                  <>
                    {selectedAdditionalService === "Demontering & montering" &&
                      "Ni säkerställer en snabb återgång till normal verksamhet efter flytten."}
                    {selectedAdditionalService === "Nätverksinstallation & IT-drift" &&
                      "Ni minimerar driftstopp och säkerställer kontinuitet i er verksamhet."}
                    {selectedAdditionalService === "Avfallshantering & återvinning" &&
                      "Ni stärker ert miljöarbete och CSR-profil med professionell avfallshantering."}
                  </>
                ) : (
                  <>
                    {selectedAdditionalService === "Möbelmontering" &&
                      "Du säkerställer en snabb och smidig inflyttning i ditt nya hem."}
                    {selectedAdditionalService === "Upphängning & installation" &&
                      "Du får ett komplett hem direkt efter flytten utan att behöva göra jobbet själv."}
                    {selectedAdditionalService === "Bortforsling & återvinning" &&
                      "Du slipper hantera avfall och bidrar till en hållbar miljö."}
                  </>
                )}
              </p>
              <p className="text-xs text-[#0052CC] mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {isBusinessType ? (
                  <>
                    {selectedAdditionalService === "Demontering & montering" &&
                      "Ni sparar i genomsnitt 15-20 arbetstimmar för er personal!"}
                    {selectedAdditionalService === "Nätverksinstallation & IT-drift" &&
                      "Ni minimerar driftstopp med upp till 80% jämfört med egen installation!"}
                    {selectedAdditionalService === "Avfallshantering & återvinning" &&
                      "Ni sparar i genomsnitt 10-15 arbetstimmar och bidrar till en hållbar miljö!"}
                  </>
                ) : (
                  <>
                    {selectedAdditionalService === "Möbelmontering" &&
                      "Du sparar i genomsnitt 5-8 timmar och slipper stressa med monteringen!"}
                    {selectedAdditionalService === "Upphängning & installation" &&
                      "Du sparar i genomsnitt 4-6 timmar och får ett komplett hem direkt!"}
                    {selectedAdditionalService === "Bortforsling & återvinning" &&
                      "Du sparar i genomsnitt 3-5 timmar och bidrar till en hållbar miljö!"}
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced CTA section */}
      <div className="p-6 rounded-md mb-8 bg-[#EAF2FF] border-2 border-[#0052CC]/30 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-xl font-bold text-[#0A2540] mb-3">Valda tjänster</h3>
            <ul className="mt-2 text-sm space-y-2">
              <li className="flex items-center">
                <div className="w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center">
                  {hasPaidPackingService ? (
                    getServiceIcon(formData.packingService)
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="font-medium mr-2">Packning:</span>
                <span className={hasPaidPackingService ? "text-[#0052CC] font-medium" : "text-gray-600"}>
                  {formData.packingService}
                </span>
                {hasPaidPackingService && <CheckCircle className="w-4 h-4 text-[#0052CC] ml-2" />}
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center">
                  {hasPaidCleaningService ? (
                    getServiceIcon(formData.cleaningService)
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="font-medium mr-2">Städning:</span>
                <span className={hasPaidCleaningService ? "text-[#0052CC] font-medium" : "text-gray-600"}>
                  {formData.cleaningService}
                </span>
                {hasPaidCleaningService && <CheckCircle className="w-4 h-4 text-[#0052CC] ml-2" />}
              </li>
              {formData.additionalBusinessServices && formData.additionalBusinessServices.length > 0 && (
                <li className="flex items-start">
                  <div className="w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-4 h-4 text-[#0052CC]" />
                  </div>
                  <span className="font-medium mr-2">Ytterligare:</span>
                  <div className="flex flex-col">
                    {formData.additionalBusinessServices.map((service, index) => (
                      <span key={index} className="text-[#0052CC] font-medium flex items-center mb-1">
                        {service} <CheckCircle className="w-4 h-4 text-[#0052CC] ml-2" />
                      </span>
                    ))}
                  </div>
                </li>
              )}
            </ul>

            {(hasPaidPackingService ||
              hasPaidCleaningService ||
              (formData.additionalBusinessServices && formData.additionalBusinessServices.length > 0)) && (
              <p className="text-sm text-[#0052CC] mt-3 flex items-center">
                <ThumbsUp className="w-4 h-4 mr-1" />
                <strong>
                  {isBusinessType
                    ? "Ni minimerar produktionsbortfall med era val!"
                    : "Du sparar värdefull tid med dina val!"}
                </strong>
              </p>
            )}

            {hasPaidPackingService && hasPaidCleaningService && (
              <p className="text-sm font-bold text-[#0052CC] mt-2 flex items-center">
                <Coins className="w-4 h-4 mr-1" />
                {isBusinessType ? "Företagsrabatt: 10% på totalpriset!" : "Kombinationsrabatt: 10% på totalpriset!"}
              </p>
            )}
          </div>
          <button
            onClick={nextStep}
            className="bg-[#0052CC] hover:bg-[#003D99] text-white font-bold py-3.5 px-8 rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border-b-4 border-[#003D99] hover:border-[#002D79]"
          >
            {isBusinessType ? "Säkra era val & fortsätt →" : "Säkra dina val & fortsätt →"}
          </button>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={prevStep} className="back-button">
          Tillbaka
        </button>
      </div>
      <style jsx>{`
        .animated-checkmark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: rgba(0, 82, 204, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 3em;
          animation: checkmark-animation 1.5s ease-in-out forwards;
          z-index: 100;
        }

        .animated-checkmark::before {
          content: '✓';
        }

        @keyframes checkmark-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
