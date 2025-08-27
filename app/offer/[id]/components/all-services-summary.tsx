"use client"

import { useState } from "react"
import { CheckIcon, PlusIcon, InfoIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AllServicesSummaryProps = {
  packingService?: string
  cleaningService?: string
  additionalServices?: string[]
  livingArea?: number
  totalPrice: number
  onToggleService?: (service: 'packing' | 'cleaning', selected: boolean) => void
}

export function AllServicesSummary({ 
  packingService, 
  cleaningService, 
  additionalServices = [],
  livingArea = 70,
  totalPrice,
  onToggleService
}: AllServicesSummaryProps) {
  
  // Helper to check if service is selected from form
  const isServiceSelectedFromForm = (service?: string) => {
    return service && service !== "Ingen packning" && service !== "Ingen städning" && service !== "";
  }
  
  // Local state for dynamically adding services
  const [localPackingSelected, setLocalPackingSelected] = useState(isServiceSelectedFromForm(packingService));
  const [localCleaningSelected, setLocalCleaningSelected] = useState(isServiceSelectedFromForm(cleaningService));

  // Get service prices
  const getServicePrice = (serviceName: string, category: 'packing' | 'cleaning' | 'additional') => {
    if (category === 'packing' || category === 'cleaning') {
      return livingArea * 44;
    }
    
    // Additional services with fixed prices
    const servicePrices: Record<string, number> = {
      "Möbelmontering": 1500,
      "Upphängning & installation": 1200,
      "Bortforsling & återvinning": 1800,
      "Demontering & montering": 1500,
      "Nätverksinstallation & IT-drift": 7500,
      "Avfallshantering & återvinning": 1800
    };
    
    return servicePrices[serviceName] || 0;
  }
  
  const handleTogglePacking = () => {
    const newValue = !localPackingSelected;
    setLocalPackingSelected(newValue);
    onToggleService?.('packing', newValue);
  }
  
  const handleToggleCleaning = () => {
    const newValue = !localCleaningSelected;
    setLocalCleaningSelected(newValue);
    onToggleService?.('cleaning', newValue);
  }

  return (
    <Card className="mt-6 p-5 border border-[#E0E0E0] shadow-sm bg-white">
      <h3 className="font-bold text-lg mb-4">Valda tjänster</h3>

      {/* Flytthjälp (alltid vald) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
            <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
          </div>
          <div>
            <p className="font-medium">Flytthjälp</p>
            <p className="text-sm text-[#4F4F4F]">Inkluderar transport, bärhjälp och försäkring</p>
          </div>
        </div>
        <CheckIcon className="w-5 h-5 text-[#4CAF50]" />
      </div>

      {/* Packning */}
      {isServiceSelected(packingService) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <div>
              <p className="font-medium">{packingService}</p>
              <p className="text-sm text-[#4F4F4F]">{getServicePrice(packingService!, 'packing')} kr</p>
            </div>
          </div>
          <CheckIcon className="w-5 h-5 text-[#4CAF50]" />
        </div>
      )}

      {/* Städning */}
      {isServiceSelected(cleaningService) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <div>
              <p className="font-medium">{cleaningService}</p>
              <p className="text-sm text-[#4F4F4F]">{getServicePrice(cleaningService!, 'cleaning')} kr</p>
            </div>
          </div>
          <CheckIcon className="w-5 h-5 text-[#4CAF50]" />
        </div>
      )}

      {/* Ytterligare tjänster */}
      {additionalServices && additionalServices.length > 0 && (
        <>
          <div className="mt-4 mb-2">
            <p className="text-sm font-medium text-[#4F4F4F]">Ytterligare tjänster:</p>
          </div>
          {additionalServices.map((service, index) => (
            <div key={index} className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
                  <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
                </div>
                <div>
                  <p className="font-medium">{service}</p>
                  <p className="text-sm text-[#4F4F4F]">{getServicePrice(service, 'additional')} kr</p>
                </div>
              </div>
              <CheckIcon className="w-5 h-5 text-[#4CAF50]" />
            </div>
          ))}
        </>
      )}

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-[#E0E0E0]">
        <div className="flex justify-between items-center">
          <span className="font-medium text-[#4F4F4F]">Totalt pris</span>
          <span className="text-xl font-bold">{totalPrice} kr</span>
        </div>
      </div>
    </Card>
  )
}