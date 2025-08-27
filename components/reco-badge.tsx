"use client"

import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RecoBadge({
  className,
  showTooltip = true,
  size = "normal",
}: {
  className?: string
  showTooltip?: boolean
  size?: "small" | "normal"
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center bg-white rounded-lg p-2 border border-[#E0E0E0] shadow-sm hover:shadow transition-shadow duration-200">
        <img
          src="/images/reco-badge.png"
          alt="Rekommenderat 2 år i rad på Reco"
          className={size === "normal" ? "h-12 w-auto" : "h-8 w-auto"}
        />
        <div className="ml-3">
          <div className={size === "normal" ? "text-sm font-medium" : "text-xs font-medium"}>
            Rekommenderat av Reco – 2 år i rad
          </div>
          <div className="flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star, i) => (
                <svg
                  key={i}
                  className={`${size === "normal" ? "w-4 h-4" : "w-3 h-3"} ${i < 5 ? "text-[#FFD700]" : "text-gray-300"}`}
                  fill={i < 5 ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              ))}
            </div>
            <div className={size === "normal" ? "text-xs text-[#4F4F4F] ml-1" : "text-[10px] text-[#4F4F4F] ml-1"}>
              4.8/5 (62 omdömen)
            </div>

            {showTooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 text-[#4F4F4F] opacity-70 hover:opacity-100 transition-opacity">
                      <InfoIcon className={size === "normal" ? "w-3.5 h-3.5" : "w-3 h-3"} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px]">
                    <p className="text-xs">
                      Reco är en oberoende plattform för verifierade kundomdömen. Nordflytt har fått 4.8/5 i betyg från
                      62 verifierade kunder och blivit rekommenderat två år i rad tack vare sin höga kundnöjdhet.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
