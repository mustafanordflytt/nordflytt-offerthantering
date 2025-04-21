"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Home, Clock, Building2, MapPin, AlertTriangle, Info, Warehouse, Calendar, Map, ArrowDown, ArrowUp, ArrowRight, ArrowLeft } from "lucide-react"
import { LargeElevatorIcon, SmallElevatorIcon, StairsIcon } from "./icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ElevatorOption {
  id: "big" | "small" | "none"
  icon: React.ReactNode
  label: string
  description: string
}

const elevatorOptions: ElevatorOption[] = [
  {
    id: "big",
    icon: <LargeElevatorIcon />,
    label: "Fullstor hiss",
    description: "Rymmer större möbler",
  },
  {
    id: "small",
    icon: <SmallElevatorIcon />,
    label: "Liten hiss",
    description: "Kan rymma mindre föremål",
  },
  {
    id: "none",
    icon: <StairsIcon />,
    label: "Ingen hiss",
    description: "Bärs via trappor",
  },
]

interface Step4Props {
  formData: {
    moveDate: string
    moveTime: string
    startAddress: string
    startFloor: string
    startElevator: "big" | "small" | "none"
    endAddress: string
    endFloor: string
    endElevator: "big" | "small" | "none"
    startParkingDistance: string
    endParkingDistance: string
    startLivingArea: string
    endLivingArea: string
    startPropertyType: "apartment" | "house" | "storage"
    endPropertyType: "apartment" | "house" | "storage"
    startDoorCode: string
    endDoorCode: string
    calculatedDistance?: string
    flexibleMoveDate?: boolean
    flexibleDateRange?: string
  }
  handleChange: (field: string, value: string) => void
  nextStep: () => void
  prevStep: () => void
}

const timeOptions = [
  {
    id: "08:00",
    icon: <Clock className="w-6 h-6" />,
    label: "08:00",
    time: "08:00",
  },
  {
    id: "14:00",
    icon: <Clock className="w-6 h-6" />,
    label: "14:00",
    time: "14:00",
  },
  {
    id: "flexible",
    icon: <Clock className="w-6 h-6" />,
    label: "Valfri tid",
    description: "(mellan 08:00-18:00)",
    tooltip: "Om du väljer detta alternativ, planerar vi in flytten under dagen och återkommer med en exakt tid.",
    time: "Flexibel",
  },
]

// Uppdatera AddressSuggestion interfacet för att matcha Google Places API
interface AddressSuggestion {
  description: string
  place_id: string
}

// Component to render required field indicator
const RequiredFieldIndicator = () => (
  <span className="text-red-500 ml-1" aria-label="Obligatoriskt fält">
    *
  </span>
)

// Återskapa debounce-funktionen då vi fortfarande behöver den
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: NodeJS.Timeout | null = null

  return ((...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }) as F
}

