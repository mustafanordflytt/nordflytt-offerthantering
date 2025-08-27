"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import AddressDistance from "./AddressDistance"
import { Button } from "@/components/ui/button"
import Script from "next/script"

interface DistanceData {
  distance: number
  distanceText: string
  duration: string
  fromAddress: string
  toAddress: string
}

export function AddressDistanceExample() {
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false)
  const [formState, setFormState] = useState({
    startAddress: "",
    endAddress: "",
    calculatedDistance: 0
  })

  // Handle when distance is calculated
  const handleDistanceCalculated = (distanceData: DistanceData) => {
    setFormState(prev => ({
      ...prev,
      calculatedDistance: distanceData.distance
    }))
    
    console.log("Distance calculated:", distanceData)
  }

  // Handle Google API loaded callback
  const handleGoogleApiLoaded = () => {
    setGoogleApiLoaded(true)
  }

  // Handle continue button click
  const handleContinue = () => {
    console.log("Continuing with form data:", formState)
    // Here you would typically navigate to the next step
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4">Beräkna flyttsträcka</h2>
        
        {/* Load Google Maps API */}
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`}
          onLoad={handleGoogleApiLoaded}
        />
        
        {!googleApiLoaded ? (
          <p className="text-sm text-muted-foreground">Laddar karta...</p>
        ) : (
          <AddressDistance 
            initialFromAddress={formState.startAddress}
            initialToAddress={formState.endAddress}
            onDistanceCalculated={handleDistanceCalculated}
          />
        )}
        
        {formState.calculatedDistance > 0 && (
          <div className="mt-6">
            <Button 
              className="w-full"
              onClick={handleContinue}
            >
              Fortsätt
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 