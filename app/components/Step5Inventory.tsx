"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Info, AlertCircle, CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ItemCategory {
  title: string
  items: {
    name: string
    description: string
    volume: number
  }[]
}

const inventoryCategories: ItemCategory[] = [
  {
    title: "Small (0-1m3)",
    items: [
      { name: "Flyttkartonger", description: "Standardstorlek", volume: 0.1 },
      { name: "Tavlor", description: "Olika storlekar", volume: 0.2 },
      { name: "Speglar", description: "Små till medelstora", volume: 0.3 },
      { name: "Lampor", description: "Golvlampor och bordslampor", volume: 0.3 },
      { name: "Mindre elektronik", description: "TV upp till 32 tum, högtalare, datorer, mikrovågsugn", volume: 0.4 },
      { name: "Små sidobord", description: "Olika typer", volume: 0.5 },
      { name: "Stolar", description: "Enkla köks- eller matstolar", volume: 0.3 },
      { name: "Små förvaringslådor", description: "Olika storlekar", volume: 0.2 },
      { name: "Skohyllor", description: "Olika modeller", volume: 0.4 },
      { name: "Hattar och paraplyställ", description: "Olika typer", volume: 0.2 },
      { name: "Köksredskap", description: "T.ex. mindre ugnsformar, kaffebryggare", volume: 0.3 },
      { name: "Cykel", description: "Ihopfällbar eller barncykel", volume: 0.5 },
    ],
  },
  {
    title: "Medium (1-2m3)",
    items: [
      { name: "Soffa", description: "2-sits", volume: 1.5 },
      { name: "Fåtölj", description: "Standard", volume: 1.0 },
      { name: "Matbord", description: "Litet, för 2-4 personer", volume: 1.5 },
      { name: "Bokhylla", description: "Mindre, 3 hyllor", volume: 1.2 },
      { name: "TV", description: "Större än 32 tum", volume: 1.2 },
      { name: "Madrass", description: "Enkelsäng", volume: 1.0 },
      { name: "Barnsäng/spjälsäng", description: "Standard", volume: 1.2 },
      { name: "Små byråer", description: "T.ex. IKEA Malm med 2 lådor", volume: 1.4 },
      { name: "Vitrinskåp", description: "Mindre storlek", volume: 1.5 },
      { name: "Små garderober", description: "Olika modeller", volume: 1.8 },
      { name: "Cykel", description: "Vuxencykel", volume: 1.0 },
      { name: "Grill", description: "Standardstorlek, ej gasoltank", volume: 1.2 },
      { name: "Skrivbord", description: "Medelstorlek", volume: 1.5 },
    ],
  },
  {
    title: "Large (2-4m3)",
    items: [
      { name: "Soffa", description: "3-sits eller hörnsoffa", volume: 3.0 },
      { name: "Matbord", description: "Stort, för 6-8 personer", volume: 3.0 },
      { name: "Bokhylla", description: "Stor, 5 hyllor eller mer", volume: 2.5 },
      { name: "Garderob", description: "Stor, t.ex. IKEA Pax", volume: 3.0 },
      { name: "Sängram med madrass", description: "Dubbelsäng", volume: 3.5 },
      { name: "Skrivbord", description: "Stort, t.ex. arbetsstationer", volume: 2.5 },
      { name: "TV-bänk", description: "Stor eller mediecenter", volume: 2.5 },
      { name: "Skåp eller vitrinskåp", description: "Fullhöjd", volume: 3.0 },
      { name: "Piano", description: "Elektroniskt eller mindre stående", volume: 3.5 },
      { name: "Träningsutrustning", description: "Löpband, roddmaskin, eller motionscykel", volume: 3.5 },
      { name: "Kylskåp/frys", description: "Standard", volume: 2.5 },
      { name: "Tvättmaskin eller torktumlare", description: "Standard", volume: 2.5 },
      { name: "Gasolgrill", description: "Eller större grillar", volume: 2.5 },
      { name: "L-soffa", description: "Delad eller ihopsatt", volume: 4.0 },
    ],
  },
  {
    title: "Specialföremål (över 4m3)",
    items: [
      { name: "Flygelpiano", description: "Standard", volume: 4.5 },
      { name: "Stort kassaskåp", description: "Olika modeller", volume: 4.2 },
      { name: "Jacuzzi", description: "Standardstorlek", volume: 5.0 },
      { name: "Trädgårdsmöbler", description: "Stora set, t.ex. bord och 6-8 stolar", volume: 4.5 },
      { name: "Stora skåp/vitrinskåp", description: "T.ex. antikviteter eller massiva möbler", volume: 4.5 },
      { name: "Större L- eller U-formade soffor", description: "Olika modeller", volume: 4.5 },
      { name: "Poolutrustning", description: "T.ex. större filter eller uppblåsbar pool", volume: 4.5 },
      { name: "Terrassvärmare", description: "Stora stående", volume: 4.2 },
      { name: "Lekstuga/Trädkoja", description: "Olika modeller", volume: 5.0 },
      { name: "Växthus", description: "Mindre demonterbart", volume: 4.8 },
      { name: "Båt på trailer", description: "Mindre motorbåt eller segelbåt", volume: 5.0 },
      { name: "Trädgårdsmaskiner", description: "T.ex. åkgräsklippare", volume: 4.5 },
      { name: "Mindre maskiner", description: "T.ex. snickeribänk, industrimaskiner", volume: 4.2 },
    ],
  },
]

