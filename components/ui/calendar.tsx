"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type CalendarProps = {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  fromDate?: Date
  toDate?: Date
  locale?: Locale
  [key: string]: any
}

/**
 * Simple calendar component replacement that uses native date input
 * This is a temporary solution to avoid react-day-picker dependency conflicts
 */
function Calendar({
  selected,
  onSelect,
  className,
  disabled,
  fromDate,
  toDate,
  ...props
}: CalendarProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const date = new Date(dateValue)
      onSelect?.(date)
    } else {
      onSelect?.(undefined)
    }
  }

  // Convert Date to string format for input
  const dateValue = selected instanceof Date 
    ? selected.toISOString().split('T')[0]
    : ''

  // Calculate min and max dates
  const minDate = fromDate?.toISOString().split('T')[0]
  const maxDate = toDate?.toISOString().split('T')[0]

  return (
    <div className={cn("p-3", className)}>
      <input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        min={minDate}
        max={maxDate}
        className={cn(
          "w-full px-3 py-2 border border-input rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "dark:bg-background"
        )}
        {...props}
      />
      <p className="text-sm text-muted-foreground mt-2">
        Välj datum med datumväljaren
      </p>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }