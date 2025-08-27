"use client"

import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RecoBadgeCompact({
  className,
  showTooltip = true,
}: {
  className?: string
  showTooltip?: boolean
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-[#FFD700] mr-1">⭐</span>
          <span className="text-sm font-medium">Reco-rekommenderad 2 år i rad – 4.8/5</span>

          {showTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 text-[#4F4F4F] opacity-70 hover:opacity-100 transition-opacity">
                    <InfoIcon className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">
                    Reco är en oberoende plattform för verifierade kundomdömen. Nordflytt har fått 4.8/5 i betyg från 62
                    verifierade kunder och blivit rekommenderat två år i rad.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}
