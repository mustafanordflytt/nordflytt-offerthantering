"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Map, MapPin, Check } from "lucide-react"

interface AddressDistanceProps {
  initialFromAddress?: string
  initialToAddress?: string
  onDistanceCalculated?: (data: { 
    distance: number
    distanceText: string
    duration: string
    fromAddress: string
    toAddress: string
  }) => void
  className?: string
}

// Debounce utility function to limit API calls
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

export default function AddressDistance({
  initialFromAddress = "",
  initialToAddress = "",
  onDistanceCalculated,
  className = ""
}: AddressDistanceProps) {
  const [fromAddress, setFromAddress] = useState(initialFromAddress)
  const [toAddress, setToAddress] = useState(initialToAddress)
  const [distance, setDistance] = useState<{
    meters: number
    text: string
    duration: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Refs för autokomplettering
  const fromInputRef = useRef<HTMLInputElement>(null)
  const toInputRef = useRef<HTMLInputElement>(null)
  const fromAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const toAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const distanceMatrixRef = useRef<google.maps.DistanceMatrixService | null>(null)
  
  // Debounce timer för att förhindra för många API-anrop
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Instead of loading Google Maps API, just check if it's available and initialize
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initGoogleMaps();
    }
  }, []);
  
  // Initialisera Google Maps-tjänster
  const initGoogleMaps = () => {
    // Kontrollera att Google Maps API är laddad
    if (typeof google === "undefined" || !google.maps || !google.maps.places) {
      setError("Google Maps API är inte tillgänglig. Kontrollera din internetanslutning.")
      return
    }
    
    if (fromInputRef.current && !fromAutocompleteRef.current) {
      fromAutocompleteRef.current = new google.maps.places.Autocomplete(fromInputRef.current, {
        componentRestrictions: { country: "se" },
        fields: ["formatted_address"],
      })
      
      fromAutocompleteRef.current.addListener("place_changed", () => {
        const place = fromAutocompleteRef.current?.getPlace()
        if (place?.formatted_address) {
          setFromAddress(place.formatted_address)
        }
      })
    }
    
    if (toInputRef.current && !toAutocompleteRef.current) {
      toAutocompleteRef.current = new google.maps.places.Autocomplete(toInputRef.current, {
        componentRestrictions: { country: "se" },
        fields: ["formatted_address"],
      })
      
      toAutocompleteRef.current.addListener("place_changed", () => {
        const place = toAutocompleteRef.current?.getPlace()
        if (place?.formatted_address) {
          setToAddress(place.formatted_address)
        }
      })
    }
    
    // Initialisera distanstjänsten
    if (!distanceMatrixRef.current) {
      distanceMatrixRef.current = new google.maps.DistanceMatrixService();
    }
  }
  
  // Uppdatera adresser när initialvärdena ändras
  useEffect(() => {
    if (initialFromAddress && initialFromAddress !== fromAddress) {
      setFromAddress(initialFromAddress)
    }
    if (initialToAddress && initialToAddress !== toAddress) {
      setToAddress(initialToAddress)
    }
  }, [initialFromAddress, initialToAddress, fromAddress, toAddress])
  
  // Debounced function to calculate distance
  const debouncedCalculateDistance = useCallback(
    debounce(() => {
      calculateDistance()
    }, 1000),
    [fromAddress, toAddress]
  )
  
  // Calculate distance when both addresses are filled
  useEffect(() => {
    if (fromAddress && toAddress) {
      debouncedCalculateDistance()
    } else {
      // Reset distance if either address is empty
      setDistance(null)
    }
  }, [fromAddress, toAddress, debouncedCalculateDistance])
  
  // Beräkna avstånd
  const calculateDistance = () => {
    if (!fromAddress || !toAddress) {
      setError("Både från- och tilladress krävs för att beräkna avstånd.")
      return
    }
    
    if (!distanceMatrixRef.current) {
      setError("Google Maps tjänst är inte tillgänglig.")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    distanceMatrixRef.current.getDistanceMatrix(
      {
        origins: [fromAddress],
        destinations: [toAddress],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      },
      (response, status) => {
        setIsLoading(false)
        
        if (status !== "OK" || !response) {
          setError(`Kunde inte beräkna avstånd: ${status}`)
          return
        }
        
        const distanceResult = response.rows[0]?.elements[0]
        
        if (distanceResult?.status === "OK" && 
            distanceResult.distance && 
            distanceResult.duration) {
          
          const distanceData = {
            meters: distanceResult.distance.value,
            text: distanceResult.distance.text,
            duration: distanceResult.duration.text
          }
          
          setDistance(distanceData)
          
          // Call the callback with the calculated distance data
          if (onDistanceCalculated) {
            onDistanceCalculated({
              distance: distanceData.meters,
              distanceText: distanceData.text,
              duration: distanceData.duration,
              fromAddress,
              toAddress
            })
          }
        } else {
          setError(`Kunde inte hitta rutt mellan adresserna: ${distanceResult?.status || 'Unknown error'}`)
        }
      }
    )
  }
  
  return (
    <Card className={`p-4 mb-4 ${className}`}>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fromAddress" className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Från adress <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="fromAddress"
              ref={fromInputRef}
              placeholder="Ange startadress"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              className="pl-10"
              required
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="toAddress" className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Till adress <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="toAddress"
              ref={toInputRef}
              placeholder="Ange destinationsadress"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="pl-10"
              required
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 flex items-center text-sm mt-2">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="text-blue-600 text-sm flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Beräknar avstånd...
          </div>
        )}
        
        {distance && (
          <div className="text-green-600 text-sm flex items-center">
            <Check className="w-4 h-4 mr-1" />
            <span>
              Avstånd: <strong>{distance.text}</strong> (körtid: {distance.duration})
            </span>
          </div>
        )}
        
        {/* Dolt fält för formulärdata */}
        <input
          type="hidden"
          id="calculatedDistance"
          name="calculatedDistance"
          value={distance?.meters || ""}
        />
      </div>
    </Card>
  )
} 