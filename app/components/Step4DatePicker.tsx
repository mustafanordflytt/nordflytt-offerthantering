'use client';

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Check } from "lucide-react"
import { format } from "date-fns"

interface TimeOption {
  value: string
  label: string
}

const timeOptions: TimeOption[] = [
  { value: "08:00-10:00", label: "08:00-10:00" },
  { value: "10:00-12:00", label: "10:00-12:00" },
  { value: "12:00-14:00", label: "12:00-14:00" },
  { value: "14:00-16:00", label: "14:00-16:00" },
  { value: "16:00-18:00", label: "16:00-18:00" },
]

interface Step4Props {
  formData: {
    moveDate: string
    moveTime: string
    flexibleMoveDate?: boolean
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
}

export default function Step4DatePicker({
  formData,
  handleChange,
  nextStep,
  prevStep,
}: Step4Props) {
  const [date, setDate] = useState<Date | undefined>(
    formData.moveDate ? new Date(formData.moveDate) : undefined
  )
  const [time, setTime] = useState<string>(formData.moveTime || "")
  const [isFlexibleDate, setIsFlexibleDate] = useState<boolean>(formData.flexibleMoveDate || false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      handleChange("moveDate", formattedDate)
    }
  }

  const handleTimeChange = (selectedTime: string) => {
    setTime(selectedTime)
    handleChange("moveTime", selectedTime)
  }

  const handleFlexibleDateChange = (checked: boolean) => {
    setIsFlexibleDate(checked)
    handleChange("flexibleMoveDate", checked)
  }

  const handleSubmit = () => {
    if (isFormValid()) {
      nextStep()
    }
  }

  const isFormValid = (): boolean => {
    // Om flyttdatum är flexibelt behövs inte något exakt datum eller tid
    if (isFlexibleDate) {
      return true
    }
    
    // Annars krävs datum och tid
    return date !== undefined && time !== ""
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Flyttdatum</h2>
        <p className="text-gray-500">Välj önskat datum för din flytt</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox 
            id="flexible-date" 
            checked={isFlexibleDate}
            onCheckedChange={handleFlexibleDateChange}
          />
          <Label htmlFor="flexible-date" className="font-medium">
            Flexibelt flyttdatum
          </Label>
        </div>

        <div className={cn("flex flex-col gap-4", isFlexibleDate && "opacity-50 pointer-events-none")}>
          <div className="p-4 border rounded-lg">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(currentDate: Date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return currentDate < today
              }}
              className="rounded-md border"
              classNames={{
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
            />
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Önskad tid</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {timeOptions.map((timeOption) => (
                <button
                  key={timeOption.value}
                  type="button"
                  className={`relative flex items-center space-x-2 rounded-md border p-3 shadow-sm focus:outline-none ${
                    time === timeOption.value
                      ? "border-blue-600 ring-1 ring-blue-600"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleTimeChange(timeOption.value)}
                >
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">
                        {timeOption.label}
                      </span>
                    </span>
                  </span>
                  {time === timeOption.value && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={prevStep}>
            Tillbaka
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            Nästa
          </Button>
        </div>
      </div>
    </div>
  )
} 