interface Step5Props {
  formData: {
    selectedItems: { [key: string]: number }
    startLivingArea: string
    estimatedVolume?: string
    startPropertyType?: string
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
}

// 🔧 FIXAD VOLYMBERÄKNING - Nu med magasin, villa och lägenhet-logik
const calculateEstimatedVolume = (livingArea: number, propertyType?: string): number => {
  // 📦 MAGASIN/LAGER - Fast 3 meter takhöjd
  if (propertyType === "storage") {
    const volume = Math.ceil(livingArea * 3.0); // kvm × 3m höjd
    console.log('📦 Step5 Magasin volymberäkning:', {
      kvm: livingArea,
      takhöjd: '3.0m',
      beräknadVolym: volume,
      formel: `${livingArea} kvm × 3.0m = ${volume} m³`
    });
    return volume;
  }
  
  // 🏘️ VILLA/RADHUS - Mer volym än lägenhet (fler rum, källare, vind)
  if (propertyType === "house") {
    let volume;
    if (livingArea <= 50) volume = 19;       // Litet radhus
    else if (livingArea <= 70) volume = 28;  // Medel radhus  
    else if (livingArea <= 100) volume = 38; // Stor radhus
    else if (livingArea <= 130) volume = 57; // Liten villa
    else if (livingArea <= 160) volume = 76; // Medel villa
    else if (livingArea <= 200) volume = 95; // Stor villa
    else volume = Math.ceil(livingArea * 0.5); // 0.5 m³/kvm för jättestora villor
    
    console.log('🏘️ Step5 Villa/Radhus volymberäkning:', {
      kvm: livingArea,
      beräknadVolym: volume,
      volymPerKvm: (volume / livingArea).toFixed(2) + ' m³/kvm'
    });
    return volume;
  }
  
  // 🏢 LÄGENHET - Ursprunglig beräkning
  let volume;
  if (livingArea <= 20) volume = 5;
  else if (livingArea <= 35) volume = 10;
  else if (livingArea <= 50) volume = 15;
  else if (livingArea <= 70) volume = 19;
  else if (livingArea <= 95) volume = 28;
  else if (livingArea <= 130) volume = 38;
  else volume = 57;
  
  console.log('🏢 Step5 Lägenhet volymberäkning:', {
    kvm: livingArea,
    beräknadVolym: volume,
    volymPerKvm: (volume / livingArea).toFixed(2) + ' m³/kvm'
  });
  
  return volume;
}

export default function Step5Inventory({ formData, handleChange, nextStep, prevStep }: Step5Props) {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>(formData.selectedItems || {})
  const [showFurnitureCalculator, setShowFurnitureCalculator] = useState(false)
  const [estimatedVolume, setEstimatedVolume] = useState(0)
  const [calculatedVolume, setCalculatedVolume] = useState(0)
  const [showManualVolumeInput, setShowManualVolumeInput] = useState(false)
  const [manualVolume, setManualVolume] = useState("")
  const [isManualVolumeEmpty, setIsManualVolumeEmpty] = useState(false)
  const [isUsingAutomaticEstimation, setIsUsingAutomaticEstimation] = useState(true)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [hasFurnitureSelections, setHasFurnitureSelections] = useState(false)

  // 🔧 FIXAD - Använd redan beräknad volym från Step4 när möjligt
  const getAutomaticEstimation = () => {
    const livingArea = Number.parseInt(formData.startLivingArea) || 0;
    
    // 🔧 PRIORITET 1: Använd redan beräknad volym från Step4 om den finns
    if (formData.estimatedVolume && Number(formData.estimatedVolume) > 0) {
      const existingVolume = Number(formData.estimatedVolume);
      console.log('✅ Step5 använder redan beräknad volym från Step4:', {
        volym: existingVolume,
        källa: 'Step4 (magasin/villa/lägenhet-beräkning)'
      });
      return existingVolume;
    }
    
    // 🔧 PRIORITET 2: Annars beräkna baserat på bostadstyp och living area
    const propertyType = formData.startPropertyType;
    const calculatedVolume = calculateEstimatedVolume(livingArea, propertyType);
    
    console.log('🔄 Step5 beräknar ny volym:', {
      livingArea,
      propertyType,
      calculatedVolume,
      anledning: 'Ingen volym från Step4 hittades'
    });
    
    return calculatedVolume;
  }

  useEffect(() => {
    // Set the initial estimated volume based on living area and property type
    const automaticVolume = getAutomaticEstimation();
    setEstimatedVolume(automaticVolume);
    
    // 🔧 NYTT: Uppdatera formData med rätt volym om den inte finns
    if (!formData.estimatedVolume || Number(formData.estimatedVolume) !== automaticVolume) {
      handleChange("estimatedVolume", automaticVolume.toString());
    }
  }, [formData.startLivingArea, formData.startPropertyType, formData.estimatedVolume])

  // Check if there are any furniture selections
  useEffect(() => {
    setHasFurnitureSelections(Object.keys(selectedItems).length > 0)
  }, [selectedItems])

  const updateItemCount = (itemName: string, count: number) => {
    const newSelection = { ...selectedItems }
    if (count === 0) {
      delete newSelection[itemName]
    } else {
      newSelection[itemName] = count
    }
    setSelectedItems(newSelection)
    handleChange("selectedItems", newSelection)

    // Calculate total volume from furniture calculator
    let totalVolume = 0
    Object.entries(newSelection).forEach(([itemName, count]) => {
      const item = inventoryCategories.flatMap((cat) => cat.items).find((i) => i.name === itemName)
      if (item) {
        totalVolume += item.volume * count
      }
    })
    setCalculatedVolume(totalVolume)

    // If using furniture calculator, update the estimated volume
    if (showFurnitureCalculator && totalVolume > 0) {
      setEstimatedVolume(totalVolume)
      setManualVolume("")
      setShowManualVolumeInput(false)
      setIsUsingAutomaticEstimation(false)
    }
  }

  const calculateTotalVolume = () => {
    let totalVolume = 0
    Object.entries(selectedItems).forEach(([itemName, count]) => {
      const item = inventoryCategories.flatMap((cat) => cat.items).find((i) => i.name === itemName)
      if (item) {
        totalVolume += item.volume * count
      }
    })
    return totalVolume
  }

  const handleManualVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualVolume(value)

    // Check if the field is empty or zero
    setIsManualVolumeEmpty(value === "" || value === "0")

    if (value && !isNaN(Number(value))) {
      const numValue = Number(value)
      setEstimatedVolume(numValue)
      setIsUsingAutomaticEstimation(false)

      // Clear furniture calculator selections when manual volume is used
      if (Object.keys(selectedItems).length > 0) {
        setSelectedItems({})
        handleChange("selectedItems", {})
      }
    }
  }

