"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, MapPin, Calendar, Info, Clock, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LargeElevatorIcon, SmallElevatorIcon, StairsIcon, DeskIcon } from "./icons"

interface FurnitureValuationFormProps {
  formData: {
    valuationItems?: string[]
    valuationOtherItem?: string
    valuationAddress?: string
    valuationFloor?: string
    valuationElevator?: "big" | "small" | "none"
    valuationDate?: string
    valuationTime?: string
    valuationTimePreference?: "asap" | "specific"
    valuationComment?: string
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
  currentStep?: number
  totalSteps?: number
}

export default function FurnitureValuationForm({
  formData,
  handleChange,
  nextStep,
  prevStep,
  currentStep = 4,
  totalSteps = 9,
}: FurnitureValuationFormProps) {
  // State for form fields
  const [selectedItems, setSelectedItems] = useState<string[]>(formData.valuationItems || [])
  const [otherItemText, setOtherItemText] = useState<string>(formData.valuationOtherItem || "")
  const [addressFocused, setAddressFocused] = useState<boolean>(false)
  const [timePreference, setTimePreference] = useState<"asap" | "specific">(formData.valuationTimePreference || "asap")
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)
  const [elevatorType, setElevatorType] = useState<"big" | "small" | "none">("big") // Pre-select "big" elevator

  // Refs for form fields
  const addressRef = useRef<HTMLInputElement>(null)
  const floorRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split("T")[0]

  // Furniture items that can be valued
  const valuationItems = [
    { id: "sofa", label: "Soffa / fåtölj", icon: "🛋" },
    { id: "chair", label: "Stolar", icon: "🪑" },
    { id: "desk", label: "Elektronik", icon: "🖥️" },
    { id: "table", label: "Bord", icon: <DeskIcon />, isCustomIcon: true },
    { id: "storage", label: "Förvaring", icon: "📦" },
    { id: "other", label: "Annat", icon: "➕" },
  ]

  // Elevator options
  const elevatorOptions = [
    {
      id: "big",
      icon: <LargeElevatorIcon />,
      label: "Fullstor hiss",
      description: "Rymmer större möbler",
    },
    {
      id: "small",
      icon: <SmallElevatorIcon />,
      label: "Liten hiss",
      description: "Kan rymma mindre föremål",
    },
    {
      id: "none",
      icon: <StairsIcon />,
      label: "Ingen hiss",
      description: "Bärs via trappor",
    },
  ]

  // Handle item selection with no limit
  const handleItemToggle = (itemId: string) => {
    let newSelectedItems = [...selectedItems]

    if (newSelectedItems.includes(itemId)) {
      // Remove item if already selected
      newSelectedItems = newSelectedItems.filter((id) => id !== itemId)
    } else {
      // Add the item to the selection
      newSelectedItems.push(itemId)
    }

    setSelectedItems(newSelectedItems)
    handleChange("valuationItems", newSelectedItems)
  }

  // Handle elevator type selection
  const handleElevatorChange = (type: "big" | "small" | "none") => {
    setElevatorType(type)
    handleChange("valuationElevator", type)
  }

  // Handle time preference change
  const handleTimePreferenceChange = (value: "asap" | "specific") => {
    setTimePreference(value)
    handleChange("valuationTimePreference", value)
  }

  // Validate form
  const validateForm = () => {
    const address = addressRef.current?.value || ""
    const floor = floorRef.current?.value || ""

    // Basic validation - require at least one item, address, and floor
    const isValid =
      selectedItems.length > 0 &&
      !!address &&
      !!floor &&
      (timePreference === "asap" || (timePreference === "specific" && !!dateRef.current?.value))

    return isValid
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)

    if (validateForm()) {
      // Collect all form data
      const data = {
        valuationItems: selectedItems,
        valuationOtherItem: otherItemText,
        valuationAddress: addressRef.current?.value || "",
        valuationFloor: floorRef.current?.value || "",
        valuationElevator: elevatorType,
        valuationTimePreference: timePreference,
        valuationDate: dateRef.current?.value || "",
        valuationComment: commentRef.current?.value || "",
      }

      // Update parent state
      Object.entries(data).forEach(([key, value]) => {
        handleChange(key, value)
      })

      // Move to next step
      nextStep()
    } else {
      // Scroll to first invalid field
      const firstInvalidField = document.querySelector(".border-red-500")
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-bold">Sälj era kontorsmöbler</h2>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Steg {currentStep} av {totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={(currentStep / totalSteps) * 100} className="h-2 mb-6" />

      <div className="space-y-8">
        {/* What to value section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2 text-blue-500">🪑</span>
            Vad vill ni ha värderat?
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {valuationItems.map((item) => (
              <Card
                key={item.id}
                className={`p-4 cursor-pointer transition-all relative ${
                  selectedItems.includes(item.id)
                    ? "border-2 border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]"
                    : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                } ${formSubmitted && selectedItems.length === 0 ? "border-red-500" : ""}`}
                onClick={() => handleItemToggle(item.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl mb-2">
                    {item.isCustomIcon ? <div className="w-8 h-8 text-blue-600">{item.icon}</div> : item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {selectedItems.includes(item.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </Card>
            ))}
          </div>

          {selectedItems.includes("other") && (
            <div className="mt-3">
              <Label htmlFor="otherItemText" className="text-sm font-medium">
                Beskriv vad ni vill ha värderat:
              </Label>
              <Input
                id="otherItemText"
                value={otherItemText}
                onChange={(e) => {
                  setOtherItemText(e.target.value)
                  handleChange("valuationOtherItem", e.target.value)
                }}
                className="mt-1"
                placeholder="T.ex. konferensbord, soffor, etc."
              />
            </div>
          )}

          {formSubmitted && selectedItems.length === 0 && (
            <p className="text-red-500 text-xs mt-1">Välj minst en möbel för värdering.</p>
          )}

          <p className="text-sm text-gray-600 mt-4 flex items-start">
            <span className="mr-2 text-blue-500 flex-shrink-0">👉</span>
            Välj de möbler ni vill ha värderade – vi kommer och gör en snabb värdering helt kostnadsfritt.
          </p>
        </div>

        {/* Address section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2 text-blue-500">📍</span>
            Var finns möblerna?
          </h3>

          <div className="space-y-4">
            {/* Address input */}
            <div>
              <Label htmlFor="valuationAddress" className="text-sm font-medium">
                Adress
              </Label>
              <div className="relative mt-1">
                <Input
                  id="valuationAddress"
                  ref={addressRef}
                  defaultValue={formData.valuationAddress || ""}
                  onFocus={() => setAddressFocused(true)}
                  onBlur={() => setAddressFocused(false)}
                  className={`w-full pl-10 py-2.5 ${
                    addressFocused
                      ? "border-blue-400 ring-2 ring-blue-100"
                      : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  } ${formSubmitted && !addressRef.current?.value ? "border-red-500" : ""}`}
                  placeholder="Gatuadress"
                  required
                />
                <MapPin
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    addressFocused ? "text-blue-600" : "text-gray-400"
                  }`}
                  size={18}
                />
              </div>
              {formSubmitted && !addressRef.current?.value && (
                <p className="text-red-500 text-xs mt-1">Vänligen ange adressen där möblerna finns.</p>
              )}
            </div>

            {/* Floor input */}
            <div>
              <Label htmlFor="valuationFloor" className="text-sm font-medium">
                Våning
              </Label>
              <Input
                id="valuationFloor"
                ref={floorRef}
                defaultValue={formData.valuationFloor || ""}
                className={`mt-1 ${formSubmitted && !floorRef.current?.value ? "border-red-500" : ""}`}
                placeholder="T.ex. 3, BV, etc."
                required
              />
              {formSubmitted && !floorRef.current?.value && (
                <p className="text-red-500 text-xs mt-1">Vänligen ange vilken våning möblerna finns på.</p>
              )}
            </div>

            {/* Elevator options */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Hiss</Label>
              <div className="grid grid-cols-3 gap-3">
                {elevatorOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`p-4 cursor-pointer hover:border-accent/50 transition-all ${
                      elevatorType === option.id ? "border-2 border-blue-500 bg-blue-50 shadow-md" : ""
                    }`}
                    onClick={() => handleElevatorChange(option.id as "big" | "small" | "none")}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-2">
                        {option.icon}
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Time preference section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2 text-blue-500">🕐</span>
            När passar det för en snabb värdering?
          </h3>

          <RadioGroup
            value={timePreference}
            onValueChange={(value) => handleTimePreferenceChange(value as "asap" | "specific")}
            className="space-y-4"
          >
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                timePreference === "asap"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
              onClick={() => handleTimePreferenceChange("asap")}
            >
              <div className="flex items-center">
                <RadioGroupItem id="time-asap" value="asap" className="mr-2" />
                <Label htmlFor="time-asap" className="cursor-pointer font-medium">
                  Så snart som möjligt
                </Label>
              </div>
              {timePreference === "asap" && (
                <p className="text-sm text-gray-600 mt-2 ml-6">
                  Vi kontaktar er inom 2 timmar för att boka in en tid som passar er.
                </p>
              )}
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                timePreference === "specific"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
              onClick={() => handleTimePreferenceChange("specific")}
            >
              <div className="flex items-center">
                <RadioGroupItem id="time-specific" value="specific" className="mr-2" />
                <Label htmlFor="time-specific" className="cursor-pointer font-medium">
                  Välj datum och tid
                </Label>
              </div>

              {timePreference === "specific" && (
                <div className="mt-3 ml-6 space-y-3">
                  <div>
                    <Label htmlFor="valuationDate" className="text-sm font-medium">
                      Datum
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        type="date"
                        id="valuationDate"
                        ref={dateRef}
                        defaultValue={formData.valuationDate || ""}
                        className={`w-full pl-10 ${
                          formSubmitted && timePreference === "specific" && !dateRef.current?.value
                            ? "border-red-500"
                            : ""
                        }`}
                        min={today}
                        required={timePreference === "specific"}
                      />
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                        size={18}
                      />
                    </div>
                    {formSubmitted && timePreference === "specific" && !dateRef.current?.value && (
                      <p className="text-red-500 text-xs mt-1">Vänligen välj ett datum.</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="valuationTime" className="text-sm font-medium">
                      Tid
                    </Label>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {[
                        { id: "08:00", label: "08:00", icon: <Clock className="w-4 h-4" /> },
                        { id: "14:00", label: "14:00", icon: <Clock className="w-4 h-4" /> },
                        { id: "flexible", label: "Valfri tid", icon: <Clock className="w-4 h-4" /> },
                      ].map((option) => (
                        <Card
                          key={option.id}
                          className={`p-3 cursor-pointer hover:border-accent/50 transition-all ${
                            formData.valuationTime === option.id ? "border-2 border-blue-500 bg-blue-50 shadow-md" : ""
                          }`}
                          onClick={() => handleChange("valuationTime", option.id)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 ${
                                formData.valuationTime === option.id
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {option.icon}
                            </div>
                            <span className="text-xs">{option.label}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </RadioGroup>
        </div>

        {/* Comment section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2 text-blue-500">💬</span>
            Kommentar (frivillig)
          </h3>

          <Textarea
            id="valuationComment"
            ref={commentRef}
            defaultValue={formData.valuationComment || ""}
            placeholder='T.ex. "Möblerna är i bra skick", eller "Vi har fler om det känns intressant".'
            className="mt-1"
            rows={4}
          />
        </div>
      </div>

      {/* Form validation error */}
      {formSubmitted && !validateForm() && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Formuläret är ofullständigt</p>
            <p className="text-sm">Vänligen fyll i alla obligatoriska fält markerade med röd kant för att fortsätta.</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-10">
        <button
          type="button"
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm"
        >
          Tillbaka
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          Boka gratis värdering
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </form>
  )
}
