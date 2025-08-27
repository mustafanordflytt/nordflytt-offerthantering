import { cn } from "@/lib/utils"

interface FreeCancellationBadgeProps {
  className?: string
}

export function FreeCancellationBadge({ className }: FreeCancellationBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-[#E5F6EA] px-2.5 py-0.5 text-xs font-medium text-[#1B874B]",
      className
    )}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      Gratis avbokning
    </div>
  )
} 