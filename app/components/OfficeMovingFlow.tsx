"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  Coffee,
  Info,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  Home,
  Globe,
  Server,
  MessageSquare,
  Warehouse,
  PenLine,
  Clock,
  Truck,
  ShoppingBag,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OfficeMovingFlowProps {
  formData: {
    officeFromAddress?: string
    officeToAddress?: string
    officeType?: string
    storeType?: string // Add this new field for store type
    workstations?: string
    additionalSpaces?: string[]
    officeMoveDate?: string
    approximateDestination?: boolean
    otherSpace?: string
    dateFlexibility?: string
    officeSizeSquareMeters?: string // Add this new field
    officeElevator?: "big" | "small" | "none" // Add this new field
    hasLoadingZone?: boolean // Add this new field
    estimatedVolume?: number // Add this field for volume calculation
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
  currentStep?: number
  totalSteps?: number
  moveType?: "office" | "store" // Add this to determine the type of move
}

// Helper function to calculate estimated volume based on office size and workstations
const calculateEstimatedVolume = (
  officeSizeSquareMeters: string | number,
  workstations: string | number,
  additionalSpaces: string[] = [],
): number => {
  // Convert inputs to numbers if they're strings
  const sizeInSqm =
    typeof officeSizeSquareMeters === "string"
      ? Number.parseInt(officeSizeSquareMeters, 10) || 0
      : officeSizeSquareMeters || 0

  const workstationCount = typeof workstations === "string" ? Number.parseInt(workstations, 10) || 0 : workstations || 0

  // Base calculation - each workstation is approximately 2 cubic meters
  // Office size contributes to the volume (roughly 0.3 cubic meters per square meter)
  let estimatedVolume = workstationCount * 2 + sizeInSqm * 0.3

  // Add volume for additional spaces
  if (additionalSpaces && additionalSpaces.length > 0) {
    // Conference rooms add more volume
    if (additionalSpaces.includes("conference")) {
      estimatedVolume += 10
    }

    // Kitchen/pantry adds volume
    if (additionalSpaces.includes("kitchen")) {
      estimatedVolume += 5
    }

    // Storage/warehouse adds significant volume
    if (additionalSpaces.includes("storage")) {
      estimatedVolume += 15
    }

    // Reception area adds some volume
    if (additionalSpaces.includes("reception")) {
      estimatedVolume += 7
    }

    // Server room adds volume
    if (additionalSpaces.includes("server")) {
      estimatedVolume += 8
    }

    // Other spaces add a default amount
    if (additionalSpaces.includes("other")) {
      estimatedVolume += 5
    }
  }

  // Ensure we have a minimum reasonable volume
  estimatedVolume = Math.max(10, estimatedVolume)

  // Round to one decimal place
  return Math.round(estimatedVolume * 10) / 10
}

// Completely rewritten component with simplified state management
export default function OfficeMovingFlow({
  formData,
  handleChange,
  nextStep,
  prevStep,
  currentStep = 4,
  totalSteps = 9,
  moveType = "office", // Default to office move
}: OfficeMovingFlowProps) {
  // Use simple useState instead of useReducer
  const [addressFocused, setAddressFocused] = useState<string | null>(null)
  const [isApproximateDestination, setIsApproximateDestination] = useState(formData.approximateDestination || false)
  const [selectedOfficeType, setSelectedOfficeType] = useState(formData.officeType || "")
  const [officeSizeSquareMeters, setOfficeSizeSquareMeters] = useState(formData.officeSizeSquareMeters || "")
  const [officeElevator, setOfficeElevator] = useState<"big" | "small" | "none">(formData.officeElevator || "none")
  const [hasLoadingZone, setHasLoadingZone] = useState(formData.hasLoadingZone || false)
  const [estimatedVolume, setEstimatedVolume] = useState<number>(formData.estimatedVolume || 0)
  const [selectedStoreType, setSelectedStoreType] = useState(formData.storeType || "")

  // IMPORTANT: Keep additionalSpaces completely local until form submission
  // Don't initialize from formData to avoid any potential update loops
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([])
  const [showOtherSpace, setShowOtherSpace] = useState(false)

  const [isDateFlexible, setIsDateFlexible] = useState(!!formData.dateFlexibility)
  const [dateFlexibility, setDateFlexibility] = useState(formData.dateFlexibility || "1week")
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Initialize spaces only once on mount
  useEffect(() => {
    if (formData.additionalSpaces && formData.additionalSpaces.length > 0) {
      setSelectedSpaces(formData.additionalSpaces)
      setShowOtherSpace(formData.additionalSpaces.includes("other"))
    }
  }, [])

  // Calculate and update estimated volume when relevant data changes
  useEffect(() => {
    // Only calculate if we have either office size or workstations
    if (officeSizeSquareMeters || (workstationsRef.current && workstationsRef.current.value)) {
      const workstations = workstationsRef.current ? workstationsRef.current.value : formData.workstations || ""
      const volume = calculateEstimatedVolume(officeSizeSquareMeters, workstations, selectedSpaces)

      // Update local state
      setEstimatedVolume(volume)

      // Update parent state
      handleChange("estimatedVolume", volume)

      console.log("Updated estimated volume:", volume, {
        officeSizeSquareMeters,
        workstations,
        selectedSpaces,
      })
    }
  }, [officeSizeSquareMeters, selectedSpaces, formData.workstations])

  // Refs for form fields
  const fromAddressRef = useRef<HTMLInputElement>(null)
  const toAddressRef = useRef<HTMLInputElement>(null)
  const workstationsRef = useRef<HTMLInputElement>(null)
  const moveDateRef = useRef<HTMLInputElement>(null)
  const otherSpaceRef = useRef<HTMLInputElement>(null)
  const additionalInfoRef = useRef<HTMLTextAreaElement>(null)

  // Office types
  const officeTypes = [
    {
      id: "small",
      label: "Litet kontor",
      description: "Upp till 10 arbetsplatser",
      icon: <Home className="w-6 h-6" />,
      tooltip: "Perfekt för startups och små team. Oftast enklare logistik och kortare flyttid.",
    },
    {
      id: "medium",
      label: "Mellanstort kontor",
      description: "11-30 arbetsplatser",
      icon: <Building2 className="w-6 h-6" />,
      tooltip: "Idealiskt för etablerade företag. Kräver god planering och koordination.",
    },
    {
      id: "large",
      label: "Stort kontor",
      description: "31+ arbetsplatser",
      icon: <Briefcase className="w-6 h-6" />,
      tooltip: "För större företag. Kräver specialplanering, logistik och ofta flera flyttbilar.",
    },
    {
      id: "coworking",
      label: "Coworking space",
      description: "Delat kontorsutrymme",
      icon: <Globe className="w-6 h-6" />,
      tooltip: "Delade utrymmen med särskilda regler. Ofta flexibla lösningar med mindre möbler och utrustning.",
    },
  ]

  // Store types
  const storeTypes = [
    {
      id: "small",
      label: "Liten butik",
      description: "Upp till 50 kvm",
      details: "Små butiker med begränsat lager, t.ex. klädbutiker, skönhetsbutiker eller mobilbutiker.",
      icon: <Home className="w-6 h-6" />,
      tooltip: "Perfekt för små butiker med begränsat lager och enklare flyttbehov.",
    },
    {
      id: "medium",
      label: "Mellanstor butik",
      description: "51-200 kvm",
      details: "Till exempel elektronikbutiker, sportbutiker eller inredningsbutiker med större lager och hyllsystem.",
      icon: <Building2 className="w-6 h-6" />,
      tooltip: "Idealiskt för butiker med måttligt lager och utställningsytor.",
    },
    {
      id: "large",
      label: "Stor butik",
      description: "200+ kvm",
      details: "Stora butiker som livsmedelsbutiker, varuhus och möbelbutiker som kräver mer logistik.",
      icon: <Briefcase className="w-6 h-6" />,
      tooltip: "För stora butiksytor med omfattande lager och komplexa logistikbehov.",
    },
    {
      id: "popup",
      label: "Pop-up butik / Tillfällig butik",
      description: "Delad butiksyta eller eventyta",
      details: "För tillfälliga butiker, mässor eller konceptbutiker som flyttar ofta.",
      icon: <Globe className="w-6 h-6" />,
      tooltip: "Speciallösningar för tillfälliga butiksytor och utställningar.",
    },
  ]

  // Additional spaces
  const additionalSpaces = [
    { id: "conference", label: "Konferensrum", icon: <Users className="w-4 h-4" /> },
    { id: "kitchen", label: "Kök/Pentry", icon: <Coffee className="w-4 h-4" /> },
    { id: "storage", label: "Lager/Förråd", icon: <Warehouse className="w-4 h-4" /> },
    { id: "reception", label: "Reception", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "server", label: "Serverrum", icon: <Server className="w-4 h-4" /> },
    { id: "other", label: "Annat", icon: <PenLine className="w-4 h-4" /> },
  ]

  // Add elevator options
  const elevatorOptions = [
    {
      id: "big",
      icon: <Building2 className="w-6 h-6" />,
      label: "Fullstor hiss",
      description: "Rymmer större möbler",
    },
    {
      id: "small",
      icon: <Building2 className="w-6 h-6" />,
      label: "Liten hiss",
      description: "Kan rymma mindre föremål",
    },
    {
      id: "none",
      icon: <Building2 className="w-6 h-6" />,
      label: "Ingen hiss",
      description: "Bärs via trappor",
    },
  ]

  // Date flexibility options
  const dateFlexibilityOptions = [
    { id: "1week", label: "1 vecka före/efter" },
    { id: "2weeks", label: "2 veckor före/efter" },
    { id: "1month", label: "1 månad före/efter" },
    { id: "flexible", label: "Helt flexibel" },
  ]

  // Workstation presets
  const workstationPresets = [5, 10, 20, 50, 100, 200]

  // Handle workstation preset selection
  const handleWorkstationPreset = (preset: number) => {
    if (workstationsRef.current) {
      workstationsRef.current.value = preset.toString()

      // Recalculate volume when workstations change
      const volume = calculateEstimatedVolume(officeSizeSquareMeters, preset, selectedSpaces)

      setEstimatedVolume(volume)
      handleChange("estimatedVolume", volume)
      handleChange("workstations", preset.toString())
    }
  }

  // Completely rewritten space toggle handler
  const handleSpaceToggle = (spaceId: string) => {
    // Create a new array to avoid mutation
    let newSpaces = [...selectedSpaces]

    if (newSpaces.includes(spaceId)) {
      // Remove the space
      newSpaces = newSpaces.filter((id) => id !== spaceId)
    } else {
      // Add the space
      newSpaces.push(spaceId)
    }

    // Update local state
    setSelectedSpaces(newSpaces)
    setShowOtherSpace(newSpaces.includes("other"))

    // Recalculate volume when spaces change
    const workstations = workstationsRef.current ? workstationsRef.current.value : formData.workstations || ""
    const volume = calculateEstimatedVolume(officeSizeSquareMeters, workstations, newSpaces)
    setEstimatedVolume(volume)
    handleChange("estimatedVolume", volume)
  }

  // Validate form
  const validateForm = () => {
    const fromAddress = fromAddressRef.current?.value || ""
    const toAddress = toAddressRef.current?.value || ""
    const workstations = workstationsRef.current?.value || ""
    const moveDate = moveDateRef.current?.value || ""

    return (
      !!fromAddress &&
      (isApproximateDestination || !!toAddress) &&
      ((moveType === "office" && !!selectedOfficeType) || (moveType === "store" && !!selectedStoreType)) &&
      (moveType === "store" || !!workstations) &&
      !!moveDate
    )
  }

  // Collect form data
  const collectFormData = () => {
    // Calculate the estimated volume one final time
    const workstations = workstationsRef.current?.value || ""
    const volume = calculateEstimatedVolume(officeSizeSquareMeters, workstations, selectedSpaces)

    return {
      officeFromAddress: fromAddressRef.current?.value || "",
      officeToAddress: toAddressRef.current?.value || "",
      approximateDestination: isApproximateDestination,
      officeType: moveType === "office" ? selectedOfficeType : "",
      storeType: moveType === "store" ? selectedStoreType : "",
      workstations: workstationsRef.current?.value || "",
      additionalSpaces: selectedSpaces,
      officeMoveDate: moveDateRef.current?.value || "",
      otherSpace: otherSpaceRef.current?.value || "",
      dateFlexibility: isDateFlexible ? dateFlexibility : "",
      additionalInfo: additionalInfoRef.current?.value || "",
      officeSizeSquareMeters: officeSizeSquareMeters,
      officeElevator: officeElevator,
      hasLoadingZone: hasLoadingZone,
      estimatedVolume: volume,
    }
  }

  // Handle office size change
  const handleOfficeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = e.target.value
    setOfficeSizeSquareMeters(newSize)

    // Recalculate volume when office size changes
    const workstations = workstationsRef.current ? workstationsRef.current.value : formData.workstations || ""
    const volume = calculateEstimatedVolume(newSize, workstations, selectedSpaces)

    setEstimatedVolume(volume)
    handleChange("estimatedVolume", volume)
    handleChange("officeSizeSquareMeters", newSize)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)

    if (validateForm()) {
      // Collect all form data
      const data = collectFormData()
      console.log("OfficeMovingFlow - Submitting data:", data)

      // First update critical fields immediately
      handleChange("officeFromAddress", data.officeFromAddress)
      handleChange("officeToAddress", data.officeToAddress)
      handleChange("officeType", data.officeType)
      handleChange("workstations", data.workstations)
      handleChange("officeMoveDate", data.officeMoveDate)
      handleChange("officeSizeSquareMeters", data.officeSizeSquareMeters)
      handleChange("officeElevator", data.officeElevator)
      handleChange("hasLoadingZone", data.hasLoadingZone)
      handleChange("approximateDestination", data.approximateDestination)
      handleChange("estimatedVolume", data.estimatedVolume)

      // Inside handleSubmit, add this line after updating officeType
      if (moveType === "store") {
        handleChange("storeType", data.storeType)
      }

      // Then update the additionalSpaces array
      if (data.additionalSpaces && data.additionalSpaces.length > 0) {
        handleChange("additionalSpaces", data.additionalSpaces)
      }

      // Update any remaining fields
      if (data.otherSpace) handleChange("otherSpace", data.otherSpace)
      if (data.dateFlexibility) handleChange("dateFlexibility", data.dateFlexibility)
      if (data.additionalInfo) handleChange("additionalInfo", data.additionalInfo)

      // Log the final data being sent
      console.log("OfficeMovingFlow - Final data being sent:", {
        officeFromAddress: data.officeFromAddress,
        officeToAddress: data.officeToAddress,
        officeType: data.officeType,
        workstations: data.workstations,
        officeMoveDate: data.officeMoveDate,
        officeSizeSquareMeters: data.officeSizeSquareMeters,
        officeElevator: data.officeElevator,
        hasLoadingZone: data.hasLoadingZone,
        additionalSpaces: data.additionalSpaces,
        estimatedVolume: data.estimatedVolume,
      })

      // Then navigate to next step
      nextStep()
    } else {
      // Scroll to first invalid field
      const firstInvalidField = document.querySelector(".border-red-500")
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  // Handle back button
  const handlePrevStep = () => {
    // First navigate to previous step
    prevStep()

    // Then update parent state after a delay
    setTimeout(() => {
      const data = collectFormData()

      // Update parent state all at once
      Object.entries(data).forEach(([key, value]) => {
        handleChange(key, value)
      })
    }, 200)
  }

  // Get today's date for min date attribute
  const today = new Date().toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold">{moveType === "office" ? "Kontorsflytt" : "Butiksflytt"}</h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Steg {currentStep} av {totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={(currentStep / totalSteps) * 100} className="h-2 mb-6" />

      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
          <span className="text-xs text-center font-medium">Minimal verksamhetsstörning</span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-600 mb-1" />
          <span className="text-xs text-center font-medium">Erfarna kontorsflyttare</span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-purple-600 mb-1" />
          <span className="text-xs text-center font-medium">Ansvarsförsäkring</span>
        </div>
      </div>

      {/* Estimated Volume Display - only show for office moves */}
      {moveType === "office" && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-800">Uppskattad flyttvolym</h3>
              <p className="text-2xl font-bold text-blue-900">{estimatedVolume.toFixed(1)} m³</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Baserat på:</p>
              <ul className="list-disc list-inside text-xs">
                <li>{officeSizeSquareMeters ? `${officeSizeSquareMeters} kvm kontorsyta` : "Kontorsyta ej angiven"}</li>
                <li>
                  {workstationsRef.current?.value
                    ? `${workstationsRef.current.value} arbetsplatser`
                    : "Arbetsplatser ej angivna"}
                </li>
                <li>{selectedSpaces.length > 0 ? `${selectedSpaces.length} extra utrymmen` : "Inga extra utrymmen"}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* From address */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Flyttar från
          </h3>
          <div className="relative">
            <Input
              type="text"
              id="officeFromAddress"
              ref={fromAddressRef}
              defaultValue={formData.officeFromAddress || ""}
              onFocus={() => setAddressFocused("from")}
              onBlur={() => setAddressFocused(null)}
              className={`w-full pl-10 py-3 border-gray-300 transition-all ${
                addressFocused === "from"
                  ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50"
                  : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              } ${formSubmitted && !fromAddressRef.current?.value ? "border-red-500" : ""}`}
              placeholder="Ange nuvarande kontorsadress"
              required
            />
            <MapPin
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                addressFocused === "from" ? "text-blue-600" : "text-gray-400"
              }`}
              size={18}
            />
          </div>
          {formSubmitted && !fromAddressRef.current?.value && (
            <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
          )}
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1" />
            Ange den fullständiga adressen för korrekt prisberäkning
          </p>
        </div>

        {/* To address */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Flyttar till
          </h3>
          <div className="relative">
            <Input
              type="text"
              id="officeToAddress"
              ref={toAddressRef}
              defaultValue={formData.officeToAddress || ""}
              onFocus={() => setAddressFocused("to")}
              onBlur={() => setAddressFocused(null)}
              className={`w-full pl-10 py-3 border-gray-300 transition-all ${
                addressFocused === "to"
                  ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50"
                  : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              } ${formSubmitted && !toAddressRef.current?.value && !isApproximateDestination ? "border-red-500" : ""}`}
              placeholder="Ange ny kontorsadress"
              disabled={isApproximateDestination}
              required={!isApproximateDestination}
            />
            <MapPin
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                addressFocused === "to" ? "text-blue-600" : "text-gray-400"
              }`}
              size={18}
            />
          </div>
          {formSubmitted && !toAddressRef.current?.value && !isApproximateDestination && (
            <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
          )}

          <div className="flex items-center mt-3">
            <Checkbox
              id="approximateDestination"
              checked={isApproximateDestination}
              onCheckedChange={(checked) => setIsApproximateDestination(!!checked)}
              className="mr-2"
            />
            <Label htmlFor="approximateDestination" className="text-sm cursor-pointer">
              Jag har bara en ungefärlig destination (exakt adress anges senare)
            </Label>
          </div>

          {isApproximateDestination && (
            <div className="mt-3">
              <Label htmlFor="approximateLocation" className="text-sm font-medium">
                Ungefärlig destination:
              </Label>
              <Input
                type="text"
                id="approximateLocation"
                defaultValue={formData.officeToAddress || ""}
                onChange={(e) => {
                  if (toAddressRef.current) {
                    toAddressRef.current.value = e.target.value
                  }
                }}
                className="mt-1 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="T.ex. Stockholm, city"
                required
              />
            </div>
          )}
        </div>

        {/* Office/Store Type */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            {moveType === "office" ? (
              <>
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Kontorstyp
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                Butikstyp
              </>
            )}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {moveType === "office" ? "Välj den typ av kontor ni har:" : "Välj den typ av butik ni har:"}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-2">
            {moveType === "office"
              ? // Office types grid
                officeTypes.map((type) => (
                  <TooltipProvider key={type.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card
                          className={`p-3 cursor-pointer transition-all relative ${
                            selectedOfficeType === type.id
                              ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                              : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          } ${formSubmitted && !selectedOfficeType && moveType === "office" ? "border-red-500" : ""}`}
                          onClick={() => setSelectedOfficeType(type.id)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                selectedOfficeType === type.id
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {type.icon}
                            </div>
                            <span
                              className={`text-sm font-medium ${selectedOfficeType === type.id ? "text-blue-700" : ""}`}
                            >
                              {type.label}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{type.description}</span>
                          </div>
                          {selectedOfficeType === type.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{type.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              : // Store types grid
                storeTypes.map((type) => (
                  <TooltipProvider key={type.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card
                          className={`p-3 cursor-pointer transition-all relative ${
                            selectedStoreType === type.id
                              ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                              : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          } ${formSubmitted && !selectedStoreType && moveType === "store" ? "border-red-500" : ""}`}
                          onClick={() => setSelectedStoreType(type.id)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                                selectedStoreType === type.id
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {type.icon}
                            </div>
                            <span
                              className={`text-sm font-medium ${selectedStoreType === type.id ? "text-blue-700" : ""}`}
                            >
                              {type.label}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{type.description}</span>
                            <span className="text-xs text-gray-500 mt-1">{type.details}</span>
                          </div>
                          {selectedStoreType === type.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{type.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
          </div>
          {formSubmitted &&
            ((moveType === "office" && !selectedOfficeType) || (moveType === "store" && !selectedStoreType)) && (
              <p className="text-red-500 text-xs mt-1">
                {moveType === "office" ? "Vänligen välj en kontorstyp." : "Please select a store type."}
              </p>
            )}
        </div>

        {/* Office Size */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            {moveType === "office" ? "Kontorets storlek (kvm)" : "Butikens storlek (kvm)"}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {moveType === "office" ? "Ange ungefärlig storlek på kontoret:" : "Ange ungefärlig storlek på butiken:"}
          </p>

          <Input
            type="number"
            id="officeSizeSquareMeters"
            value={officeSizeSquareMeters}
            onChange={handleOfficeSizeChange}
            className="w-full border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Ange storlek i kvadratmeter"
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1" />
            Storleken hjälper oss beräkna tidsåtgång och resursbehov
          </p>
        </div>

        {/* Workstations - only show for office moves */}
        {moveType === "office" && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Antal arbetsplatser
            </h3>
            <p className="text-sm text-gray-600 mb-3">Ange ungefärligt antal arbetsplatser som ska flyttas:</p>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mt-4">
                {workstationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleWorkstationPreset(preset)}
                    className="px-3 py-1.5 rounded-md text-sm transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Input
              type="number"
              id="workstations"
              ref={workstationsRef}
              defaultValue={formData.workstations || "10"}
              onChange={(e) => {
                // Recalculate volume when workstations change
                const volume = calculateEstimatedVolume(officeSizeSquareMeters, e.target.value, selectedSpaces)
                setEstimatedVolume(volume)
                handleChange("estimatedVolume", volume)
                handleChange("workstations", e.target.value)
              }}
              className={`w-full border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                formSubmitted && !workstationsRef.current?.value ? "border-red-500" : ""
              }`}
              placeholder="Antal arbetsplatser"
              min="1"
              required
            />
            {formSubmitted && !workstationsRef.current?.value && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Info className="w-3.5 h-3.5 mr-1" />
              En arbetsplats inkluderar typiskt skrivbord, stol och datorutrustning
            </p>
          </div>
        )}

        {/* Additional spaces - only show for office moves */}
        {moveType === "office" && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Övriga utrymmen
            </h3>
            <p className="text-sm text-gray-600 mb-3">Välj vilka ytterligare utrymmen som ska flyttas:</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {additionalSpaces.map((space) => (
                <div
                  key={space.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedSpaces.includes(space.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                  onClick={() => handleSpaceToggle(space.id)}
                >
                  <div className="flex items-center">
                    <Checkbox
                      id={`space-${space.id}`}
                      checked={selectedSpaces.includes(space.id)}
                      className="mr-2"
                      // This is just visual - the actual toggle happens in the div onClick
                      onCheckedChange={() => {}}
                    />
                    <Label htmlFor={`space-${space.id}`} className="flex items-center cursor-pointer">
                      {space.icon}
                      <span className="ml-2 text-sm">{space.label}</span>
                    </Label>
                  </div>
                </div>
              ))}
            </div>

            {showOtherSpace && (
              <div className="mt-4">
                <Label htmlFor="otherSpace" className="text-sm font-medium">
                  Beskriv annat utrymme:
                </Label>
                <Input
                  id="otherSpace"
                  ref={otherSpaceRef}
                  defaultValue={formData.otherSpace || ""}
                  className="mt-1 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="T.ex. arkiv, showroom, etc."
                />
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="additionalInfo" className="text-sm font-medium">
                Övrig information om utrymmen:
              </Label>
              <Textarea
                id="additionalInfo"
                ref={additionalInfoRef}
                placeholder="Beskriv eventuella andra utrymmen eller speciella behov..."
                className="mt-1 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Elevator Options */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Hiss
          </h3>
          <p className="text-sm text-gray-600 mb-3">Finns det hiss i byggnaden och vilken typ?</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {elevatorOptions.map((elevator) => (
              <div
                key={elevator.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  officeElevator === elevator.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
                onClick={() => setOfficeElevator(elevator.id as "big" | "small" | "none")}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                      officeElevator === elevator.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {elevator.icon}
                  </div>
                  <span className={`text-sm font-medium ${officeElevator === elevator.id ? "text-blue-700" : ""}`}>
                    {elevator.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{elevator.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Move date */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Önskat flyttdatum
          </h3>
          <p className="text-sm text-gray-600 mb-3">När önskar ni genomföra flytten?</p>

          <div className="relative">
            <Input
              type="date"
              id="officeMoveDate"
              ref={moveDateRef}
              defaultValue={formData.officeMoveDate || ""}
              className={`w-full pl-10 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                formSubmitted && !moveDateRef.current?.value ? "border-red-500" : ""
              }`}
              min={today}
              required
            />
            <Calendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              size={18}
            />
          </div>
          {formSubmitted && !moveDateRef.current?.value && (
            <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
          )}

          <div className="flex items-center mt-3">
            <Checkbox
              id="dateFlexibility"
              checked={isDateFlexible}
              onCheckedChange={(checked) => setIsDateFlexible(!!checked)}
              className="mr-2"
            />
            <Label htmlFor="dateFlexibility" className="text-sm cursor-pointer flex items-center">
              <Clock className="w-4 h-4 mr-1 text-blue-600" />
              Flexibel med datum
            </Label>
          </div>

          {isDateFlexible && (
            <div className="mt-3">
              <Label htmlFor="flexibilityLevel" className="text-sm font-medium">
                Hur flexibla är ni?
              </Label>
              <Select value={dateFlexibility} onValueChange={(value) => setDateFlexibility(value)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Välj flexibilitetsnivå" />
                </SelectTrigger>
                <SelectContent>
                  {dateFlexibilityOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Flexibilitet med datum kan ofta ge bättre priser och tillgänglighet
              </p>
            </div>
          )}
        </div>

        {/* Loading Zone */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
            <Truck className="w-5 h-5 mr-2 text-blue-600" />
            Tillgång till lastzon/lättillgänglig parkering
          </h3>
          <p className="text-sm text-gray-600 mb-3">Finns det lastzon eller lättillgänglig parkering vid kontoret?</p>

          <div className="grid grid-cols-2 gap-3 mb-2">
            {[
              { id: true, label: "Ja", description: "Lastzon eller parkering finns" },
              { id: false, label: "Nej", description: "Ingen lastzon eller nära parkering" },
            ].map((option) => (
              <Card
                key={String(option.id)}
                className={`p-3 cursor-pointer transition-all relative ${
                  hasLoadingZone === option.id
                    ? "border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                    : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
                onClick={() => setHasLoadingZone(option.id as boolean)}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                      hasLoadingZone === option.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {option.id ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <span className={`text-sm font-medium ${hasLoadingZone === option.id ? "text-blue-700" : ""}`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                </div>
                {hasLoadingZone === option.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </Card>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1" />
            Detta hjälper oss planera logistiken och eventuellt behov av parkeringstillstånd
          </p>
        </div>
      </div>

      {/* Form validation error */}
      {formSubmitted && !validateForm() && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Formuläret är ofullständigt</p>
            <p className="text-sm">Vänligen fyll i alla obligatoriska fält markerade med röd kant för att fortsätta.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-10">
        <button type="button" onClick={handlePrevStep} className="back-button">
          Tillbaka
        </button>
        <button
          type="submit"
          className="next-button bg-blue-600 hover:bg-blue-700 flex items-center justify-center py-3 px-6 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Nästa
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </form>
  )
}
