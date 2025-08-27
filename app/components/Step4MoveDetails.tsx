"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Home, Clock, Building2, MapPin, AlertTriangle, Info, Warehouse, Calendar } from "lucide-react"
import { LargeElevatorIcon, SmallElevatorIcon, StairsIcon } from "./icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FormField, MoveFormData } from '../../types/form'
import { toast } from "sonner"

// 🚀 WORKING ADDRESS INPUT - FINAL FIXED VERSION
interface WorkingAddressInputProps {
  id?: string
  value: string
  onChange: (value: string, placeData?: any) => void
  onPlaceSelected?: (place: any) => void
  placeholder?: string
  className?: string
}

function WorkingAddressInput({
  id,
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Skriv adress...",
  className = ""
}: WorkingAddressInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  // 🔧 ENHANCED GOOGLE INITIALIZATION
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 50
    
    const initializeGoogle = () => {
      attempts++
      
      if (window.google?.maps?.places) {
        console.log('🌍 Google Maps Places API ready!');
        try {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
          
          // Create dummy map for PlacesService
          const dummyMap = new window.google.maps.Map(document.createElement('div'))
          placesServiceRef.current = new window.google.maps.places.PlacesService(dummyMap)
          
          setGoogleReady(true)
          console.log('✅ Google services initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing Google services:', error);
        }
      } else if (attempts < maxAttempts) {
        console.log(`⏳ Waiting for Google Maps API... (attempt ${attempts}/${maxAttempts})`);
        setTimeout(initializeGoogle, 100)
      } else {
        console.error('❌ Google Maps API failed to load after 5 seconds');
        console.log('🔍 Debug info:', {
          windowGoogle: !!window.google,
          windowGoogleMaps: !!window.google?.maps,
          windowGoogleMapsPlaces: !!window.google?.maps?.places
        });
      }
    }
    
    initializeGoogle()
  }, [])

  // 🔧 FIXED SEARCH WITH CORRECT STATUS CHECKS
  const searchPlaces = useCallback(async (input: string) => {
    if (!googleReady || !autocompleteServiceRef.current || input.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    try {
      autocompleteServiceRef.current.getPlacePredictions({
        input: input,
        componentRestrictions: { country: 'se' },
        types: ['address']
      }, (predictions: any, status: any) => {
        setIsLoading(false)
        
        console.log('🔍 Google API Response:', { status, predictions: predictions?.length || 0 });
        
        // 🔧 FIXED: Use string comparison instead of enum
        if (status === 'OK' && predictions) {
          console.log('✅ Got predictions:', predictions.length);
          setSuggestions(predictions.slice(0, 5))
          setShowDropdown(true)
        } else {
          console.log('❌ No predictions or error:', status);
          if (status === 'REQUEST_DENIED') {
            console.error('🚨 API REQUEST DENIED - Check API key and billing!');
          }
          setSuggestions([])
          setShowDropdown(false)
        }
      })
    } catch (error) {
      console.error('❌ Search error:', error)
      setIsLoading(false)
      setSuggestions([])
    }
  }, [googleReady])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (newValue.length >= 2) {
      searchPlaces(newValue)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  // 🔧 FIXED PLACE SELECTION WITH CORRECT STATUS CHECK
  const handlePlaceSelect = (prediction: any) => {
    console.log('🔍 Place selected:', prediction)
    
    onChange(prediction.description)
    setShowDropdown(false)
    setSuggestions([])

    // Get detailed place information
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails({
        placeId: prediction.place_id,
        fields: ['place_id', 'geometry', 'formatted_address', 'address_components']
      }, (place: any, status: any) => {
        // 🔧 FIXED: Use string comparison instead of enum
        if (status === 'OK') {
          const placeData = {
            placeId: place.place_id,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            formattedAddress: place.formatted_address,
            addressComponents: place.address_components
          }
          
          console.log('📍 Complete place data:', placeData)
          onPlaceSelected?.(placeData)
        } else {
          console.error('❌ Place details error:', status);
        }
      })
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Enhanced status icons
  const getStatusIcon = () => {
    if (!googleReady) return '❌'
    if (isLoading) return '⏳'
    if (suggestions.length > 0) return '🔍'
    return '🌍'
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={className}
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm" title={googleReady ? 'Google Places ready' : 'Google Places not ready'}>
          {getStatusIcon()}
        </span>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handlePlaceSelect(suggestion)}
            >
              <div className="text-sm font-medium text-gray-900">
                {suggestion.structured_formatting?.main_text || suggestion.description}
              </div>
              {suggestion.structured_formatting?.secondary_text && (
                <div className="text-xs text-gray-600 mt-1">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && !googleReady && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 z-40">
          ⚠️ Google Places API not ready. Check console for details.
        </div>
      )}
    </div>
  )
}

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
  formData: MoveFormData
  handleChange: (field: FormField, value: string | boolean) => void
  handleSubmit: (e: React.FormEvent) => void
  formSubmitted: boolean
  invalidFields: FormField[]
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

const RequiredFieldIndicator = () => (
  <span className="text-red-500 ml-1" aria-label="Obligatoriskt fält">
    *
  </span>
)

function debounce<F extends (...args: any[]) => any>(func: F, wait: number = 1000) {
  let timeout: NodeJS.Timeout | null = null
  let lastExecuted = 0

  return ((...args: Parameters<F>) => {
    const now = Date.now()
    
    if (timeout) {
      clearTimeout(timeout)
    }

    if (now - lastExecuted > wait * 2) {
      lastExecuted = now
      func(...args)
      return
    }

    timeout = setTimeout(() => {
      lastExecuted = Date.now()
      func(...args)
    }, wait)
  }) as F
}

export default function Step4MoveDetails({ 
  formData, 
  handleChange, 
  handleSubmit: propHandleSubmit,
  formSubmitted,
  invalidFields,
  prevStep,
}: Step4Props) {
  // Local state för omedelbar UI-feedback
  const [localStartAddress, setLocalStartAddress] = useState(formData.startAddress || "")
  const [localEndAddress, setLocalEndAddress] = useState(formData.endAddress || "")
  const [localStartLivingArea, setLocalStartLivingArea] = useState(formData.startLivingArea || "")
  const [localEndLivingArea, setLocalEndLivingArea] = useState(formData.endLivingArea || "")
  const [localStartParkingDistance, setLocalStartParkingDistance] = useState(formData.startParkingDistance || "")
  const [localEndParkingDistance, setLocalEndParkingDistance] = useState(formData.endParkingDistance || "")
  
  const [startElevator, setStartElevator] = useState<"big" | "small" | "none">(formData.startElevator)
  const [endElevator, setEndElevator] = useState<"big" | "small" | "none">(formData.endElevator)
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isFlexibleDate, setIsFlexibleDate] = useState<boolean>(formData.flexibleMoveDate || false)
  const [isClient, setIsClient] = useState(false)
  const [lastDistanceCalculation, setLastDistanceCalculation] = useState<string>("")
  
  const flexibleDateOptions = [
    { value: "1-3", label: "1–3 dagar" },
    { value: "7-14", label: "1–2 veckor" },
    { value: "14-21", label: "2–3 veckor" },
    { value: "28-42", label: "4–6 veckor" },
  ]

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Address sync
  useEffect(() => {
    console.log('🔍 ADDRESS SYNC CHECK:', {
      localStartAddress: localStartAddress?.length || 0,
      localEndAddress: localEndAddress?.length || 0,
      formDataStartAddress: formData.startAddress?.length || 0,
      formDataEndAddress: formData.endAddress?.length || 0
    });

    if (localStartAddress && localStartAddress.length > 3 && 
        (!formData.startAddress || formData.startAddress !== localStartAddress)) {
      console.log('🔧 SYNCING START ADDRESS:', localStartAddress);
      handleChange('startAddress', localStartAddress);
    }

    if (localEndAddress && localEndAddress.length > 3 && 
        (!formData.endAddress || formData.endAddress !== localEndAddress)) {
      console.log('🔧 SYNCING END ADDRESS:', localEndAddress);
      handleChange('endAddress', localEndAddress);
    }
  }, [localStartAddress, localEndAddress, formData.startAddress, formData.endAddress, handleChange]);

  // Sync local state with form data
  useEffect(() => {
    setLocalStartAddress(formData.startAddress || "")
    setLocalEndAddress(formData.endAddress || "")
    setLocalStartLivingArea(formData.startLivingArea || "")
    setLocalEndLivingArea(formData.endLivingArea || "")
    setLocalStartParkingDistance(formData.startParkingDistance || "")
    setLocalEndParkingDistance(formData.endParkingDistance || "")
  }, [formData.startAddress, formData.endAddress, formData.startLivingArea, formData.endLivingArea, formData.startParkingDistance, formData.endParkingDistance])

  // Initialize parking distances
  useEffect(() => {
    if (formData.startParkingDistance === undefined && formData.endParkingDistance === undefined) {
      if ((formData as any).parkingDistance) {
        handleChange("startParkingDistance", (formData as any).parkingDistance)
        handleChange("endParkingDistance", (formData as any).parkingDistance)
        handleChange("parkingDistance", "")
      } else {
        handleChange("startParkingDistance", "")
        handleChange("endParkingDistance", "")
      }
    }
  }, [handleChange])

  // Auto-set elevator/floor for property types
  useEffect(() => {
    let shouldUpdate = false;
    
    if (formData.startPropertyType === "house" || formData.startPropertyType === "storage") {
      if (startElevator !== "none") {
        setStartElevator("none");
        handleChange("startElevator", "none");
        shouldUpdate = true;
      }
      if (!formData.startFloor || formData.startFloor === "") {
        handleChange("startFloor", "0");
        shouldUpdate = true;
      }
    }
    
    if (formData.endPropertyType === "house" || formData.endPropertyType === "storage") {
      if (endElevator !== "none") {
        setEndElevator("none");
        handleChange("endElevator", "none");
        shouldUpdate = true;
      }
      if (!formData.endFloor || formData.endFloor === "") {
        handleChange("endFloor", "0");
        shouldUpdate = true;
      }
    } else if (formData.endPropertyType === "apartment" && !formData.endElevator) {
      setEndElevator("big");
      handleChange("endElevator", "big");
      shouldUpdate = true;
    }
    
    if (shouldUpdate) {
      console.log('🏠 Auto-setting elevator/floor for property types');
    }
  }, [formData.startPropertyType, formData.endPropertyType, handleChange]);

  // 🔧 FIXED DISTANCE CALCULATION WITH CORRECT TYPES
  const debouncedCalculateDistance = useCallback(
    debounce(async (origin: string, destination: string, originPlaceId?: string, destPlaceId?: string) => {
      const distanceKey = `${originPlaceId || origin}-${destPlaceId || destination}`;
      if (distanceKey === lastDistanceCalculation) {
        console.log('🚫 Duplicate distance calculation prevented');
        return;
      }
      
      if (!origin || !destination || origin.length < 10 || destination.length < 10) {
        console.log('🚫 Addresses too short for distance calculation');
        return;
      }
      
      setLastDistanceCalculation(distanceKey);
      setIsCalculating(true);
      setDistanceError(null);
      
      try {
        if (!window.google?.maps) {
          throw new Error('Google Maps inte laddat');
        }

        const service = new google.maps.DistanceMatrixService();
        
        // 🔧 FIXED: Correct type handling for origins/destinations
        const origins: (string | google.maps.LatLng | google.maps.Place | google.maps.LatLngLiteral)[] = 
          originPlaceId ? [{placeId: originPlaceId} as google.maps.Place] : [origin];
        const destinations: (string | google.maps.LatLng | google.maps.Place | google.maps.LatLngLiteral)[] = 
          destPlaceId ? [{placeId: destPlaceId} as google.maps.Place] : [destination];
        
        console.log('🚗 Calculating distance:', { origins, destinations });
        
        const response = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
          service.getDistanceMatrix(
            {
              origins: origins,
              destinations: destinations,
              travelMode: google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC,
            },
            (response, status) => {
              if (status === google.maps.DistanceMatrixStatus.OK && response?.rows[0]?.elements[0]?.status === google.maps.DistanceMatrixElementStatus.OK) {
                resolve(response);
              } else {
                reject(new Error(`Kunde inte beräkna avståndet: ${status}`));
              }
            }
          );
        });

        const distanceResult = response.rows[0].elements[0];
        if (distanceResult?.distance) {
          const distanceInKm = (distanceResult.distance.value / 1000).toFixed(1);
          
          console.log('✅ DISTANCE CALCULATED:', {
            distanceInKm,
            distanceText: distanceResult.distance.text,
            durationText: distanceResult.duration?.text
          });
          
          handleChange('calculatedDistance', distanceInKm);
          setDistanceError(null);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
        console.error('❌ Distance calculation error:', errorMessage);
        setDistanceError(errorMessage);
      } finally {
        setIsCalculating(false);
      }
    }, 2000),
    [handleChange, lastDistanceCalculation]
  );

  // Trigger distance calculation
  useEffect(() => {
    if (formData.startAddress && formData.endAddress && 
        formData.startAddress.length > 10 && formData.endAddress.length > 10 &&
        (!formData.calculatedDistance || formData.calculatedDistance === "0" || formData.calculatedDistance === "Ej beräknad")) {
      
      console.log('🚗 Triggering distance calculation');
      
      const startPlaceId = (formData as any).startPlaceId;
      const endPlaceId = (formData as any).endPlaceId;
      
      debouncedCalculateDistance(
        formData.startAddress, 
        formData.endAddress,
        startPlaceId,
        endPlaceId
      );
    }
  }, [formData.startAddress, formData.endAddress, debouncedCalculateDistance])

  // Form validation
  const isFormValid = useMemo(() => {
    const addressesValid = (localStartAddress?.length > 5) && (localEndAddress?.length > 5);
    
    const validationChecks = {
      addressesValid,
      startLivingArea: formData.startLivingArea && Number(formData.startLivingArea) > 0,
      endLivingArea: formData.endLivingArea && Number(formData.endLivingArea) > 0,
      startParkingDistance: formData.startParkingDistance !== undefined && formData.startParkingDistance !== "",
      endParkingDistance: formData.endParkingDistance !== undefined && formData.endParkingDistance !== "",
      startPropertyType: !!formData.startPropertyType,
      endPropertyType: !!formData.endPropertyType,
      moveTime: !!formData.moveTime,
      moveDate: isFlexibleDate ? !!formData.flexibleDateRange : !!formData.moveDate,
      startFloor: formData.startPropertyType === "apartment" 
        ? (formData.startFloor !== undefined && formData.startFloor !== null && formData.startFloor !== "")
        : true,
      endFloor: formData.endPropertyType === "apartment" 
        ? (formData.endFloor !== undefined && formData.endFloor !== null && formData.endFloor !== "")
        : true,
    };

    const isValid = Object.values(validationChecks).every(Boolean);
    
    console.log('🔍 VALIDATION STATUS:', {
      isValid,
      ...validationChecks,
      localStartAddressLength: localStartAddress?.length || 0,
      localEndAddressLength: localEndAddress?.length || 0
    });
    
    return isValid;
  }, [
    localStartAddress, 
    localEndAddress, 
    formData.startLivingArea,
    formData.endLivingArea,
    formData.startParkingDistance,
    formData.endParkingDistance,
    formData.startPropertyType,
    formData.endPropertyType,
    formData.moveTime,
    formData.moveDate,
    formData.flexibleDateRange,
    formData.startFloor,
    formData.endFloor,
    isFlexibleDate
  ]);

  // Event handlers
  const handleStartLivingAreaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
      setLocalStartLivingArea(value);
      handleChange('startLivingArea', value);
    }
  }, [handleChange]);

  const handleEndLivingAreaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
      setLocalEndLivingArea(value);
      handleChange('endLivingArea', value);
    }
  }, [handleChange]);

  const handleStartParkingDistanceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setLocalStartParkingDistance(value);
      handleChange('startParkingDistance', value);
    }
  }, [handleChange]);

  const handleEndParkingDistanceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setLocalEndParkingDistance(value);
      handleChange('endParkingDistance', value);
    }
  }, [handleChange]);

  const handleElevatorChange = useCallback((location: "start" | "end", value: "big" | "small" | "none") => {
    if (location === "start") {
      setStartElevator(value)
      handleChange("startElevator", value)
    } else {
      setEndElevator(value)
      handleChange("endElevator", value)
    }
  }, [handleChange]);

  const handlePropertyTypeChange = useCallback((location: "start" | "end", value: string) => {
    if (location === "start") {
      handleChange("startPropertyType", value);
    } else {
      handleChange("endPropertyType", value);
    }
  }, [handleChange]);

  const handleTimeChange = useCallback((time: string) => {
    handleChange("moveTime", time);
  }, [handleChange]);

  const handleFlexibleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsFlexibleDate(isChecked);
    handleChange("flexibleMoveDate", isChecked.toString());
    
    if (!isChecked) {
      handleChange("flexibleDateRange", "");
    } else if (flexibleDateOptions.length > 0) {
      handleChange("flexibleDateRange", flexibleDateOptions[0].value);
    }
  }, [handleChange, flexibleDateOptions]);
  
  const handleFlexibleDateRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange("flexibleDateRange", e.target.value);
  }, [handleChange]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('🔍 FORM SUBMISSION:', {
      isFormValid,
      formData: {
        startAddress: formData.startAddress,
        endAddress: formData.endAddress,
        startPropertyType: formData.startPropertyType,
        endPropertyType: formData.endPropertyType,
        moveTime: formData.moveTime,
        moveDate: formData.moveDate,
      }
    });
    
    if (!isFormValid) {
      toast.error("Vänligen fyll i alla obligatoriska fält", {
        description: "Kontrollera fälten markerade med *"
      });
      return;
    }

    try {
      propHandleSubmit(e);
    } catch (error) {
      console.error('Error in form submission:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (!errorMessage.includes('navigation') && 
          !errorMessage.includes('redirect') && 
          !errorMessage.includes('abort') &&
          !errorMessage.includes('cancelled')) {
        
        toast.error("Ett fel uppstod", {
          description: "Kunde inte skicka formuläret. Vänligen försök igen."
        });
      }
    }
  }, [formData, isFormValid, propHandleSubmit]);

  if (!isClient) {
    return null;
  }

  return (
    <form 
      className="w-full max-w-4xl mx-auto"
      onSubmit={handleFormSubmit}
    >
      <div className="space-y-6">
        {/* Date and Time section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold">Datum och tid</h3>
          </div>

          <div className="flex flex-col gap-6">
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

            <div className="w-full mt-4">
              <Label className="mb-2 block">
                Flyttid <RequiredFieldIndicator />
              </Label>
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
              <WorkingAddressInput
                id="startAddress"
                value={localStartAddress}
                onChange={(value) => {
                  console.log('🔍 START ADDRESS CHANGE:', value);
                  setLocalStartAddress(value);
                  handleChange('startAddress', value);
                }}
                onPlaceSelected={(placeData) => {
                  console.log('📍 START PLACE DATA:', placeData);
                  if (placeData) {
                    handleChange('startPlaceId' as FormField, placeData.placeId);
                    handleChange('startCoordinates' as FormField, JSON.stringify(placeData.coordinates));
                  }
                }}
                placeholder="Skriv startadress..."
                className={`w-full ${formSubmitted && invalidFields.includes("startAddress") ? "border-red-500" : ""}`}
              />
            </div>
            {formSubmitted && invalidFields.includes("startAddress") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>

          <div className="mt-4">
            <Label>
              Bostadstyp <RequiredFieldIndicator />
            </Label>
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
                  onClick={() => handlePropertyTypeChange("start", option.id)}
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
              {formData.startPropertyType === "storage" ? "Yta (kvm)" : "Boarea (kvm)"} <RequiredFieldIndicator />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {formData.startPropertyType === "storage" 
                        ? "Ange ytan i kvadratmeter för magasinet. Vi räknar automatiskt med 3 meters takhöjd." 
                        : "Ange boarean i kvadratmeter för en mer exakt offert."
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="startLivingArea"
              value={localStartLivingArea}
              onChange={handleStartLivingAreaChange}
              className={`w-full mt-1 bg-[#F7F7F7] ${formSubmitted && invalidFields.includes("startLivingArea") ? "border-red-500" : ""}`}
              placeholder={formData.startPropertyType === "storage" ? "Ex: 12 kvm" : "Ex: 85 kvm"}
              max="9999"
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
                  value={formData.startFloor || ""}
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
              Avstånd till parkering (Från adress) <RequiredFieldIndicator />
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
              value={localStartParkingDistance}
              onChange={handleStartParkingDistanceChange}
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
                    setLocalStartParkingDistance("10")
                    handleChange("startParkingDistance", "10")
                  } else if (formData.startParkingDistance === "10") {
                    setLocalStartParkingDistance("")
                    handleChange("startParkingDistance", "")
                  }
                }}
              />
              <label htmlFor="startParkingUnknown" className="text-sm">
                Jag vet inte avståndet, använd standardvärde (10 meter)
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
              <WorkingAddressInput
                id="endAddress"
                value={localEndAddress}
                onChange={(value) => {
                  console.log('🔍 END ADDRESS CHANGE:', value);
                  setLocalEndAddress(value);
                  handleChange('endAddress', value);
                }}
                onPlaceSelected={(placeData) => {
                  console.log('📍 END PLACE DATA:', placeData);
                  if (placeData) {
                    handleChange('endPlaceId' as FormField, placeData.placeId);
                    handleChange('endCoordinates' as FormField, JSON.stringify(placeData.coordinates));
                  }
                }}
                placeholder="Skriv slutadress..."
                className={`w-full ${formSubmitted && invalidFields.includes("endAddress") ? "border-red-500" : ""}`}
              />
            </div>
            {formSubmitted && invalidFields.includes("endAddress") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}

            {isCalculating && (
              <div className="flex items-center text-blue-600 mt-2">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Beräknar avstånd...
              </div>
            )}
            
            {distanceError && (
              <div className="text-red-500 text-sm mt-2">
                ⚠️ {distanceError}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Label>
              Bostadstyp <RequiredFieldIndicator />
            </Label>
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
                  onClick={() => handlePropertyTypeChange("end", option.id)}
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
              {formData.endPropertyType === "storage" ? "Yta (kvm)" : "Boarea (kvm)"} <RequiredFieldIndicator />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {formData.endPropertyType === "storage" 
                        ? "Ange ytan i kvadratmeter för magasinet. Vi räknar automatiskt med 3 meters takhöjd." 
                        : "Ange boarean i kvadratmeter för en mer exakt offert."
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              id="endLivingArea"
              value={localEndLivingArea}
              onChange={handleEndLivingAreaChange}
              className={`w-full mt-1 bg-[#F7F7F7] ${formSubmitted && invalidFields.includes("endLivingArea") ? "border-red-500" : ""}`}
              placeholder={formData.endPropertyType === "storage" ? "Ex: 12 kvm" : "Ex: 85 kvm"}
              max="9999"
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
                  value={formData.endFloor || ""}
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
              Avstånd till parkering (Till adress) <RequiredFieldIndicator />
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
              value={localEndParkingDistance}
              onChange={handleEndParkingDistanceChange}
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
                    setLocalEndParkingDistance("10")
                    handleChange("endParkingDistance", "10")
                  } else if (formData.endParkingDistance === "10") {
                    setLocalEndParkingDistance("")
                    handleChange("endParkingDistance", "")
                  }
                }}
              />
              <label htmlFor="endParkingUnknown" className="text-sm">
                Jag vet inte avståndet, använd standardvärde (10 meter)
              </label>
            </div>
            {formSubmitted && invalidFields.includes("endParkingDistance") && (
              <p className="text-red-500 text-xs mt-1">Detta fält måste fyllas i för att fortsätta.</p>
            )}
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔍 Debug Info:</h4>
            <p>Form Valid: {isFormValid ? '✅' : '❌'}</p>
            <p>Start Address: {formData.startAddress || 'Ej ifylld'} (Lokal: {localStartAddress?.length || 0} tecken)</p>
            <p>End Address: {formData.endAddress || 'Ej ifylld'} (Lokal: {localEndAddress?.length || 0} tecken)</p>
            <p>Start Property Type: {formData.startPropertyType || 'Ej vald'}</p>
            <p>End Property Type: {formData.endPropertyType || 'Ej vald'}</p>
            <p>Move Time: {formData.moveTime || 'Ej vald'}</p>
            <p>Move Date: {formData.moveDate || 'Ej vald'}</p>
            <p>Distance: {formData.calculatedDistance || 'Ej beräknad'}</p>
            <p>Google Ready: {typeof window !== 'undefined' && window.google?.maps?.places ? '✅' : '❌'}</p>
          </div>
        )}

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
            disabled={!isFormValid}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Nästa
            {!isFormValid && (
              <AlertTriangle className="ml-2 w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  )
}3