"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Home,
  Square,
  Wind,
  StepBackIcon as Stairs,
  Check,
  Sparkles,
  Key,
  KeyRound,
  PenLine,
  X,
  Calendar,
  Repeat,
  ArrowLeft,
  Maximize2,
  Droplets,
  Brush,
  Info,
  MapPin,
  Star,
  Shield,
  Clock,
  CheckCircle,
  ThumbsUp,
  Users,
  BadgeCheck,
  CalendarDays,
  Building,
  DoorOpen,
  ArrowUp,
  Truck,
  AlignJustify,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CleaningFormProps {
  formData: {
    address: string
    size: string
    hasBalcony: boolean
    additionalAreas: string[]
    wasteRemoval: boolean
    condition: "normal" | "deep"
    hasUtilities: boolean
    keyHandover: "onsite" | "advance" | "other"
    keyHandoverNote: string
    additionalNotes: string
    cleaningType?: "moving" | "home" | "windows"
    cleaningFrequency?: "once" | "weekly" | "biweekly" | "monthly"
    specificAreas?: string[]
    hasPets?: boolean
    hasKeyAccess?: boolean
    windowCount?: string
    windowTypes?: string[]
    windowSides?: string
    windowHeight?: string
    windowExtras?: string[]
    windowKeyAccess?: string
    windowRecurring?: boolean
    windowFrequency?: string
    windowDuration?: "1month" | "3months" | "6months" | "ongoing"
    serviceTypes?: string[]
    timePreference?: string
    moveOutDate?: string
    propertyType?: "apartment" | "house" | "villa" | "other"
    propertySize?: string
    hasStairs?: boolean
    hasGarage?: boolean
    inspectionDate?: string
    inspectionTime?: string
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
}

export default function CleaningForm({ formData, handleChange, nextStep, prevStep }: CleaningFormProps) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(formData.additionalAreas || [])
  const [selectedSpecificAreas, setSelectedSpecificAreas] = useState<string[]>(formData.specificAreas || [])
  // Uppdatera state-variabler och lägg till en ny för att hålla reda på det aktuella steget
  const [currentStep, setCurrentStep] = useState(1)
  const [showServiceSelection, setShowServiceSelection] = useState(true)
  const [cleaningType, setCleaningType] = useState<"moving" | "home" | "windows">(formData.cleaningType || "home")
  const [windowRecurring, setWindowRecurring] = useState<boolean>(formData.windowRecurring || false)
  const [selectedServices, setSelectedServices] = useState<string[]>(formData.serviceTypes || [])
  const [showWindowCleaningPopup, setShowWindowCleaningPopup] = useState(false)

  const [timePreference, setTimePreference] = useState<string>(formData.timePreference || "")
  const [addressFocused, setAddressFocused] = useState(false)
  const [moveOutDateFocused, setMoveOutDateFocused] = useState(false)
  const [inspectionDateFocused, setInspectionDateFocused] = useState(false)

  // Time preference options
  const timePreferenceOptions = [
    {
      id: "morning",
      icon: <Clock className="w-6 h-6" />,
      label: "Morgon",
      description: "08:00 - 12:00",
      popular: false,
    },
    {
      id: "afternoon",
      icon: <Clock className="w-6 h-6" />,
      label: "Eftermiddag",
      description: "12:00 - 17:00",
      popular: true,
    },
    {
      id: "flexible",
      icon: <Clock className="w-6 h-6" />,
      label: "Flexibelt",
      description: "När som helst under dagen",
      popular: false,
    },
  ]

  const [formStep, setFormStep] = useState(1)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const totalSteps = cleaningType === "moving" ? 3 : cleaningType === "home" ? 2 : 2

  useEffect(() => {
    // Set default size if none is selected
    if (!formData.size) {
      handleChange("size", "50-80")
    }

    // Set default windowSides to "both" if not already set
    if (cleaningType === "windows" && !formData.windowSides) {
      handleChange("windowSides", "both")
    }
  }, [formData.size, cleaningType, formData.windowSides, handleChange])

  const selectCleaningType = (type: "moving" | "home" | "windows") => {
    setCleaningType(type)
    handleChange("cleaningType", type)
  }

  // Uppdatera handleSubmit funktionen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1 && cleaningType) {
      setCurrentStep(2)
      setShowServiceSelection(false)
    } else if (currentStep === 2) {
      // Här kan du lägga till validering av formuläret om det behövs
      nextStep() // Detta tar användaren till offert-sidan (Steg 3)
    }
  }

  // Lägg till en funktion för att hantera "Tillbaka"-knappen
  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
      setShowServiceSelection(true)
    } else {
      prevStep()
    }
  }

  const backToServiceSelection = () => {
    setShowServiceSelection(true)
    setCleaningType("home")
    handleChange("cleaningType", "home")
  }

  // Custom window icons for inside/outside options
  const WindowOutsideIcon = () => (
    <div className="relative w-5 h-5">
      <Square className="w-5 h-5" />
      <div className="absolute inset-0 flex items-center justify-end pr-0.5">
        <div className="w-1.5 h-3 bg-current rounded-sm" />
      </div>
    </div>
  )

  const WindowInsideIcon = () => (
    <div className="relative w-5 h-5">
      <Square className="w-5 h-5" />
      <div className="absolute inset-0 flex items-center justify-start pl-0.5">
        <div className="w-1.5 h-3 bg-current rounded-sm" />
      </div>
    </div>
  )

  const WindowBothSidesIcon = () => (
    <div className="relative w-5 h-5">
      <Square className="w-5 h-5" />
      <div className="absolute inset-0 flex items-center justify-between px-0.5">
        <div className="w-1.5 h-3 bg-current rounded-sm" />
        <div className="w-1.5 h-3 bg-current rounded-sm" />
      </div>
    </div>
  )

  // ... rest of the component code ...

  const toggleArea = (area: string) => {
    const newAreas = area === "yes" ? ["yes"] : ["no"]
    setSelectedAreas(newAreas)
    handleChange("additionalAreas", newAreas)
  }

  const toggleSpecificArea = (area: string) => {
    const newAreas = [...selectedSpecificAreas]

    // If selecting "general", deselect all others
    if (area === "general") {
      if (newAreas.includes("general")) {
        // If general is already selected, just remove it
        const index = newAreas.indexOf("general")
        newAreas.splice(index, 1)
      } else {
        // Select only general
        setSelectedSpecificAreas(["general"])
        handleChange("specificAreas", ["general"])
        return
      }
    } else {
      // If selecting a specific area, remove "general" if it's selected
      if (newAreas.includes("general")) {
        const index = newAreas.indexOf("general")
        newAreas.splice(index, 1)
      }

      // Toggle the selected area
      if (newAreas.includes(area)) {
        const index = newAreas.indexOf(area)
        newAreas.splice(index, 1)
      } else {
        newAreas.push(area)
      }
    }

    setSelectedSpecificAreas(newAreas)
    handleChange("specificAreas", newAreas)
  }

  // Function to handle general cleaning selection
  const handleGeneralCleaning = () => {
    if (selectedSpecificAreas.includes("general")) {
      // If general is selected, deselect all other options
      setSelectedSpecificAreas(["general"])
      handleChange("specificAreas", ["general"])
    } else if (selectedSpecificAreas.length === 0) {
      // If nothing is selected, select general
      setSelectedSpecificAreas(["general"])
      handleChange("specificAreas", ["general"])
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const handleWindowCleaningPopup = () => {
    setShowWindowCleaningPopup(true)
  }

  const handleWindowCleaningChoice = (separateBooking: boolean) => {
    setShowWindowCleaningPopup(false)
    if (separateBooking) {
      setSelectedServices((prev) => [...prev, "windows"])
    } else {
      setSelectedServices((prev) => prev.filter((service) => service !== "windows"))
    }
  }

  const getFormOrder = () => {
    const order = []
    if (selectedServices.includes("moving")) order.push("moving")
    if (selectedServices.includes("home")) order.push("home")
    if (selectedServices.includes("windows")) order.push("windows")
    return order
  }

  const yesNoOptions = [
    { id: true, icon: <Check className="w-6 h-6" />, label: "Ja" },
    { id: false, icon: <X className="w-6 h-6" />, label: "Nej" },
  ]

  const additionalAreaOptions = [
    { id: "yes", icon: <Check className="w-6 h-6" />, label: "Ja" },
    { id: "no", icon: <X className="w-6 h-6" />, label: "Nej" },
  ]

  // Updated frequency options with descriptions and popularity indicators
  const frequencyOptions = [
    {
      id: "once",
      icon: <Calendar className="w-6 h-6" />,
      label: "Engångsstädning",
      description: "Perfekt för storstädning eller speciella tillfällen",
      popular: false,
    },
    {
      id: "weekly",
      icon: <Repeat className="w-6 h-6" />,
      label: "Varje vecka",
      description: "Håller ditt hem fräscht och rent regelbundet",
      popular: true,
    },
    {
      id: "biweekly",
      icon: <Repeat className="w-6 h-6" />,
      label: "Varannan vecka",
      description: "Bra balans mellan renlighet och pris",
      popular: false,
    },
    {
      id: "monthly",
      icon: <Calendar className="w-6 h-6" />,
      label: "En gång i månaden",
      description: "Idealisk för underhållsstädning",
      popular: false,
    },
  ]

  // Updated specific area options with more descriptive labels and general option
  const specificAreaOptions = [
    {
      id: "general",
      icon: <Sparkles className="w-6 h-6" />,
      label: "Allmän städning",
      description: "Inga specifika önskemål - städa hela hemmet",
    },
    {
      id: "kitchen",
      icon: <Brush className="w-6 h-6" />,
      label: "Kök",
      description: "Rengöring av ytor, spis och diskbänk",
    },
    {
      id: "bathroom",
      icon: <Droplets className="w-6 h-6" />,
      label: "Badrum",
      description: "Grundlig rengöring av toalett, dusch och handfat",
    },
    {
      id: "floors",
      icon: <Brush className="w-6 h-6" />,
      label: "Golv",
      description: "Dammsugning och moppning av alla golv",
    },
    {
      id: "dusting",
      icon: <Wind className="w-6 h-6" />,
      label: "Damning",
      description: "Avtorkning av alla tillgängliga ytor",
    },
    {
      id: "surfaces",
      icon: <Brush className="w-6 h-6" />,
      label: "Andra ytor",
      description: "Rengöring av fönsterbrädor, dörrkarmar, etc.",
    },
  ]

  const windowSidesOptions = [
    { id: "both", icon: <Maximize2 className="w-6 h-6" />, label: "Både in- och utsida" },
    { id: "inside", icon: <Maximize2 className="w-6 h-6" />, label: "Bara insida" },
  ]

  const windowHeightOptions = [
    { id: "normal", icon: <Home className="w-6 h-6" />, label: "Normal höjd" },
    { id: "high", icon: <Stairs className="w-6 h-6" />, label: "Hög höjd (behöver stege)" },
  ]

  // Property type options for moving cleaning
  const propertyTypeOptions = [
    {
      id: "apartment",
      icon: <Building className="w-6 h-6" />,
      label: "Lägenhet",
      description: "Bostadsrätt eller hyresrätt",
    },
    { id: "house", icon: <Home className="w-6 h-6" />, label: "Hus", description: "Enfamiljshus" },
    { id: "villa", icon: <Home className="w-6 h-6" />, label: "Villa", description: "Större hus med trädgård" },
    { id: "other", icon: <Building className="w-6 h-6" />, label: "Annat", description: "Annan typ av bostad" },
  ]

  // Common wishes specific to window cleaning when that's the selected service type
  const windowCleaningWishes = [
    "Extra noggrann putsning (för smutsiga fönster)",
    "Putsning av karmar & lister",
    "Borttagning av tejprester/färgfläckar",
    "Fönsterputs vid dåligt väder (ej ombokning)",
    "Rengöring av persienner",
  ]

  // Moving cleaning specific wishes
  const movingCleaningWishes = [
    "Extra noggrann rengöring i köket",
    "Rengöring av ugn och spis",
    "Rengöring av kyl och frys",
    "Rengöring av ventilationskanaler",
    "Rengöring av balkong/uteplats",
    "Borttagning av tejprester/märken på väggar",
  ]

  // Original common wishes for other cleaning types
  const commonWishes = [
    "Extra noggrann rengöring i köket",
    "Allergivänliga rengöringsprodukter",
    "Fokus på badrum och toaletter",
    "Rengöring av insidan av skåp",
    "Fönsterputsning ingår",
  ]

  // Ersätt innehållet i return-satsen med följande:
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Progress indicator for multi-step form */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold">
          {showServiceSelection
            ? "Vilken typ av städning behöver du?"
            : cleaningType === "moving"
              ? "Flyttstädning"
              : cleaningType === "home"
                ? "Hemstädning"
                : "Fönsterputs"}
        </h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Steg {currentStep} av {totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={(currentStep / totalSteps) * 100} className="h-2 mb-6" />

      {/* Compact trust banner */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ska%CC%88rmavbild%202025-03-10%20kl.%2000.03.18-oEKEx4pA0Tp41heFr7k7o4C10FYeuL.png"
              alt="Balder"
              className="w-12 h-12 object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-blue-800">Rekommenderas av ledande fastighetsägare</p>
              <p className="text-xs text-blue-600">Pålitligt val för Balder och 5000+ nöjda kunder</p>
            </div>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm font-bold text-gray-800">4.8/5</span>
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 mb-1" />
          <span className="text-xs text-center font-medium">100% Nöjdhetsgaranti</span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600 mb-1" />
          <span className="text-xs text-center font-medium">Tar &lt;1 minut att fylla i</span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg">
          <Users className="w-5 h-5 text-purple-600 mb-1" />
          <span className="text-xs text-center font-medium">5000+ nöjda kunder</span>
        </div>
      </div>

      {showServiceSelection ? (
        <>
          <p className="text-muted-foreground mb-4">Välj den städtjänst som passar dig bäst.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card
              className={`p-4 cursor-pointer transition-all rounded-xl hover:scale-[1.01] hover:shadow-md hover:shadow-blue-100 ${
                cleaningType === "moving"
                  ? "border-2 border-blue-600 bg-blue-50 shadow-md shadow-blue-100"
                  : "border border-gray-200 hover:bg-blue-50/30"
              }`}
              onClick={() => selectCleaningType("moving")}
            >
              <div className="flex flex-col items-center text-center h-full relative">
                {cleaningType === "moving" && (
                  <div className="absolute top-0 right-0">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="w-14 h-14 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mb-3">
                  <Home className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Flyttstädning</h3>
                <p className="text-sm text-muted-foreground mb-2">Fullständig städning vid utflytt</p>
                <p className="text-xs text-blue-600 mb-3">Inkl. fönsterputs och städgaranti</p>
                <ul className="text-xs text-left space-y-1.5 mt-auto w-full">
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                    <span>Godkänd av hyresvärdar</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                    <span>Inkl. fönsterputs</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                    <span>Städgaranti</span>
                  </li>
                </ul>
                <Badge className="mt-3 bg-blue-100 text-blue-700 hover:bg-blue-200">Från 1800 kr</Badge>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all rounded-xl hover:scale-[1.01] hover:shadow-md hover:shadow-green-100 ${
                cleaningType === "home"
                  ? "border-2 border-green-600 bg-green-50 shadow-md shadow-green-100"
                  : "border border-gray-200 hover:bg-green-50/30"
              }`}
              onClick={() => selectCleaningType("home")}
            >
              <div className="flex flex-col items-center text-center h-full relative">
                {cleaningType === "home" && (
                  <div className="absolute top-0 right-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
                <div className="w-14 h-14 flex items-center justify-center bg-green-100 rounded-full text-green-600 mb-3">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Hemstädning</h3>
                <p className="text-sm text-muted-foreground mb-2">Regelbunden eller engångsstädning</p>
                <p className="text-xs text-green-600 mb-3">Flexibla intervall efter dina behov</p>
                <ul className="text-xs text-left space-y-1.5 mt-auto w-full">
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-1.5 flex-shrink-0" />
                    <span>Flexibla intervall</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-1.5 flex-shrink-0" />
                    <span>Anpassad efter dina behov</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-1.5 flex-shrink-0" />
                    <span>RUT-avdrag</span>
                  </li>
                </ul>
                <Badge className="mt-3 bg-green-100 text-green-700 hover:bg-green-200">Från 400 kr/tim</Badge>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all rounded-xl hover:scale-[1.01] hover:shadow-md hover:shadow-purple-100 ${
                cleaningType === "windows"
                  ? "border-2 border-purple-600 bg-purple-50 shadow-md shadow-purple-100"
                  : "border border-gray-200 hover:bg-purple-50/30"
              }`}
              onClick={() => selectCleaningType("windows")}
            >
              <div className="flex flex-col items-center text-center h-full relative">
                {cleaningType === "windows" && (
                  <div className="absolute top-0 right-0">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                )}
                <div className="w-14 h-14 flex items-center justify-center bg-purple-100 rounded-full text-purple-600 mb-3">
                  <Maximize2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Fönsterputs</h3>
                <p className="text-sm text-muted-foreground mb-2">Rengöring av fönster</p>
                <p className="text-xs text-purple-600 mb-3">Engångs eller återkommande</p>
                <ul className="text-xs text-left space-y-1.5 mt-auto w-full">
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-500 mr-1.5 flex-shrink-0" />
                    <span>Kristallklara resultat</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-500 mr-1.5 flex-shrink-0" />
                    <span>Professionell utrustning</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-500 mr-1.5 flex-shrink-0" />
                    <span>RUT-avdrag</span>
                  </li>
                </ul>
                <Badge className="mt-3 bg-purple-100 text-purple-700 hover:bg-purple-200">Från 99 kr/fönster</Badge>
              </div>
            </Card>
          </div>

          {/* Customer testimonial */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
            <div className="flex items-start">
              <div className="text-blue-500 mr-2 mt-0.5 flex-shrink-0">"</div>
              <div>
                <p className="text-sm italic text-blue-700">
                  "Fantastisk service! Städningen var grundlig och personalen professionell. Rekommenderar starkt!"
                </p>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3 h-3 text-yellow-400" fill="#FBBF24" />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-gray-600 ml-2">- Anna S, Stockholm</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentStep(1)
                setShowServiceSelection(true)
                setCleaningType("home")
              }}
              className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Byt städtjänst
            </Button>

            <Badge className="bg-green-100 text-green-700 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              <span>Tar bara 1 minut att fylla i</span>
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Enhanced Address Field */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Adress för städningen
              </h3>
              <div className="relative">
                <Input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  onFocus={() => setAddressFocused(true)}
                  onBlur={() => setAddressFocused(false)}
                  className={`w-full pl-10 py-3 border-gray-300 transition-all ${
                    addressFocused
                      ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50"
                      : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  }`}
                  placeholder="Ange adressen där städningen ska utföras"
                  required
                />
                <MapPin
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    addressFocused ? "text-blue-600" : "text-gray-400"
                  }`}
                  size={18}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <Info className="w-3.5 h-3.5 mr-1" />
                Ange den fullständiga adressen för korrekt prisberäkning
              </p>
            </div>

            {/* Fields specific to moving cleaning */}
            {cleaningType === "moving" && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Typ av bostad
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vilken typ av bostad ska flyttstädas?</p>

                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {propertyTypeOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.propertyType === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("propertyType", option.id)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.propertyType === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.propertyType === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.propertyType === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Square className="w-5 h-5 mr-2 text-blue-600" />
                    Bostadsstorlek
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      { id: "small", range: "30-50", label: "Liten", description: "30-50 kvm" },
                      { id: "medium", range: "50-80", label: "Mellan", description: "50-80 kvm", popular: true },
                      { id: "large", range: "80-120", label: "Stor", description: "80-120 kvm" },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.propertySize === option.range || (!formData.propertySize && option.id === "medium")
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("propertySize", option.range)}
                      >
                        {option.popular && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Vanligast</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.propertySize === option.range ||
                              (!formData.propertySize && option.id === "medium")
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Square className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.propertySize === option.range ||
                              (!formData.propertySize && option.id === "medium")
                                ? "text-blue-700"
                                : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {(formData.propertySize === option.range ||
                          (!formData.propertySize && option.id === "medium")) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="customSize" className="text-sm font-medium">
                      Annan storlek:
                    </Label>
                    <div className="flex items-center mt-1">
                      <Input
                        type="number"
                        id="customSize"
                        value={
                          formData.propertySize && !["30-50", "50-80", "80-120"].includes(formData.propertySize)
                            ? formData.propertySize
                            : ""
                        }
                        onChange={(e) => handleChange("propertySize", e.target.value)}
                        className="w-24 mr-2 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ange kvm"
                      />
                      <span className="text-sm text-gray-600">kvm</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-3 bg-blue-50 p-2 rounded-md">
                    <Info className="w-4 h-4 mr-2 text-blue-600" />
                    <p className="text-xs text-blue-700">Storleken hjälper oss beräkna tidsåtgång och pris</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
                    Utflyttningsdatum
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">När flyttar du ut från bostaden?</p>

                  <div className="relative">
                    <Input
                      type="date"
                      id="moveOutDate"
                      value={formData.moveOutDate || ""}
                      onChange={(e) => handleChange("moveOutDate", e.target.value)}
                      onFocus={() => setMoveOutDateFocused(true)}
                      onBlur={() => setMoveOutDateFocused(false)}
                      className={`w-full pl-10 py-3 border-gray-300 transition-all ${
                        moveOutDateFocused
                          ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50"
                          : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      }`}
                      required
                    />
                    <CalendarDays
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                        moveOutDateFocused ? "text-blue-600" : "text-gray-400"
                      }`}
                      size={18}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    Städningen bör utföras efter att du flyttat ut dina saker
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <DoorOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Bostadsdetaljer
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Har bostaden trappor inomhus?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {yesNoOptions.map((option) => (
                          <Card
                            key={String(option.id)}
                            className={`p-3 cursor-pointer transition-all relative ${
                              formData.hasStairs === option.id
                                ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                                : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                            onClick={() => handleChange("hasStairs", option.id)}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div
                                className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                  formData.hasStairs === option.id
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {option.icon}
                              </div>
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                            {formData.hasStairs === option.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Har bostaden garage som ska städas?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {yesNoOptions.map((option) => (
                          <Card
                            key={String(option.id) + "-garage"}
                            className={`p-3 cursor-pointer transition-all relative ${
                              formData.hasGarage === option.id
                                ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                                : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                            onClick={() => handleChange("hasGarage", option.id)}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div
                                className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                  formData.hasGarage === option.id
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {option.icon}
                              </div>
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                            {formData.hasGarage === option.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
                    Besiktning
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">När är besiktningen planerad?</p>

                  <div className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="inspectionDate" className="text-sm font-medium block mb-1">
                        Datum för besiktning
                      </Label>
                      <Input
                        type="date"
                        id="inspectionDate"
                        value={formData.inspectionDate || ""}
                        onChange={(e) => handleChange("inspectionDate", e.target.value)}
                        onFocus={() => setInspectionDateFocused(true)}
                        onBlur={() => setInspectionDateFocused(false)}
                        className={`w-full pl-10 py-3 border-gray-300 transition-all ${
                          inspectionDateFocused
                            ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50"
                            : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                      <CalendarDays
                        className={`absolute left-3 top-[calc(50%+0.25rem)] transform -translate-y-1/2 ${
                          inspectionDateFocused ? "text-blue-600" : "text-gray-400"
                        }`}
                        size={18}
                      />
                    </div>

                    <div>
                      <Label htmlFor="inspectionTime" className="text-sm font-medium block mb-1">
                        Tid för besiktning
                      </Label>
                      <Input
                        type="time"
                        id="inspectionTime"
                        value={formData.inspectionTime || ""}
                        onChange={(e) => handleChange("inspectionTime", e.target.value)}
                        className="w-full border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center mt-3 bg-blue-50 p-2 rounded-md">
                    <Info className="w-4 h-4 mr-2 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      Vi ser till att städningen är klar i god tid före besiktningen
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-blue-600" />
                    Nyckelhantering
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Hur vill du lämna över nycklar till städpersonalen?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      {
                        id: "advance",
                        icon: <KeyRound className="w-6 h-6" />,
                        label: "Lämna nycklar i förväg",
                        description: "90% av våra kunder väljer detta – slipp stressen!",
                        recommended: true,
                      },
                      {
                        id: "onsite",
                        icon: <Key className="w-6 h-6" />,
                        label: "Lämna nycklar på plats",
                        description: "Du behöver möta upp städpersonalen",
                      },
                      {
                        id: "other",
                        icon: <PenLine className="w-6 h-6" />,
                        label: "Annat",
                        description: "Beskriv din lösning nedan",
                      },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.keyHandover === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("keyHandover", option.id)}
                      >
                        {option.recommended && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Rekommenderas</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.keyHandover === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.keyHandover === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.keyHandover === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {formData.keyHandover === "other" && (
                    <Input
                      type="text"
                      value={formData.keyHandoverNote}
                      onChange={(e) => handleChange("keyHandoverNote", e.target.value)}
                      className="w-full mt-2 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      placeholder="Beskriv hur du vill lämna över nycklarna"
                    />
                  )}
                </div>
              </>
            )}

            {/* Fields specific to home cleaning */}
            {cleaningType === "home" && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Square className="w-5 h-5 mr-2 text-blue-600" />
                    Bostadsstorlek
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      { id: "small", range: "30-50", label: "Liten", description: "30-50 kvm" },
                      { id: "medium", range: "50-80", label: "Mellan", description: "50-80 kvm", popular: true },
                      { id: "large", range: "80-120", label: "Stor", description: "80-120 kvm" },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.size === option.range || (!formData.size && option.id === "medium")
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("size", option.range)}
                      >
                        {option.popular && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Vanligast</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.size === option.range || (!formData.size && option.id === "medium")
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Square className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.size === option.range || (!formData.size && option.id === "medium")
                                ? "text-blue-700"
                                : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {(formData.size === option.range || (!formData.size && option.id === "medium")) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="customSize" className="text-sm font-medium">
                      Annan storlek:
                    </Label>
                    <div className="flex items-center mt-1">
                      <Input
                        type="number"
                        id="customSize"
                        value={
                          formData.size && !["30-50", "50-80", "80-120"].includes(formData.size) ? formData.size : ""
                        }
                        onChange={(e) => handleChange("size", e.target.value)}
                        className="w-24 mr-2 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ange kvm"
                      />
                      <span className="text-sm text-gray-600">kvm</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-3 bg-blue-50 p-2 rounded-md">
                    <Info className="w-4 h-4 mr-2 text-blue-600" />
                    <p className="text-xs text-blue-700">Storleken hjälper oss beräkna tidsåtgång och pris</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Städfrekvens
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Hur ofta önskar du städning?</p>

                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {frequencyOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.cleaningFrequency === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("cleaningFrequency", option.id)}
                      >
                        {option.popular && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Populärt val</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.cleaningFrequency === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.cleaningFrequency === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.cleaningFrequency === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {formData.cleaningFrequency && (
                    <div className="flex items-center mt-3 bg-green-50 p-2 rounded-md">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      <p className="text-xs text-green-700">
                        {formData.cleaningFrequency === "once"
                          ? "Perfekt för en grundlig engångsstädning!"
                          : formData.cleaningFrequency === "weekly"
                            ? "Bästa valet för ett kontinuerligt rent hem!"
                            : formData.cleaningFrequency === "biweekly"
                              ? "Bra balans mellan renlighet och kostnad!"
                              : "Bra val för regelbunden underhållsstädning!"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Tid som passar dig
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vilken tid på dagen passar dig bäst?</p>

                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {timePreferenceOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.timePreference === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("timePreference", option.id)}
                      >
                        {option.popular && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Populärt val</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.timePreference === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.timePreference === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.timePreference === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {formData.timePreference && (
                    <div className="flex items-center mt-3 bg-green-50 p-2 rounded-md">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      <p className="text-xs text-green-700">
                        {formData.timePreference === "morning"
                          ? "Vi kommer att schemalägga städningen på förmiddagen!"
                          : formData.timePreference === "afternoon"
                            ? "Vi kommer att schemalägga städningen på eftermiddagen!"
                            : "Vi anpassar oss efter din tillgänglighet!"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Brush className="w-5 h-5 mr-2 text-blue-600" />
                    Fokusområden
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vilka områden vill du ha särskilt fokus på?</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                    {specificAreaOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          selectedSpecificAreas.includes(option.id)
                            ? option.id === "general"
                              ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                              : "border-2 border-green-500 bg-green-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        } ${option.id === "general" ? "col-span-2 sm:col-span-3" : ""}`}
                        onClick={() => toggleSpecificArea(option.id)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              selectedSpecificAreas.includes(option.id)
                                ? option.id === "general"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              selectedSpecificAreas.includes(option.id)
                                ? option.id === "general"
                                  ? "text-blue-700"
                                  : "text-green-700"
                                : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {selectedSpecificAreas.includes(option.id) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {selectedSpecificAreas.length > 0 && (
                    <div className="flex items-center mt-3 bg-green-50 p-2 rounded-md">
                      <ThumbsUp className="w-4 h-4 mr-2 text-green-600" />
                      <p className="text-xs text-green-700">
                        {selectedSpecificAreas.includes("general")
                          ? "Vi kommer att utföra en grundlig städning av hela hemmet!"
                          : `Du har valt ${selectedSpecificAreas.length} fokusområden för din städning!`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-blue-600" />
                    Nyckelhantering
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Hur vill du lämna över nycklar till städpersonalen?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      {
                        id: "advance",
                        icon: <KeyRound className="w-6 h-6" />,
                        label: "Lämna nycklar i förväg",
                        description: "90% av våra kunder väljer detta – slipp stressen!",
                        recommended: true,
                      },
                      {
                        id: "onsite",
                        icon: <Key className="w-6 h-6" />,
                        label: "Lämna nycklar på plats",
                        description: "Du behöver möta upp städpersonalen",
                      },
                      {
                        id: "other",
                        icon: <PenLine className="w-6 h-6" />,
                        label: "Annat",
                        description: "Beskriv din lösning nedan",
                      },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.keyHandover === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("keyHandover", option.id)}
                      >
                        {option.recommended && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Rekommenderas</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.keyHandover === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.keyHandover === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.keyHandover === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {formData.keyHandover === "other" && (
                    <Input
                      type="text"
                      value={formData.keyHandoverNote}
                      onChange={(e) => handleChange("keyHandoverNote", e.target.value)}
                      className="w-full mt-2 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      placeholder="Beskriv hur du vill lämna över nycklarna"
                    />
                  )}
                </div>
              </>
            )}

            {/* Fields specific to window cleaning */}
            {cleaningType === "windows" && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Square className="w-5 h-5 mr-2 text-blue-600" />
                    Antal fönster
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Hur många fönster vill du putsa?</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                    {[
                      { id: "0-5", label: "0-5 fönster", description: "Liten bostad" },
                      { id: "6-10", label: "6-10 fönster", description: "Medelstor bostad", popular: true },
                      { id: "11-20", label: "11-20 fönster", description: "Stor bostad" },
                      { id: "20+", label: "20+ fönster", description: "Vi återkommer med offert" },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.windowCount === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("windowCount", option.id)}
                      >
                        {option.popular && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Vanligast</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.windowCount === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Square className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.windowCount === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.windowCount === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Maximize2 className="w-5 h-5 mr-2 text-blue-600" />
                    Typ av fönster
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vilken typ av fönster har du? (Flera val möjliga)</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {[
                      {
                        id: "regular",
                        label: "Vanliga fönster",
                        description: "2-delade eller 3-delade",
                        icon: <Square className="w-5 h-5" />,
                      },
                      {
                        id: "panorama",
                        label: "Panoramafönster",
                        description: "Stora fönsterpartier",
                        icon: <Maximize2 className="w-6 h-6 transform scale-x-125" />,
                      },
                      {
                        id: "divided",
                        label: "Spröjsade fönster",
                        description: "Fönster med spröjs",
                        icon: <LayoutGrid className="w-5 h-5" />,
                      },
                      {
                        id: "balcony",
                        label: "Inglasad balkong",
                        description: "Balkong med glaspartier",
                        icon: <Home className="w-5 h-5" />,
                      },
                    ].map((option) => {
                      const isSelected = formData.windowTypes?.includes(option.id)
                      return (
                        <Card
                          key={option.id}
                          className={`p-3 cursor-pointer transition-all relative ${
                            isSelected
                              ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                              : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                          onClick={() => {
                            const currentTypes = formData.windowTypes || []
                            const newTypes = isSelected
                              ? currentTypes.filter((type) => type !== option.id)
                              : [...currentTypes, option.id]
                            handleChange("windowTypes", newTypes)
                          }}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {option.icon}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-blue-700" : ""}`}>
                              {option.label}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Maximize2 className="w-5 h-5 mr-2 text-blue-600" />
                    Insida och utsida
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vill du att vi putsar insidan, utsidan eller båda?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      {
                        id: "outside",
                        label: "Endast utsidan",
                        description: "Putsning av fönstrens utsida",
                        icon: <WindowOutsideIcon />,
                      },
                      {
                        id: "both",
                        label: "Både insida & utsida",
                        description: "Komplett fönsterputsning",
                        recommended: true,
                        bestResult: true,
                        icon: <WindowBothSidesIcon />,
                      },
                      {
                        id: "inside",
                        label: "Endast insidan",
                        description: "Putsning av fönstrens insida",
                        icon: <WindowInsideIcon />,
                      },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.windowSides === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("windowSides", option.id)}
                      >
                        {option.recommended && (
                          <Badge className="absolute -bottom-2 right-2 bg-blue-600 text-[10px]">Rekommenderas</Badge>
                        )}
                        {option.bestResult && (
                          <Badge className="absolute -top-2 right-2 bg-green-600 text-[10px]">Bäst resultat</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.windowSides === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium mb-1 ${
                              formData.windowSides === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 leading-relaxed">{option.description}</span>
                        </div>
                        {formData.windowSides === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Stairs className="w-5 h-5 mr-2 text-blue-600" />
                    Höjd / svåråtkomliga fönster
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Finns det fönster på hög höjd eller svårtillgängliga fönster?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      {
                        id: "ladder",
                        label: "Kräver stege",
                        description: "Några fönster kräver stege",
                        icon: <ArrowUp className="w-5 h-5" />,
                      },
                      {
                        id: "easy",
                        label: "Lättåtkomliga",
                        description: "Alla fönster är lättåtkomliga",
                        icon: <Check className="w-5 h-5" />,
                      },
                      {
                        id: "lift",
                        label: "Kräver skylift",
                        description: "Speciallösning behövs",
                        special: true,
                        icon: <Truck className="w-5 h-5" />,
                      },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.windowHeight === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("windowHeight", option.id)}
                      >
                        {option.special && (
                          <Badge className="absolute -top-2 right-2 bg-amber-500 text-[10px]">Specialoffert</Badge>
                        )}
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                            formData.windowHeight === option.id
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {option.icon}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            formData.windowHeight === option.id ? "text-blue-700" : ""
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                      </Card>
                    ))}
                  </div>

                  {formData.windowHeight === "lift" && (
                    <div className="mt-3 bg-amber-50 p-3 rounded-md border border-amber-200">
                      <p className="text-sm text-amber-800 flex items-start">
                        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                          Vi hjälper dig att hitta den bästa lösningen – du får en offert innan vi påbörjar arbetet.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                    Extra tjänster / tillval
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Önskar du några tillval?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                    {[
                      {
                        id: "frames",
                        label: "Rengöring av karmar",
                        description: "Fönsterkarmar och lister",
                        icon: <Square className="w-5 h-5" />,
                      },
                      {
                        id: "protection",
                        label: "Skyddande behandling",
                        description: "Minskar att smuts fastnar snabbt",
                        popular: true,
                        icon: <Shield className="w-5 h-5" />,
                      },
                      {
                        id: "blinds",
                        label: "Persiennrengöring",
                        description: "Rengöring av persienner",
                        icon: <AlignJustify className="w-5 h-5" />,
                      },
                    ].map((option) => {
                      const isSelected = formData.windowExtras?.includes(option.id)
                      return (
                        <Card
                          key={option.id}
                          className={`p-3 cursor-pointer transition-all relative ${
                            isSelected
                              ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                              : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                          onClick={() => {
                            const currentExtras = formData.windowExtras || []
                            const newExtras = isSelected
                              ? currentExtras.filter((extra) => extra !== option.id)
                              : [...currentExtras, option.id]
                            handleChange("windowExtras", newExtras)
                          }}
                        >
                          {option.popular && (
                            <Badge className="absolute -top-2 right-2 bg-purple-600 text-[10px]">Mest populärt</Badge>
                          )}
                          <div className="flex flex-col items-center text-center">
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {option.icon}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-blue-700" : ""}`}>
                              {option.label}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{option.description}</span>

                            {option.id === "protection" && (
                              <p className="text-xs text-purple-700 mt-2 font-medium">
                                Vår mest valda extra tjänst – skyddar dina fönster längre!
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Tid som passar dig
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vilken tid på dagen passar dig bäst?</p>

                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {timePreferenceOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.timePreference === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("timePreference", option.id)}
                      >
                        {option.popular && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Populärt val</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.timePreference === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.icon}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.timePreference === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.timePreference === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-blue-600" />
                    Nyckelhantering
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Behöver vi tillgång till nyckel för att utföra fönsterputsningen?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {[
                      {
                        id: "key",
                        label: "Ja, jag lämnar nyckel",
                        description: "Lämna nyckel i förväg",
                        recommended: true,
                      },
                      { id: "home", label: "Nej, jag är hemma", description: "Jag är hemma under städningen" },
                    ].map((option) => (
                      <Card
                        key={option.id}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.windowKeyAccess === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("windowKeyAccess", option.id)}
                      >
                        {option.recommended && (
                          <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Rekommenderas</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.windowKeyAccess === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Key className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.windowKeyAccess === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.windowKeyAccess === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                    <Repeat className="w-5 h-5 mr-2 text-blue-600" />
                    Återkommande tjänst
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Vill du boka återkommande fönsterputsning?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {[
                      {
                        id: true,
                        label: "Ja, återkommande",
                        description: "Regelbunden fönsterputsning",
                        discount: true,
                      },
                      { id: false, label: "Nej, engångsbokning", description: "Endast en gång" },
                    ].map((option) => (
                      <Card
                        key={String(option.id)}
                        className={`p-3 cursor-pointer transition-all relative ${
                          formData.windowRecurring === option.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleChange("windowRecurring", option.id)}
                      >
                        {option.discount && (
                          <Badge className="absolute -top-2 right-2 bg-green-600 text-[10px]">10% rabatt</Badge>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                              formData.windowRecurring === option.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Repeat className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              formData.windowRecurring === option.id ? "text-blue-700" : ""
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                        </div>
                        {formData.windowRecurring === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {formData.windowRecurring === true && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Hur ofta vill du ha fönsterputsning?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "quarterly", label: "Var tredje månad", description: "4 gånger per år", popular: true },
                          { id: "biannual", label: "Halvårsvis", description: "2 gånger per år" },
                          { id: "annual", label: "Årligen", description: "1 gång per år" },
                        ].map((option) => (
                          <Card
                            key={option.id}
                            className={`p-3 cursor-pointer transition-all relative ${
                              formData.windowFrequency === option.id
                                ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                                : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                            onClick={() => handleChange("windowFrequency", option.id)}
                          >
                            {option.popular && (
                              <Badge className="absolute -top-2 right-2 bg-blue-600 text-[10px]">Populärt val</Badge>
                            )}
                            <div className="flex flex-col items-center text-center">
                              <div
                                className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                  formData.windowFrequency === option.id
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <Calendar className="w-5 h-5" />
                              </div>
                              <span
                                className={`text-sm font-medium ${
                                  formData.windowFrequency === option.id ? "text-blue-700" : ""
                                }`}
                              >
                                {option.label}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                            </div>
                            {formData.windowFrequency === option.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Additional Notes - Improved with suggestions */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                <PenLine className="w-5 h-5 mr-2 text-blue-600" />
                Övriga önskemål
              </h3>

              <div>
                <Label htmlFor="additionalNotes" className="font-medium mb-2 block">
                  Har du några särskilda önskemål eller information?
                </Label>
                <div className="relative">
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => handleChange("additionalNotes", e.target.value)}
                    className="w-full min-h-[100px] pl-10 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ange eventuella särskilda detaljer eller behov... t.ex. extra noggrannhet i köket, allergivänliga produkter, etc."
                  />
                  <PenLine className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>

                {/* Common wishes quick selection */}
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Vanliga önskemål (klicka för att lägga till):</p>
                  <div className="flex flex-wrap gap-2">
                    {(cleaningType === "windows"
                      ? windowCleaningWishes
                      : cleaningType === "moving"
                        ? movingCleaningWishes
                        : commonWishes
                    ).map((wish, index) => (
                      <Badge
                        key={index}
                        className="cursor-pointer bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                        onClick={() => {
                          const currentNotes = formData.additionalNotes || ""
                          const newNotes = currentNotes ? `${currentNotes}, ${wish}` : wish
                          handleChange("additionalNotes", newNotes)
                        }}
                      >
                        + {wish}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators and guarantees */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6 mb-6">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-blue-800">Våra garantier till dig</h4>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-blue-700">100% nöjdhetsgaranti – vi fixar eventuella missar inom 24 timmar</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-blue-700">Alla städare är försäkrade och kontrollerade</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                <span className="text-blue-700">Miljövänliga rengöringsprodukter</span>
              </li>
            </ul>
            <div className="flex items-center mt-3">
              <BadgeCheck className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-xs font-medium text-blue-800">
                Certifierad partner till ledande fastighetsbolag
              </span>
            </div>
          </div>
        </>
      )}

      {showWindowCleaningPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Fönsterputs ingår i flyttstädning</h3>
            <p className="mb-4">Vill du boka fönsterputs separat för en annan adress eller senare tillfälle?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleWindowCleaningChoice(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Nej
              </button>
              <button
                onClick={() => handleWindowCleaningChoice(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Ja
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          className="back-button bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-5 rounded-lg transition-colors"
        >
          Tillbaka
        </button>
        <button
          type="submit"
          className={`next-button transition-all duration-300 shadow-lg flex items-center py-3 px-6 ${
            currentStep === 1 && !cleaningType
              ? "bg-blue-400 opacity-70 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 transform hover:scale-105 hover:shadow-xl"
          }`}
          disabled={currentStep === 1 && !cleaningType}
        >
          {currentStep === 1 ? "Nästa" : "Få din offert direkt – svar inom 60 sekunder! 🚀"}
        </button>
      </div>
      {currentStep === 2 && (
        <p className="text-xs text-gray-600 mt-2 flex items-center justify-end">
          <Check className="w-3 h-3 mr-1 text-green-500" />
          <span>
            Välj oss för en trygg och prisvärd städning – <strong>100% nöjdhetsgaranti!</strong>
          </span>
        </p>
      )}
    </form>
  )
}
