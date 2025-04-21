"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowRight,
  Info,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  PenLine,
  Server,
  Monitor,
  Briefcase,
  PhoneCall,
  Box,
  Printer,
  Tag,
  Palette,
  FileSpreadsheet,
  Network,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  Archive,
  Sofa,
  Armchair,
  BookOpen,
  Coffee,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface OfficeInventoryProps {
  formData: {
    workstations?: string
    officeSizeSquareMeters?: string
    officeInventory?: { [key: string]: number }
    needsLabeling?: boolean
    labelingType?: string[]
    specialHandling?: string[]
    estimatedVolume?: number
    manualVolume?: string
    needsITSetup?: boolean
    additionalSpaces?: string[]
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
  moveType?: "office" | "store" // Add this to determine the type of move
}

// Now let's update the furniture items to include categories for better organization
const officeFurnitureCategories = [
  {
    id: "workstations",
    name: "Arbetsplatser",
    icon: <LayoutDashboard className="w-5 h-5" />,
    items: [
      { id: "desk_regular", name: "Skrivbord (vanliga)", volume: 1.0, icon: <PenLine className="w-4 h-4" /> },
      { id: "desk_adjustable", name: "Höj- & sänkbara skrivbord", volume: 1.2, icon: <PenLine className="w-4 h-4" /> },
      { id: "office_chair", name: "Kontorsstolar", volume: 0.3, icon: <Armchair className="w-4 h-4" /> },
      { id: "monitor", name: "Bildskärmar", volume: 0.2, icon: <Monitor className="w-4 h-4" /> },
    ],
  },
  {
    id: "storage",
    name: "Förvaring",
    icon: <Archive className="w-5 h-5" />,
    items: [
      { id: "file_cabinet", name: "Arkivskåp", volume: 1.5, icon: <Briefcase className="w-4 h-4" /> },
      { id: "bookshelf", name: "Bokhyllor", volume: 1.2, icon: <BookOpen className="w-4 h-4" /> },
      { id: "small_storage", name: "Småförvaring/skåp", volume: 0.5, icon: <Briefcase className="w-4 h-4" /> },
    ],
  },
  {
    id: "meeting",
    name: "Mötes- & Konferensrum",
    icon: <Briefcase className="w-5 h-5" />,
    items: [
      { id: "conference_table", name: "Konferensbord", volume: 2.5, icon: <PenLine className="w-4 h-4" /> },
      { id: "whiteboard", name: "Whiteboards", volume: 0.8, icon: <PenLine className="w-4 h-4" /> },
    ],
  },
  {
    id: "lounge",
    name: "Lounge & Sociala ytor",
    icon: <Sofa className="w-5 h-5" />,
    items: [
      { id: "sofa", name: "Soffor", volume: 2.0, icon: <Sofa className="w-4 h-4" /> },
      { id: "coffee_table", name: "Soffbord", volume: 0.8, icon: <Coffee className="w-4 h-4" /> },
      { id: "lounge_chair", name: "Loungefåtöljer", volume: 0.8, icon: <Armchair className="w-4 h-4" /> },
    ],
  },
  {
    id: "special",
    name: "Specialmöbler & Utrustning",
    icon: <Server className="w-5 h-5" />,
    items: [
      { id: "server_rack", name: "Serverrack", volume: 2.0, icon: <Server className="w-4 h-4" /> },
      { id: "phone_booth", name: "Telefonbås", volume: 1.5, icon: <PhoneCall className="w-4 h-4" /> },
      { id: "pods", name: "Poddar & moduler", volume: 2.5, icon: <Box className="w-4 h-4" /> },
      { id: "large_printer", name: "Stora skrivare/kopiatorer", volume: 1.2, icon: <Printer className="w-4 h-4" /> },
      { id: "plants", name: "Växter", volume: 0.3, icon: <PenLine className="w-4 h-4" /> },
    ],
  },
]

// Flatten the categories for when we need a simple list
const officeFurnitureItems = officeFurnitureCategories.flatMap((category) => category.items)

// Update special handling options with more detailed descriptions and tooltips
const specialHandlingOptions = [
  {
    id: "heavy_items",
    label: "Tunga föremål (över 100kg)",
    tooltip:
      "Föremål som kräver särskild utrustning eller fler personer för att flytta, t.ex. kassaskåp, stora skrivare eller tunga maskiner.",
  },
  {
    id: "it_equipment",
    label: "IT-utrustning",
    tooltip: "Servrar, datorer, nätverksutrustning och annan känslig elektronik som kräver särskild hantering.",
  },
  {
    id: "sensitive_documents",
    label: "Känsliga dokument",
    tooltip: "Sekretessbelagda eller viktiga dokument som kräver säker hantering och transport.",
  },
  {
    id: "fragile_items",
    label: "Glas eller sköra föremål",
    tooltip: "Föremål som lätt kan gå sönder och kräver extra skydd, t.ex. glasskivor, skärmar eller konstföremål.",
  },
  {
    id: "valuable_items",
    label: "Värdefulla föremål",
    tooltip: "Föremål med högt ekonomiskt eller affektivt värde som kräver extra försiktighet och försäkring.",
  },
  {
    id: "hazardous_materials",
    label: "Farligt material",
    tooltip:
      "Kemikalier, batterier, trycksatta behållare eller andra föremål som kräver särskild hantering enligt säkerhetsföreskrifter.",
  },
  {
    id: "large_printers",
    label: "Stora skrivare/kopiatorer",
    tooltip: "Kontorsskrivare som kräver demontering och särskild hantering för att undvika skador.",
  },
  {
    id: "cable_management",
    label: "Kabeldragning & IT-installation",
    tooltip: "Hjälp med att koppla ur, märka upp och återinstallera kablar och IT-utrustning.",
  },
]

// Förenkla beräkningsfunktionen
const calculateEstimatedVolume = (workstations: number, officeSize: number, extraSpaces: string[] = []): number => {
  // Ensure we have valid numbers
  workstations = Math.max(0, workstations)
  officeSize = Math.max(0, officeSize)

  // Base calculation - more weight to workstations for office moves
  let volume = officeSize * 0.3 + workstations * 2

  // Extra volume based on spaces
  const extraVolumeFactors: Record<string, number> = {
    conference: 5,
    kitchen: 3,
    storage: 4,
    server: 6,
    reception: 3,
    other: 2,
  }

  // Add volume for each extra space
  if (extraSpaces && extraSpaces.length > 0) {
    extraSpaces.forEach((space) => {
      if (extraVolumeFactors[space]) {
        volume += extraVolumeFactors[space]
      }
    })
  }

  // Ensure we have a minimum reasonable volume
  volume = Math.max(10, volume)

  // Round to one decimal place
  return Math.round(volume * 10) / 10
}

// Now let's update the main component
export default function OfficeInventory({
  formData,
  handleChange,
  nextStep,
  prevStep,
  moveType = "office",
}: OfficeInventoryProps) {
  const [inventory, setInventory] = useState<{ [key: string]: number }>(formData.officeInventory || {})
  const [needsLabeling, setNeedsLabeling] = useState<boolean>(formData.needsLabeling || false)
  const [labelingType, setLabelingType] = useState<string[]>(formData.labelingType || [])
  const [specialHandling, setSpecialHandling] = useState<string[]>(formData.specialHandling || [])
  const [estimatedVolume, setEstimatedVolume] = useState<number>(formData.estimatedVolume || 0)
  const [manualVolume, setManualVolume] = useState<string>(formData.manualVolume || "")
  const [isUsingManualVolume, setIsUsingManualVolume] = useState<boolean>(!!formData.manualVolume)
  const [calculatedVolume, setCalculatedVolume] = useState<number>(0)
  const [needsITSetup, setNeedsITSetup] = useState<boolean>(formData.needsITSetup || false)
  const [bulkItemId, setBulkItemId] = useState<string>("")
  const [bulkItemCount, setBulkItemCount] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("workstations")
  const [openCategories, setOpenCategories] = useState<string[]>(["workstations"])

  // New state for tracking if inventory has been modified
  const [inventoryModified, setInventoryModified] = useState<boolean>(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false)

  // Initialize estimated volume based on workstations and office size
  // Förenkla useEffect-hooks för att undvika potentiella oändliga loopar
  // Uppdatera useEffect för volymberäkning
  useEffect(() => {
    // Get values from formData, ensuring we have numbers
    const workstations = Number.parseInt(formData.workstations || "0") || 0
    const officeSize = Number.parseInt(formData.officeSizeSquareMeters || "0") || 0
    const extraSpaces = formData.additionalSpaces || []

    if (workstations > 0 || officeSize > 0) {
      // Calculate volume based on workstations and office size
      const volume = calculateEstimatedVolume(workstations, officeSize, extraSpaces)

      // Only update if not using manual volume and inventory hasn't been modified
      if (!isUsingManualVolume && !inventoryModified) {
        setEstimatedVolume(volume)
        if (!formData.estimatedVolume) {
          handleChange("estimatedVolume", volume)
        }
      }
    }
  }, [
    formData.workstations,
    formData.officeSizeSquareMeters,
    formData.additionalSpaces,
    formData.estimatedVolume,
    handleChange,
    isUsingManualVolume,
    inventoryModified,
  ])

  // Calculate volume based on inventory
  useEffect(() => {
    let totalVolume = 0

    Object.entries(inventory).forEach(([itemId, count]) => {
      const item = officeFurnitureItems.find((item) => item.id === itemId)
      if (item) {
        totalVolume += item.volume * count
      }
    })

    setCalculatedVolume(Math.round(totalVolume * 10) / 10)

    // If using inventory-based calculation, update the estimated volume
    if (Object.keys(inventory).length > 0 && !isUsingManualVolume && inventoryModified) {
      setEstimatedVolume(Math.round(totalVolume * 10) / 10)
      handleChange("estimatedVolume", Math.round(totalVolume * 10) / 10)
    }
  }, [inventory, isUsingManualVolume, handleChange, inventoryModified])

  // Toggle category open/closed
  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  // Update inventory count with improved feedback
  const updateInventoryCount = (itemId: string, count: number) => {
    const newInventory = { ...inventory }

    if (count <= 0) {
      delete newInventory[itemId]
    } else {
      newInventory[itemId] = count
    }

    setInventory(newInventory)
    handleChange("officeInventory", newInventory)

    // Mark that inventory has been modified
    setInventoryModified(true)

    // If using manual volume, reset to automatic calculation
    if (isUsingManualVolume) {
      setIsUsingManualVolume(false)
      setManualVolume("")
      handleChange("manualVolume", "")

      // Show reset confirmation
      setShowResetConfirmation(true)
      setTimeout(() => {
        setShowResetConfirmation(false)
      }, 3000)
    }
  }

  // Toggle special handling option
  const toggleSpecialHandling = (optionId: string) => {
    let newSpecialHandling = [...specialHandling]

    if (newSpecialHandling.includes(optionId)) {
      newSpecialHandling = newSpecialHandling.filter((id) => id !== optionId)
    } else {
      newSpecialHandling.push(optionId)
    }

    setSpecialHandling(newSpecialHandling)
    handleChange("specialHandling", newSpecialHandling)
  }

  // Handle manual volume input with improved feedback
  const handleManualVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualVolume(value)

    if (value && !isNaN(Number(value))) {
      setIsUsingManualVolume(true)
      setEstimatedVolume(Number(value))
      handleChange("manualVolume", value)
      handleChange("estimatedVolume", Number(value))
    } else {
      setIsUsingManualVolume(false)
      handleChange("manualVolume", "")
    }
  }

  // Reset to automatic estimation with improved feedback
  const resetToAutomaticEstimation = () => {
    setIsUsingManualVolume(false)
    setManualVolume("")

    // Calculate based on inventory if available, otherwise use workstation/size calculation
    if (calculatedVolume > 0 && inventoryModified) {
      setEstimatedVolume(calculatedVolume)
      handleChange("estimatedVolume", calculatedVolume)
    } else {
      const workstations = Number.parseInt(formData.workstations || "0", 10) || 0
      const officeSize = Number.parseInt(formData.officeSizeSquareMeters || "0", 10) || 0
      const extraSpaces = formData.additionalSpaces || []
      const volume = calculateEstimatedVolume(workstations, officeSize, extraSpaces)

      setEstimatedVolume(volume)
      handleChange("estimatedVolume", volume)
    }

    handleChange("manualVolume", "")

    // Show reset confirmation
    setShowResetConfirmation(true)
    setTimeout(() => {
      setShowResetConfirmation(false)
    }, 3000)
  }

  // Add this function to handle bulk item addition
  const handleBulkItemAdd = () => {
    if (bulkItemId && bulkItemCount && !isNaN(Number.parseInt(bulkItemCount, 10))) {
      const count = Number.parseInt(bulkItemCount, 10)
      if (count > 0) {
        updateInventoryCount(bulkItemId, (inventory[bulkItemId] || 0) + count)
        setBulkItemId("")
        setBulkItemCount("")
      }
    }
  }

  // Add this function to toggle labeling types
  const toggleLabelingType = (type: string) => {
    let newTypes = [...labelingType]

    if (newTypes.includes(type)) {
      newTypes = newTypes.filter((t) => t !== type)
    } else {
      newTypes.push(type)
    }

    setLabelingType(newTypes)
    handleChange("labelingType", newTypes)
  }

  // Add this function to handle IT setup change
  const handleITSetupChange = (value: boolean) => {
    setNeedsITSetup(value)
    handleChange("needsITSetup", value)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Save all data to formData
    handleChange("officeInventory", inventory)
    handleChange("needsLabeling", needsLabeling)
    handleChange("labelingType", labelingType)
    handleChange("specialHandling", specialHandling)
    handleChange("estimatedVolume", estimatedVolume)
    handleChange("manualVolume", isUsingManualVolume ? manualVolume : "")
    handleChange("needsITSetup", needsITSetup)

    nextStep()
  }

  // Get total count of items in inventory
  const getTotalItemCount = () => {
    return Object.values(inventory).reduce((sum, count) => sum + count, 0)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">
        Inventering för {moveType === "office" ? "kontorsflytt" : "butiksflytt"}
      </h2>

      {/* Estimated Volume Section - Enhanced with better visual feedback */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-200 shadow-sm">
        <div className="flex items-start">
          <div className="flex-grow">
            <div className="mb-3 font-medium text-lg flex items-center">
              <span className={isUsingManualVolume ? "text-gray-500" : "text-blue-800"}>
                Uppskattad flyttvolym: <span className="font-bold text-xl">{estimatedVolume.toFixed(1)} m³</span>
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline-block w-4 h-4 ml-2 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {isUsingManualVolume
                      ? "Du har angett en manuell volym. Återställ för att använda automatisk beräkning."
                      : inventoryModified
                        ? "Denna volym beräknas baserat på din möbelinventering."
                        : "Denna volym beräknas automatiskt baserat på kontorsyta och antal arbetsplatser."}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {showResetConfirmation && (
              <div className="mb-3 p-2 bg-green-100 text-green-800 rounded-md text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Volymen har återställts till automatisk beräkning.
              </div>
            )}

            <p className="text-sm text-gray-600 mb-3">
              {isUsingManualVolume
                ? "Du har angett en manuell volym. Systemet kommer inte att uppdatera volymen automatiskt."
                : inventoryModified
                  ? "Volymen uppdateras automatiskt baserat på din möbelinventering."
                  : "Volymen beräknas baserat på kontorsyta och antal arbetsplatser. Du kan justera genom att ange specifika möbler nedan."}
            </p>

            {/* Manual Volume Input - Enhanced with better feedback */}
            <div className="mt-3 flex items-end">
              <div>
                <Label htmlFor="manualVolume" className="block text-sm font-medium mb-1">
                  Ange exakt flyttvolym manuellt:
                </Label>
                <div className="flex items-center">
                  <Input
                    type="number"
                    id="manualVolume"
                    value={manualVolume}
                    onChange={handleManualVolumeChange}
                    className={`w-32 mr-2 ${isUsingManualVolume ? "border-blue-400 bg-white" : "bg-gray-50"}`}
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                  />
                  <span>m³</span>
                </div>
              </div>

              {isUsingManualVolume && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToAutomaticEstimation}
                  className="ml-3 mb-0.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Återställ
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Office Furniture Inventory - Enhanced with tabs and categories */}
      <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Box className="w-5 h-5 mr-2 text-blue-600" />
          Möbelinventering
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ange antal av varje möbeltyp som ska flyttas för en mer exakt uppskattning.
        </p>

        {/* Tabs for furniture categories - Improved with better overflow handling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          {/* Förenkla scrollfunktionen för att undvika potentiella problem */}
          <div className="relative mb-2">
            {/* Left scroll indicator - moved further left */}
            <button
              type="button"
              onClick={() => {
                const container = document.getElementById("tabs-container")
                if (container) container.scrollLeft -= 150
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-blue-50 transition-colors -ml-6"
              aria-label="Scrolla vänster"
            >
              <ChevronLeft className="h-5 w-5 text-blue-600" />
            </button>

            {/* Right scroll indicator - moved further right */}
            <button
              type="button"
              onClick={() => {
                const container = document.getElementById("tabs-container")
                if (container) container.scrollLeft += 150
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-blue-50 transition-colors -mr-6"
              aria-label="Scrolla höger"
            >
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </button>

            {/* Scrollable tabs container */}
            <div
              id="tabs-container"
              className="overflow-x-auto pb-2 hide-scrollbar px-6" // Added padding to make space for arrows
              style={{
                scrollBehavior: "smooth",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <TabsList className="w-max flex border border-gray-200 rounded-lg p-2 bg-gray-50 space-x-1">
                {officeFurnitureCategories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className={`flex items-center whitespace-nowrap px-4 py-2 rounded-md transition-all mx-1 min-w-[110px] ${
                      activeTab === category.id
                        ? "bg-white text-blue-700 shadow-sm border-b-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`${activeTab === category.id ? "text-blue-700" : "text-gray-500"} mr-2`}>
                      {category.icon}
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Förenkla hjälptexten */}
          <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
            <div className="flex items-center">
              <span>Använd pilarna för att navigera mellan kategorier</span>
            </div>
            <div>{getTotalItemCount()} föremål tillagda</div>
          </div>

          {officeFurnitureCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4" id={`section-${category.id}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-4 border ${inventory[item.id] ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mr-3">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-xs text-gray-500">{item.volume} m³ per st</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          onClick={() => updateInventoryCount(item.id, Math.max(0, (inventory[item.id] || 0) - 1))}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{inventory[item.id] || 0}</span>
                        <Button
                          type="button"
                          onClick={() => updateInventoryCount(item.id, (inventory[item.id] || 0) + 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Add CSS for hiding scrollbar */}
        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Alternative collapsible view for furniture categories */}
        <div className="sm:hidden mt-6">
          <h4 className="text-sm font-medium mb-3">Alternativ vy:</h4>
          {officeFurnitureCategories.map((category) => (
            <Collapsible
              key={category.id}
              open={openCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
              className="mb-3"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                <div className="flex items-center">
                  {category.icon}
                  <span className="ml-2 font-medium">{category.name}</span>
                </div>
                {openCategories.includes(category.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <Card
                      key={item.id}
                      className={`p-3 border ${inventory[item.id] ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mr-2">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.volume} m³</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            onClick={() => updateInventoryCount(item.id, Math.max(0, (inventory[item.id] || 0) - 1))}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">{inventory[item.id] || 0}</span>
                          <Button
                            type="button"
                            onClick={() => updateInventoryCount(item.id, (inventory[item.id] || 0) + 1)}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Inventory summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Sammanfattning</h4>
              <p className="text-sm text-gray-600">
                {getTotalItemCount()} föremål tillagda, total volym:{" "}
                <span className="font-semibold">{calculatedVolume.toFixed(1)} m³</span>
              </p>
            </div>
            {inventoryModified && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInventory({})
                  handleChange("officeInventory", {})
                  setInventoryModified(false)
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Rensa alla
              </Button>
            )}
          </div>
        </div>

        {/* Bulk add section */}
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Lägg till flera möbler samtidigt</h4>
          <div className="flex items-end space-x-2">
            <div className="flex-grow">
              <Label htmlFor="bulk-item" className="text-sm mb-1 block">
                Möbeltyp
              </Label>
              <Select value={bulkItemId} onValueChange={setBulkItemId}>
                <SelectTrigger id="bulk-item">
                  <SelectValue placeholder="Välj möbeltyp" />
                </SelectTrigger>
                <SelectContent>
                  {officeFurnitureItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bulk-count" className="text-sm mb-1 block">
                Antal
              </Label>
              <Input
                id="bulk-count"
                type="number"
                value={bulkItemCount}
                onChange={(e) => setBulkItemCount(e.target.value)}
                className="w-24"
                min="1"
              />
            </div>
            <Button
              type="button"
              onClick={handleBulkItemAdd}
              disabled={
                !bulkItemId ||
                !bulkItemCount ||
                isNaN(Number.parseInt(bulkItemCount, 10)) ||
                Number.parseInt(bulkItemCount, 10) <= 0
              }
            >
              Lägg till
            </Button>
          </div>
        </div>
      </div>

      {/* Labeling Section - Enhanced with better visual separation - Only show for office moves */}
      {moveType === "office" && (
        <div className="mb-8 bg-purple-50 p-6 rounded-lg border border-purple-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-purple-600" />
            Märkning av möbler & utrustning
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Behöver ni hjälp med att märka upp möbler och utrustning för att underlätta placeringen i de nya lokalerna?
          </p>

          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-white">
            <Checkbox
              id="needsLabeling"
              checked={needsLabeling}
              onCheckedChange={(checked) => {
                setNeedsLabeling(!!checked)
                handleChange("needsLabeling", !!checked)
                if (!checked) {
                  setLabelingType([])
                  handleChange("labelingType", [])
                }
              }}
            />
            <Label htmlFor="needsLabeling" className="cursor-pointer">
              Ja, vi behöver hjälp med märkning av möbler och utrustning
            </Label>
          </div>

          {needsLabeling && (
            <div className="mt-4 p-4 border rounded-lg bg-white">
              <h4 className="font-medium mb-3">Hur vill ni märka möblerna?</h4>
              <p className="text-sm text-gray-600 mb-3">Välj ett eller flera alternativ:</p>

              <div className="space-y-4">
                <div className="p-3 border rounded-lg bg-white hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-2 mb-1">
                    <Checkbox
                      id="labeling-name"
                      checked={labelingType.includes("name_dept")}
                      onCheckedChange={(checked) => toggleLabelingType("name_dept")}
                    />
                    <Label htmlFor="labeling-name" className="cursor-pointer flex items-center font-medium">
                      <Tag className="w-4 h-4 mr-2 text-purple-600" />
                      Etiketter med namn & avdelning
                    </Label>
                  </div>
                  <div className="ml-7 text-sm text-gray-600">
                    T.ex. "Ekonomi – Skrivbord 1".{" "}
                    <span className="text-purple-700">Perfekt för stora kontor med många team och avdelningar.</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-white hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-2 mb-1">
                    <Checkbox
                      id="labeling-color"
                      checked={labelingType.includes("color_coding")}
                      onCheckedChange={(checked) => toggleLabelingType("color_coding")}
                    />
                    <Label htmlFor="labeling-color" className="cursor-pointer flex items-center font-medium">
                      <Palette className="w-4 h-4 mr-2 text-purple-600" />
                      Färgmärkning per avdelning
                    </Label>
                  </div>
                  <div className="ml-7 text-sm text-gray-600">
                    Olika färger för olika team.{" "}
                    <span className="text-purple-700">
                      Snabb visuell identifiering, idealisk för öppna kontorslandskap.
                    </span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-white hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-2 mb-1">
                    <Checkbox
                      id="labeling-list"
                      checked={labelingType.includes("numbered_list")}
                      onCheckedChange={(checked) => toggleLabelingType("numbered_list")}
                    />
                    <Label htmlFor="labeling-list" className="cursor-pointer flex items-center font-medium">
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-purple-600" />
                      Numrerad lista med placering
                    </Label>
                  </div>
                  <div className="ml-7 text-sm text-gray-600">
                    Excel/PDF med info om varje möbelplacering.{" "}
                    <span className="text-purple-700">
                      Bra om ni redan har en sittplan och vill hålla ordning på exakt placering.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Special Handling Section - Enhanced with tooltips and better descriptions - Only show for office moves */}
      {moveType === "office" && (
        <div className="mb-8 bg-amber-50 p-6 rounded-lg border border-amber-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
            Specialhantering
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Finns det föremål som kräver särskild hantering? Välj alla som gäller.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {specialHandlingOptions.map((option) => (
              <TooltipProvider key={option.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        specialHandling.includes(option.id)
                          ? "border-amber-500 bg-amber-100"
                          : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 bg-white"
                      }`}
                      onClick={() => toggleSpecialHandling(option.id)}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          id={`special-${option.id}`}
                          checked={specialHandling.includes(option.id)}
                          className="mr-2"
                          // This is just visual - the actual toggle happens in the div onClick
                          onCheckedChange={() => {}}
                        />
                        <Label htmlFor={`special-${option.id}`} className="cursor-pointer flex items-center">
                          {option.label}
                          <HelpCircle className="w-3.5 h-3.5 ml-1.5 text-amber-500" />
                        </Label>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{option.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {specialHandling.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded-md border border-amber-200">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                <p className="text-sm font-medium text-amber-800">
                  Tack för informationen! Vi kommer att kontakta er för att diskutera specialhanteringen av dessa
                  föremål.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {specialHandling.includes("it_equipment") && moveType === "office" && (
        <div className="mb-8 p-6 border rounded-lg bg-blue-50 border-blue-200 shadow-sm">
          <h4 className="font-medium mb-3 flex items-center">
            <Network className="w-5 h-5 mr-2 text-blue-600" />
            IT-installation i nya lokaler
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Behöver ni hjälp med att koppla upp datorer och nätverk i det nya kontoret?
          </p>

          <RadioGroup
            value={needsITSetup ? "yes" : "no"}
            onValueChange={(value) => handleITSetupChange(value === "yes")}
          >
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="it-setup-yes" />
                <Label htmlFor="it-setup-yes">Ja, vi behöver hjälp med IT-installation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="it-setup-no" />
                <Label htmlFor="it-setup-no">Nej, vi hanterar IT-installationen själva</Label>
              </div>
            </div>
          </RadioGroup>

          {needsITSetup && (
            <div className="mt-4 p-3 bg-white rounded-md border border-blue-200">
              <p className="text-sm text-blue-700">
                <Info className="w-4 h-4 inline-block mr-1" />
                Vi kommer att kontakta er för att diskutera era specifika IT-behov och planera installationen.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced CTA buttons with better hierarchy */}
      <div className="flex justify-between mt-10">
        <button
          type="button"
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm"
        >
          Tillbaka
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center transform hover:scale-105"
        >
          Nästa steg
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </form>
  )
}