// Add this at the top of the file, after the existing imports
interface WindowWithGoogle extends Window {
  google: typeof google;
  initGoogleMaps: () => void;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export default function Step4MoveDetails({ formData, handleChange, nextStep, prevStep }: Step4Props) {
  const [startElevator, setStartElevator] = useState<"big" | "small" | "none" | "">(formData.startElevator || "")
  const [endElevator, setEndElevator] = useState<"big" | "small" | "none">(formData.endElevator || "big")
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [startAddressSuggestions, setStartAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [endAddressSuggestions, setEndAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [startCoords, setStartCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [endCoords, setEndCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [isLoadingStartSuggestions, setIsLoadingStartSuggestions] = useState(false)
  const [isLoadingEndSuggestions, setIsLoadingEndSuggestions] = useState(false)
  const [addressError, setAddressError] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const [invalidFields, setInvalidFields] = useState<string[]>([])
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [originType, setOriginType] = useState<"address" | "other">("address")
  const [destinationType, setDestinationType] = useState<"address" | "other">("address")
  const [isFlexibleDate, setIsFlexibleDate] = useState<boolean>(formData.flexibleMoveDate || false)
  
  // Alternativ för flexibelt datumintervall
  const flexibleDateOptions = [
    { value: "1-3", label: "1–3 dagar" },
    { value: "7-14", label: "1–2 veckor" },
    { value: "14-21", label: "2–3 veckor" },
    { value: "28-42", label: "4–6 veckor" },
  ]

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split("T")[0]

  // Initialize parking distances if they don't exist
  useEffect(() => {
    if (formData.startParkingDistance === undefined && formData.endParkingDistance === undefined) {
      // If the old single parking distance exists, copy it to both
      if ((formData as any).parkingDistance) {
        handleChange("startParkingDistance", (formData as any).parkingDistance)
        handleChange("endParkingDistance", (formData as any).parkingDistance)
        // Clean up old property by setting it to empty instead of deleting
        handleChange("parkingDistance", "")
      } else {
        handleChange("startParkingDistance", "")
        handleChange("endParkingDistance", "")
      }
    }
  }, [formData, handleChange])

  useEffect(() => {
    if (formData.startPropertyType === "house" || formData.startPropertyType === "storage") {
      setStartElevator("none")
      handleChange("startElevator", "none")
    }
    if (formData.endPropertyType === "house" || formData.endPropertyType === "storage") {
      setEndElevator("none")
      handleChange("endElevator", "none")
    } else if (formData.endPropertyType === "apartment" && !formData.endElevator) {
      // Set large elevator as default for end address if it's an apartment and no selection yet
      setEndElevator("big")
      handleChange("endElevator", "big")
    }
  }, [formData.startPropertyType, formData.endPropertyType, formData.endElevator, handleChange])

  // Check if form is valid and track invalid fields
  useEffect(() => {
    const newInvalidFields: string[] = []

    if (!formData.moveDate && !isFlexibleDate) newInvalidFields.push("moveDate")
    if (isFlexibleDate && !formData.flexibleDateRange) newInvalidFields.push("flexibleDateRange")
    if (!formData.startAddress) newInvalidFields.push("startAddress")
    if (!formData.endAddress) newInvalidFields.push("endAddress")
    if (!formData.startLivingArea) newInvalidFields.push("startLivingArea")
    if (!formData.endLivingArea) newInvalidFields.push("endLivingArea")
    if (formData.startParkingDistance === "") newInvalidFields.push("startParkingDistance")
    if (formData.endParkingDistance === "") newInvalidFields.push("endParkingDistance")

    if (formData.startPropertyType === "apartment") {
      if (!formData.startFloor) newInvalidFields.push("startFloor")
    }

    if (formData.endPropertyType === "apartment") {
      if (!formData.endFloor) newInvalidFields.push("endFloor")
    }

    setInvalidFields(newInvalidFields)
    setIsFormValid(newInvalidFields.length === 0)
  }, [formData])

  // Add required refs for input elements
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Referens för Google Maps Autocomplete-objekt
  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const endAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const distanceMatrixRef = useRef<google.maps.DistanceMatrixService | null>(null)
  
  // Remove the Google Maps API loading code since it's now in layout.tsx
  // Instead, just initialize the services when Google is available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initializeGoogleMapsServices();
    }
  }, []);
  
  // Uppdatera calculateAndSetDistance-funktionen för att använda nyare API
  const calculateAndSetDistance = useCallback((origin: string, destination: string) => {
    if (!origin || !destination) return;

    setIsCalculating(true);
    // Skapa en ny service-instans för varje anrop istället för att återanvända en referens
    const service = new google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        setIsCalculating(false);
        
        if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
          const distanceResult = response.rows[0].elements[0];
          
          if (distanceResult?.distance && distanceResult?.duration) {
            const distanceValue = distanceResult.distance.value; // meters
            console.log("Setting calculatedDistance to:", distanceValue.toString());
            handleChange('calculatedDistance', distanceValue.toString());
            setDistanceError(null);
            
            // Set parking distance values in form
            if (originType === "address" && destinationType === "address") {
              handleChange("endParkingDistance", Math.round(distanceValue / 1000).toString()); // km
            }
          }
        } else {
          console.error("Error calculating distance:", status);
          setDistanceError('Kunde inte beräkna avståndet. Vänligen kontrollera adresserna.');
        }
      }
    );
  }, [handleChange])

  // Uppdatera initializeGoogleMapsServices för modern Google Maps API
  const initializeGoogleMapsServices = useCallback(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      try {
        // Use the newer API approach
        const autocompleteStartAddress = new google.maps.places.Autocomplete(
          fromInputRef.current as HTMLInputElement,
          { types: ["address"] }
        );
        
        const autocompleteEndAddress = new google.maps.places.Autocomplete(
          toInputRef.current as HTMLInputElement,
          { types: ["address"] }
        );
        
        // Set up listeners
        autocompleteStartAddress.addListener("place_changed", () => {
          const place = autocompleteStartAddress.getPlace();
          if (place && place.formatted_address) {
            setStartAddressSuggestions([]);
            handleChange('startAddress', place.formatted_address);
            
            if (place.geometry?.location) {
              setStartCoords({
                lat: place.geometry.location.lat(),
                lon: place.geometry.location.lng()
              });
              
              // Calculate distance if both addresses are present
              if (formData.endAddress && endCoords) {
                calculateAndSetDistance(place.formatted_address, formData.endAddress);
              }
            }
          }
        });
        
        autocompleteEndAddress.addListener("place_changed", () => {
          const place = autocompleteEndAddress.getPlace();
          if (place && place.formatted_address) {
            setEndAddressSuggestions([]);
            handleChange('endAddress', place.formatted_address);
            
            if (place.geometry?.location) {
              setEndCoords({
                lat: place.geometry.location.lat(),
                lon: place.geometry.location.lng()
              });
              
              // Calculate distance if both addresses are present
              if (formData.startAddress && startCoords) {
                calculateAndSetDistance(formData.startAddress, place.formatted_address);
              }
            }
          }
        });
        
        // Save references to service
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
      } catch (error) {
        console.error("Error initializing Google Maps services:", error);
      }
    }
  }, [handleChange, calculateAndSetDistance])

  // Uppdatera handleAddressChange för att bara uppdatera adressfälten
  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, addressType: 'startAddress' | 'endAddress') => {
    const value = e.target.value;
    
    // Update the form data immediately for immediate UI feedback
    handleChange(addressType, value);
    
    // We don't need to fetch suggestions manually as the Autocomplete handles this
    // Just clear any previously set suggestions
    if (addressType === 'startAddress') {
      setStartAddressSuggestions([]);
    } else {
      setEndAddressSuggestions([]);
    }
  }, [handleChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    if (isFormValid) {
      nextStep()
    } else {
      // Show validation errors
      alert("Vänligen fyll i alla obligatoriska fält markerade med *")
    }
  }

  const handleElevatorChange = (location: "start" | "end", value: "big" | "small" | "none") => {
    if (location === "start") {
      setStartElevator(value)
      handleChange("startElevator", value)
    } else {
      setEndElevator(value)
      handleChange("endElevator", value)
    }
  }

  // Fix property reference in handleParkingDistanceChange
  const handleParkingDistanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      handleChange('endParkingDistance', value);
    }
  };

  // Update deleteFormField to make it safe
  const deleteFormField = (field: string) => {
    // Instead of deleting, we set the field to an empty string
    // This is a safer approach in TypeScript
    if (field in formData) {
      handleChange(field, "");
    }
  };

  // Hantera tidsvalet
  const handleTimeChange = (time: string) => {
    handleChange("moveTime", time);
  };

  const handleFlexibleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsFlexibleDate(isChecked);
    handleChange("flexibleMoveDate", isChecked.toString());
    
    // Om vi avmarkerar flexibelt datum, rensa intervallet
    if (!isChecked) {
      handleChange("flexibleDateRange", "");
    } else if (flexibleDateOptions.length > 0) {
      // Sätt standardvärde för flexibelt datumintervall
      handleChange("flexibleDateRange", flexibleDateOptions[0].value);
    }
  };
  
  const handleFlexibleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange("flexibleDateRange", e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Date and Time section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold">Datum och tid</h3>
          </div>

          <div className="flex flex-col gap-6">
            {/* Datum och flexibilitet */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <Label htmlFor="move-date" className="text-sm font-medium">
                  Flyttdatum
                </Label>
                <RequiredFieldIndicator />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-sm">Välj önskat datum för din flytt.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-3">
                <Input
                  id="move-date"
                  type="date"
                  className={`${
                    formSubmitted && invalidFields.includes("moveDate") ? "border-red-500" : "border-gray-300"
                  } ${isFlexibleDate ? "opacity-50" : ""}`}
                  value={formData.moveDate}
                  onChange={(e) => handleChange("moveDate", e.target.value)}
                  min={today}
                  disabled={isFlexibleDate}
                />

                {formSubmitted && invalidFields.includes("moveDate") && !isFlexibleDate && (
                  <p className="text-red-500 text-xs mt-1">Välj ett flyttdatum</p>
                )}
                
                <div className="flex flex-col space-y-2 mt-3">
                  <div className="flex items-center space-x-2">
                    <input
                      id="flexible-date"
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={isFlexibleDate}
                      onChange={handleFlexibleDateChange}
                    />
                    <Label htmlFor="flexible-date" className="text-sm font-medium">
                      Flexibelt flyttdatum
                    </Label>
                  </div>
                  
                  {isFlexibleDate && (
                    <div className="ml-6 mt-2">
                      <Label htmlFor="flexible-date-range" className="text-sm font-medium mb-1 block">
                        Välj tidsintervall
                      </Label>
                      <select
                        id="flexible-date-range"
                        className={`w-full rounded-md border ${
                          formSubmitted && invalidFields.includes("flexibleDateRange") 
                          ? "border-red-500" 
                          : "border-gray-300"
                        } p-2 text-sm`}
                        value={formData.flexibleDateRange || ""}
                        onChange={handleFlexibleDateRangeChange}
                      >
                        <option value="" disabled>Välj intervall</option>
                        {flexibleDateOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {formSubmitted && invalidFields.includes("flexibleDateRange") && (
                        <p className="text-red-500 text-xs mt-1">Välj ett tidsintervall</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tidval */}
            <div className="w-full mt-4">
              <Label className="mb-2 block">Flyttid</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {timeOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`p-4 cursor-pointer hover:border-accent/50 transition-all ${
                      formData.moveTime === option.time ? "border-2 border-blue-500 bg-blue-50 shadow-lg" : ""
                    }`}
                    onClick={() => handleTimeChange(option.time)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mb-2">
                        {option.icon}
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
                      )}
                      {option.tooltip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 mt-1 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{option.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Från-adress kortet */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="flex items-center text-blue-600 font-medium mb-4">
            <MapPin className="h-5 w-5 mr-2" />
            Från adress
          </h3>
          
          <div className="mb-4">
            <Label htmlFor="startAddress" className="flex items-center mb-1">
              Adress <RequiredFieldIndicator />
            </Label>
            <div className="relative">
              <Input
                ref={fromInputRef}
                id="startAddress"
                value={formData.startAddress}
                onChange={(e) => handleAddressChange(e, 'startAddress')}
                placeholder="Sök efter en adress..."
                className={formSubmitted && invalidFields.includes("startAddress") ? "border-red-500" : ""}
                required
              />
              {isLoadingStartSuggestions && <div className="absolute right-2 top-2 animate-spin">⟳</div>}
            </div>
            {addressError.start && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertTriangle className="w-4 h-4 mr-1" /> {addressError.start}
              </p>
            )}
            {formSubmitted && invalidFields.includes("startAddress") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>

          <div className="mt-4">
            <Label>Bostadstyp</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {[
                {
                  id: "apartment",
                  icon: <Building2 className="w-6 h-6" />,
                  label: "Lägenhet",
                  description: "Vanlig bostad i flerfamiljshus",
                },
                {
                  id: "house",
                  icon: <Home className="w-6 h-6" />,
                  label: "Villa/Radhus",
                  description: "Fristående eller radhus",
                },
                {
                  id: "storage",
                  icon: <Warehouse className="w-6 h-6" />,
                  label: "Magasin",
                  description: "Lager, förråd eller förvaring",
                },
              ].map((option) => (
                <Card
                  key={option.id}
                  className={`p-4 cursor-pointer hover:border-accent/50 transition-all ${
                    formData.startPropertyType === option.id ? "border-2 border-blue-500 bg-blue-50 shadow-lg" : ""
                  }`}
                  onClick={() => handleChange("startPropertyType", option.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mb-2">
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="startLivingArea" className="flex items-center">
              Boarea (kvm) <RequiredFieldIndicator />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Ange boarean i kvadratmeter för en mer exakt offert.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="startLivingArea"
              value={formData.startLivingArea}
              onChange={(e) => handleChange("startLivingArea", e.target.value)}
              className={`w-full mt-1 bg-[#F7F7F7] ${formSubmitted && invalidFields.includes("startLivingArea") ? "border-red-500" : ""}`}
              required
            />
            {formSubmitted && invalidFields.includes("startLivingArea") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>

          {formData.startPropertyType === "apartment" && (
            <>
              <div className="mt-4">
                <Label>Hiss</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {elevatorOptions.map((option) => (
                    <Card
                      key={`start-${option.id}`}
                      className={`p-4 cursor-pointer hover:border-accent/50 transition-all ${
                        startElevator === option.id ? "border-2 border-blue-500 bg-blue-50 shadow-md" : ""
                      }`}
                      onClick={() => handleElevatorChange("start", option.id)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-2">
                          {option.icon}
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="startFloor" className="flex items-center">
                  Våning <RequiredFieldIndicator />
                </Label>
                <Input
                  type="number"
                  id="startFloor"
                  value={formData.startFloor}
                  onChange={(e) => handleChange("startFloor", e.target.value)}
                  className={`w-full mt-1 ${formSubmitted && invalidFields.includes("startFloor") ? "border-red-500" : ""}`}
                  min="0"
                  required
                />
                {formSubmitted && invalidFields.includes("startFloor") && (
                  <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
                )}
              </div>

              <div className="mt-4">
                <Label htmlFor="startDoorCode">Portkod</Label>
                <Input
                  type="text"
                  id="startDoorCode"
                  value={formData.startDoorCode}
                  onChange={(e) => handleChange("startDoorCode", e.target.value)}
                  className="w-full mt-1"
                  placeholder="Ex: A123 eller 4567"
                />
              </div>
            </>
          )}

          <div className="mt-4">
            <Label htmlFor="startParkingDistance" className="flex items-center">
              Avstånd till parkering (Från adress)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Ange ungefärligt avstånd från flyttbilen till entrén på denna adress.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="startParkingDistance"
              value={formData.startParkingDistance}
              onChange={(e) => handleChange("startParkingDistance", e.target.value)}
              className={`w-full mt-1 ${formSubmitted && invalidFields.includes("startParkingDistance") ? "border-red-500" : ""}`}
              min="0"
              placeholder="Ange avstånd i meter"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ange 0 om flyttbilen kan parkera precis vid entrén.</p>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="startParkingUnknown"
                className="mr-2"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleChange("startParkingDistance", "15")
                  } else if (formData.startParkingDistance === "15") {
                    handleChange("startParkingDistance", "")
                  }
                }}
              />
              <label htmlFor="startParkingUnknown" className="text-sm">
                Jag vet inte avståndet, använd standardvärde (15 meter)
              </label>
            </div>
            {formSubmitted && invalidFields.includes("startParkingDistance") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>
        </div>

        {/* Till-adress kortet */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="flex items-center text-blue-600 font-medium mb-4">
            <MapPin className="h-5 w-5 mr-2" />
            Till adress
          </h3>
          
          <div className="mb-4">
            <Label htmlFor="endAddress" className="flex items-center mb-1">
              Adress <RequiredFieldIndicator />
            </Label>
            <div className="relative">
              <Input
                ref={toInputRef}
                id="endAddress"
                value={formData.endAddress}
                onChange={(e) => handleAddressChange(e, 'endAddress')}
                placeholder="Sök efter en adress..."
                className={formSubmitted && invalidFields.includes("endAddress") ? "border-red-500" : ""}
                required
              />
              {isLoadingEndSuggestions && <div className="absolute right-2 top-2 animate-spin">⟳</div>}
            </div>
            {addressError.end && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertTriangle className="w-4 h-4 mr-1" /> {addressError.end}
              </p>
            )}
            {formSubmitted && invalidFields.includes("endAddress") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}

            {isCalculating && (
              <div className="flex items-center text-blue-600 mt-2">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Beräknar avstånd...
              </div>
            )}
          </div>

          <div className="mt-4">
            <Label>Bostadstyp</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {[
                {
                  id: "apartment",
                  icon: <Building2 className="w-6 h-6" />,
                  label: "Lägenhet",
                  description: "Vanlig bostad i flerfamiljshus",
                },
                {
                  id: "house",
                  icon: <Home className="w-6 h-6" />,
                  label: "Villa/Radhus",
                  description: "Fristående eller radhus",
                },
                {
                  id: "storage",
                  icon: <Warehouse className="w-6 h-6" />,
                  label: "Magasin",
                  description: "Lager, förråd eller förvaring",
                },
              ].map((option) => (
                <Card
                  key={option.id}
                  className={`p-4 cursor-pointer hover:border-accent/50 transition-all ${
                    formData.endPropertyType === option.id ? "border-2 border-blue-500 bg-blue-50 shadow-lg" : ""
                  }`}
                  onClick={() => handleChange("endPropertyType", option.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mb-2">
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="endLivingArea" className="flex items-center">
              Boarea (kvm) <RequiredFieldIndicator />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Ange boarean i kvadratmeter för en mer exakt offert.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="endLivingArea"
              value={formData.endLivingArea}
              onChange={(e) => handleChange("endLivingArea", e.target.value)}
              className={`w-full mt-1 bg-[#F7F7F7] ${formSubmitted && invalidFields.includes("endLivingArea") ? "border-red-500" : ""}`}
              required
            />
            {formSubmitted && invalidFields.includes("endLivingArea") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>

          {formData.endPropertyType === "apartment" && (
            <>
              <div className="mt-4">
                <Label>Hiss</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {elevatorOptions.map((option) => (
                    <Card
                      key={`end-${option.id}`}
                      className={`p-4 cursor-pointer hover:border-accent/50 transition-all ${
                        endElevator === option.id ? "border-2 border-blue-500 bg-blue-50 shadow-md" : ""
                      }`}
                      onClick={() => handleElevatorChange("end", option.id)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-2">
                          {option.icon}
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="endFloor" className="flex items-center">
                  Våning <RequiredFieldIndicator />
                </Label>
                <Input
                  type="number"
                  id="endFloor"
                  value={formData.endFloor}
                  onChange={(e) => handleChange("endFloor", e.target.value)}
                  className={`w-full mt-1 ${formSubmitted && invalidFields.includes("endFloor") ? "border-red-500" : ""}`}
                  min="0"
                  required
                />
                {formSubmitted && invalidFields.includes("endFloor") && (
                  <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
                )}
              </div>

              <div className="mt-4">
                <Label htmlFor="endDoorCode">Portkod</Label>
                <Input
                  type="text"
                  id="endDoorCode"
                  value={formData.endDoorCode}
                  onChange={(e) => handleChange("endDoorCode", e.target.value)}
                  className="w-full mt-1"
                  placeholder="Ex: A123 eller 4567"
                />
              </div>
            </>
          )}

          <div className="mt-4">
            <Label htmlFor="endParkingDistance" className="flex items-center">
              Avstånd till parkering (Till adress)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Ange ungefärligt avstånd från flyttbilen till entrén på denna adress.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="endParkingDistance"
              value={formData.endParkingDistance}
              onChange={handleParkingDistanceChange}
              className={`w-full mt-1 ${formSubmitted && invalidFields.includes("endParkingDistance") ? "border-red-500" : ""}`}
              min="0"
              placeholder="Ange avstånd i meter"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ange 0 om flyttbilen kan parkera precis vid entrén.</p>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="endParkingUnknown"
                className="mr-2"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleChange("endParkingDistance", "15")
                  } else if (formData.endParkingDistance === "15") {
                    handleChange("endParkingDistance", "")
                  }
                }}
              />
              <label htmlFor="endParkingUnknown" className="text-sm">
                Jag vet inte avståndet, använd standardvärde (15 meter)
              </label>
            </div>
            {formSubmitted && invalidFields.includes("endParkingDistance") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Tillbaka
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nästa
          </button>
        </div>
      </div>
    </form>
  )
}
