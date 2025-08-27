"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/pricing"
import { CheckCircleIcon, ArrowRightIcon, ShieldIcon, BanknoteIcon } from "lucide-react"
import { FreeCancellationBadge } from "@/components/free-cancellation-badge"

type PriceRutCardProps = {
  totalPrice: number
  originalPrice: number
  isPulsing: boolean
  handleBookAll: () => void
}

export function PriceRutCard({ totalPrice, originalPrice, isPulsing, handleBookAll }: PriceRutCardProps) {
  return (
    <Card id="main-cta-section" className="p-5 border border-[#E0E0E0] shadow-md bg-white">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium text-base text-[#4F4F4F]">Ordinarie pris:</div>
          <div className="text-base line-through">{formatPrice(originalPrice)} kr</div>
        </div>

        <div className="flex justify-between items-center">
          <div className="font-bold text-lg">Totalt pris:</div>
          <div className="text-right">
            <div className="font-bold text-2xl">{formatPrice(totalPrice)} kr</div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end">
          <span className="inline-flex items-center bg-[#E6F7ED] text-[#2E7D32] text-sm font-medium px-2 py-1 rounded-full">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            RUT-avdrag: -{Math.round((originalPrice - totalPrice) / originalPrice * 100)}%
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center text-base text-[#2E7D32]">
          <CheckCircleIcon className="w-5 h-5 mr-2 text-[#4CAF50]" />
          <span>Inkluderar RUT-avdrag</span>
        </div>
        <div className="flex items-center text-base text-[#2E7D32]">
          <BanknoteIcon className="w-5 h-5 mr-2 text-[#4CAF50]" />
          <span>Du betalar först efter flytten</span>
        </div>
        <div className="flex items-center text-base text-[#2E7D32]">
          <ShieldIcon className="w-5 h-5 mr-2 text-[#4CAF50]" />
          <span>Inga dolda avgifter</span>
        </div>
      </div>

      <div className="mb-5">
        <FreeCancellationBadge />
      </div>

      <Button
        className={cn(
          "w-full bg-[#FF2C84] hover:bg-[#E01A6F] text-white font-semibold rounded-xl py-6 h-auto relative text-lg",
          isPulsing && "animate-pulse-subtle",
        )}
        onClick={handleBookAll}
      >
        <div className="flex items-center justify-center w-full">
          <span>Boka flytthjälp</span>
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </div>
      </Button>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center bg-[#F5F9FF] p-2 rounded-lg">
          <span className="text-[#FFD700] text-lg">⭐</span>
          <span className="text-xs font-medium text-center">Reco 4.8/5</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#F5F9FF] p-2 rounded-lg">
          <span className="text-[#4CAF50] text-lg">✓</span>
          <span className="text-xs font-medium text-center">500+ nöjda kunder</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#F5F9FF] p-2 rounded-lg">
          <span className="text-[#002A5C] text-lg">🏢</span>
          <span className="text-xs font-medium text-center">Rekommenderad</span>
        </div>
      </div>
    </Card>
  )
}
