"use client"

import { useState } from "react"
import { CheckIcon, PlusIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getServicePrice } from "@/lib/service-mapping"

type ServiceSelectionSummaryProps = {
  services: {
    moving: { selected: boolean; price: number }
    fullPacking: { selected: boolean; price: number }
    cleaning: { selected: boolean; price: number }
  }
  onToggleService: (service: string) => void
  totalPrice: number
  livingArea?: number
  additionalServices?: string[]
  movingBoxes?: number
  rentalBoxes?: { [key: string]: number }
}

export function ServiceSelectionSummary({ services, onToggleService, totalPrice, livingArea = 70, additionalServices = [], movingBoxes = 0, rentalBoxes = {} }: ServiceSelectionSummaryProps) {
  // Beräkna priser baserat på kvadratmeter (44 kr/m² enligt prismodellen)
  const additionalServicePrices = {
    fullPacking: livingArea * 44,
    cleaning: livingArea * 44
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
            <p className="text-sm text-[#4F4F4F]">{services.moving.price} kr</p>
          </div>
        </div>
        <CheckIcon className="w-5 h-5 text-[#4CAF50]" />
      </div>

      {/* Packning */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
            services.fullPacking.selected ? "bg-[#E6F7ED]" : "bg-[#F5F9FF]"
          )}>
            {services.fullPacking.selected ? (
              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
            ) : (
              <PlusIcon className="w-4 h-4 text-[#002A5C]" />
            )}
          </div>
          <div>
            <div className="flex items-center">
              <p className="font-medium">Packning</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="w-4 h-4 ml-1.5 text-[#4F4F4F]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px]">Vi packar dina tillhörigheter säkert och effektivt</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-[#4F4F4F]">{additionalServicePrices.fullPacking} kr</p>
          </div>
        </div>
        {services.fullPacking.selected ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[#FF2C84] hover:bg-red-50"
            onClick={() => onToggleService("fullPacking")}
          >
            Ta bort
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[#002A5C] text-[#002A5C] hover:bg-[#F5F9FF]"
            onClick={() => onToggleService("fullPacking")}
          >
            Lägg till
          </Button>
        )}
      </div>

      {/* Flyttstädning */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
            services.cleaning.selected ? "bg-[#E6F7ED]" : "bg-[#F5F9FF]"
          )}>
            {services.cleaning.selected ? (
              <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
            ) : (
              <PlusIcon className="w-4 h-4 text-[#002A5C]" />
            )}
          </div>
          <div>
            <div className="flex items-center">
              <p className="font-medium">Flyttstädning</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="w-4 h-4 ml-1.5 text-[#4F4F4F]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px]">Professionell städning av din gamla bostad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-[#4F4F4F]">{additionalServicePrices.cleaning} kr</p>
          </div>
        </div>
        {services.cleaning.selected ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[#FF2C84] hover:bg-red-50"
            onClick={() => onToggleService("cleaning")}
          >
            Ta bort
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[#002A5C] text-[#002A5C] hover:bg-[#F5F9FF]"
            onClick={() => onToggleService("cleaning")}
          >
            Lägg till
          </Button>
        )}
      </div>

      {/* Tilläggstjänster från formuläret */}
      {additionalServices && additionalServices.length > 0 && (
        <>
          <div className="mt-4 mb-2">
            <p className="text-sm font-semibold text-[#4F4F4F] uppercase tracking-wide">Tilläggstjänster</p>
          </div>
          {additionalServices.map((service, index) => {
            const servicePrice = getServicePrice(service);
            return (
              <div key={index} className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
                    <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
                  </div>
                  <div>
                    <p className="font-medium">{service}</p>
                    <p className="text-sm text-[#4F4F4F]">{servicePrice} kr</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="w-4 h-4 text-[#4F4F4F]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">Vald i formuläret</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <CheckIcon className="w-5 h-5 text-[#4CAF50] ml-2" />
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Flyttkartonger och specialkartonger */}
      {(movingBoxes > 0 || Object.keys(rentalBoxes).length > 0) && (
        <>
          <div className="mt-4 mb-2">
            <p className="text-sm font-semibold text-[#4F4F4F] uppercase tracking-wide">Kartonger & Emballage</p>
          </div>
          
          {/* Flyttkartonger */}
          {movingBoxes > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
                  <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
                </div>
                <div>
                  <p className="font-medium">Flyttkartonger</p>
                  <p className="text-sm text-[#4F4F4F]">{movingBoxes} st</p>
                </div>
              </div>
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="w-4 h-4 text-[#4F4F4F]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px]">Hyrs ut och återlämnas efter flytt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CheckIcon className="w-5 h-5 text-[#4CAF50] ml-2" />
              </div>
            </div>
          )}
          
          {/* Specialkartonger */}
          {Object.entries(rentalBoxes).map(([boxType, count]) => {
            if (count && Number(count) > 0) {
              const boxNames: Record<string, string> = {
                'wardrobe': 'Garderobskartonger',
                'painting': 'Tavelkartonger',
                'mirror': 'Spegelkartonger'
              };
              return (
                <div key={boxType} className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#E6F7ED] flex items-center justify-center mr-3">
                      <CheckIcon className="w-4 h-4 text-[#4CAF50]" />
                    </div>
                    <div>
                      <p className="font-medium">{boxNames[boxType] || boxType}</p>
                      <p className="text-sm text-[#4F4F4F]">{count} st</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="w-4 h-4 text-[#4F4F4F]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px]">Specialkartonger för ömtåliga föremål</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <CheckIcon className="w-5 h-5 text-[#4CAF50] ml-2" />
                  </div>
                </div>
              );
            }
          })}
        </>
      )}

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-[#E0E0E0]">
        <div className="flex justify-between items-center">
          <span className="font-medium text-[#4F4F4F]">Totalt</span>
          <span className="text-xl font-bold">{totalPrice} kr</span>
        </div>
      </div>
    </Card>
  )
}