  const toggleManualVolumeInput = () => {
    setShowManualVolumeInput(!showManualVolumeInput)

    if (!showManualVolumeInput) {
      // Switching to manual input
      setShowFurnitureCalculator(false)
      setIsUsingAutomaticEstimation(false)
    } else {
      // Switching back to automatic estimation
      resetToAutomaticEstimation()
    }
  }

  const resetToAutomaticEstimation = () => {
    // Reset to automatic estimation
    setManualVolume("")
    setShowManualVolumeInput(false)
    setIsManualVolumeEmpty(false)
    setIsUsingAutomaticEstimation(true)

    // Reset the estimated volume to the automatic calculation
    const automaticVolume = getAutomaticEstimation()
    setEstimatedVolume(automaticVolume)

    // Clear any furniture calculator selections
    if (Object.keys(selectedItems).length > 0) {
      setSelectedItems({})
      handleChange("selectedItems", {})
    }

    // Show confirmation message
    setShowResetConfirmation(true)

    // Hide confirmation after 5 seconds
    setTimeout(() => {
      setShowResetConfirmation(false)
    }, 5000)
  }

  const toggleFurnitureCalculator = () => {
    setShowFurnitureCalculator(!showFurnitureCalculator)
    if (!showFurnitureCalculator) {
      setShowManualVolumeInput(false)
      setManualVolume("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Vad ska vi flytta?</h2>

      {showResetConfirmation && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Vi har nu återställt volymen till den automatiska uppskattningen baserad på din bostadsyta.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <div className="flex-grow">
            <div className="mb-2 font-medium">
              Baserat på din bostadsyta har vi uppskattat din flyttvolym till {estimatedVolume.toFixed(1)} m³
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline-block w-4 h-4 ml-1 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {formData.startPropertyType === "storage" 
                      ? "För magasin räknar vi med 3 meters takhöjd (kvm × 3.0 = m³). Du kan justera genom att använda vår möbelkalkylator."
                      : formData.startPropertyType === "house"
                      ? "För villa/radhus räknar vi med mer volym än lägenheter pga fler rum, källare och vind. Du kan justera genom att använda vår möbelkalkylator."
                      : "Denna uppskattning baseras på genomsnittliga flyttvolymer för din bostadstyp. Du kan justera genom att använda vår möbelkalkylator."
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-gray-600">
              {isUsingAutomaticEstimation
                ? "De flesta kunder använder denna uppskattning, men du kan justera genom att välja möbler eller ange exakt volym."
                : "Du använder nu en anpassad volym. Du kan återgå till den automatiska uppskattningen när som helst."}
            </p>
            
            {/* 🔧 BORTTAGET: Den gröna magasin-texten är nu helt borttagen */}
          </div>
        </div>

        {showManualVolumeInput ? (
          <div className="mt-3">
            <label htmlFor="manualVolume" className="block text-sm font-medium mb-1">
              Ange din exakta flyttvolym (m³):
            </label>
            <div className="flex items-center">
              <Input
                type="number"
                id="manualVolume"
                value={manualVolume}
                onChange={handleManualVolumeChange}
                className="w-32 mr-2"
                placeholder="0.0"
                min="0"
                step="0.1"
              />
              <span>m³</span>
            </div>

            {isManualVolumeEmpty && (
              <div className="flex items-center mt-2 text-blue-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">
                  Om du vill återgå till den automatiska uppskattningen,
                  <button type="button" onClick={resetToAutomaticEstimation} className="underline ml-1 font-medium">
                    klicka här
                  </button>
                  .
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={resetToAutomaticEstimation}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-3 underline block"
            >
              Ångra och använd den automatiska uppskattningen istället
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleManualVolumeInput}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 underline"
          >
            Vill du ange din exakta volym istället?
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={toggleFurnitureCalculator}
            className={`text-blue-600 hover:text-blue-800 font-medium ${showManualVolumeInput ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={showManualVolumeInput}
          >
            {showFurnitureCalculator ? "Dölj möbelkalkylator" : "Visa möbelkalkylator"}
            {showFurnitureCalculator ? " ↑" : " ↓"}
          </button>

          {hasFurnitureSelections && !isUsingAutomaticEstimation && (
            <button
              type="button"
              onClick={resetToAutomaticEstimation}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Ångra och använd den automatiska uppskattningen istället
            </button>
          )}
        </div>

        {showManualVolumeInput && (
          <p className="text-xs text-gray-500 mt-1">
            Möbelkalkylatorn är inaktiverad när du anger exakt volym manuellt.
          </p>
        )}
      </div>

      {showFurnitureCalculator && (
        <div className="mb-8">
          {inventoryCategories.map((category) => (
            <div key={category.title} className="mb-6">
              <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <Card key={item.name} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          onClick={() => updateItemCount(item.name, Math.max(0, (selectedItems[item.name] || 0) - 1))}
                          variant="outline"
                          size="sm"
                        >
                          -
                        </Button>
                        <span>{selectedItems[item.name] || 0}</span>
                        <Button
                          type="button"
                          onClick={() => updateItemCount(item.name, (selectedItems[item.name] || 0) + 1)}
                          variant="outline"
                          size="sm"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <p className="font-semibold">Total beräknad volym: {calculateTotalVolume().toFixed(1)} m³</p>

            {hasFurnitureSelections && (
              <button
                type="button"
                onClick={resetToAutomaticEstimation}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                Återställ till automatisk uppskattning
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button type="button" onClick={prevStep} className="back-button bg-gray-200 hover:bg-gray-300 text-gray-700">
          Tillbaka
        </button>
        <button type="submit" className="next-button bg-secondary hover:bg-secondary/90">
          Nästa
        </button>
      </div>
    </form>
  )
}