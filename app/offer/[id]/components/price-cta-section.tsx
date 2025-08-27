"use client"

import { useState, useEffect } from "react"
import { CheckCircleIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PriceRutCard } from "./price-rut-card"
import { ServiceSelectionSummary } from "./service-selection-summary"

type PriceCTASectionProps = {
  totalPrice: number
  isPulsing: boolean
  handleBookAll: () => void
  livingArea?: number
  packingService?: string
  cleaningService?: string
  additionalServices?: string[]
  movingBoxes?: number
  rentalBoxes?: { [key: string]: number }
}

export function PriceCTASection({ totalPrice: initialPrice, isPulsing, handleBookAll, livingArea = 70, packingService, cleaningService, additionalServices, movingBoxes, rentalBoxes }: PriceCTASectionProps) {
  // Check if services were selected in the form
  const packingSelected = packingService && packingService !== "Ingen packning" && packingService !== "";
  const cleaningSelected = cleaningService && cleaningService !== "Ingen städning" && cleaningService !== "";
  
  const [services, setServices] = useState({
    moving: { selected: true, price: initialPrice },
    fullPacking: { selected: packingSelected, price: livingArea * 44 },
    cleaning: { selected: cleaningSelected, price: livingArea * 44 }
  })

  // Beräkna totalpris baserat på valda tjänster
  const calculateTotalPrice = (currentServices: typeof services) => {
    let total = currentServices.moving.price; // Grundpris för flytthjälp
    
    if (currentServices.fullPacking.selected) {
      total += currentServices.fullPacking.price;
    }
    if (currentServices.cleaning.selected) {
      total += currentServices.cleaning.price;
    }
    
    return total;
  }

  const [totalPrice, setTotalPrice] = useState(() => calculateTotalPrice(services))

  // Uppdatera totalpris när services ändras
  useEffect(() => {
    const newTotal = calculateTotalPrice(services);
    setTotalPrice(newTotal);
  }, [services]);

  // Hantera tjänsteval
  const handleToggleService = (serviceType: string) => {
    setServices(prev => {
      const updatedServices = {
        ...prev,
        [serviceType]: {
          ...prev[serviceType as keyof typeof prev],
          selected: !prev[serviceType as keyof typeof prev].selected,
          price: livingArea * 44
        }
      };
      return updatedServices;
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <PriceRutCard 
        totalPrice={totalPrice} 
        originalPrice={totalPrice * 2} 
        isPulsing={isPulsing}
        handleBookAll={handleBookAll}
      />
      
      <ServiceSelectionSummary 
        services={services}
        onToggleService={handleToggleService}
        totalPrice={totalPrice}
        livingArea={livingArea}
        additionalServices={additionalServices}
        movingBoxes={movingBoxes}
        rentalBoxes={rentalBoxes}
      />
    </div>
  )
}
