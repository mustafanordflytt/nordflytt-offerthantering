"use client"

import { InfoIcon, WalletIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RutExplainer({ originalPrice, discountedPrice }: { originalPrice: number; discountedPrice: number }) {
  const discount = originalPrice - discountedPrice
  const discountPercentage = Math.round((discount / originalPrice) * 100)

  return (
    <div className="bg-[#F5F9FF] p-4 rounded-lg w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <WalletIcon className="w-5 h-5 mr-2 text-[#002A5C]" />
          <span className="font-medium">RUT-avdrag</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-[#4F4F4F] opacity-70 hover:opacity-100 transition-opacity">
                <InfoIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <div className="text-xs">
                <p className="font-bold mb-1">Vad är RUT-avdrag?</p>
                <p>
                  RUT-avdrag är en skattereduktion på 50% av arbetskostnaden för hushållsnära tjänster som städning och
                  flytthjälp.
                </p>
                <p className="mt-1">
                  Du behöver inte göra något – vi har redan räknat in avdraget i priset och sköter all administration.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[#4F4F4F]">Ordinarie pris:</div>
        <div className="text-base font-medium line-through">{originalPrice} SEK</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Du betalar efter RUT:</div>
        <div className="text-lg font-bold">{discountedPrice} SEK</div>
      </div>

      <div className="mt-3 text-sm text-[#2E7D32] bg-[#E6F7ED] px-3 py-1.5 rounded-lg flex items-center justify-center">
        <span className="font-medium">
          Du sparar {discount} SEK ({discountPercentage}%)
        </span>
      </div>
    </div>
  )
}
