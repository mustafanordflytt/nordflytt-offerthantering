"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WardrobeBoxIcon, PaintingBoxIcon, MirrorBoxIcon } from "./icons"
import { Plus, Minus, ArrowRight, Info, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"

interface RentalBox {
  id: string
  name: string
  price: number
  icon: React.ReactNode
  description: string
}

const rentalBoxes: RentalBox[] = [
  {
    id: "wardrobe",
    name: "Garderobskartonger",
    price: 40,
    icon: <WardrobeBoxIcon />,
    description: "För hängande kläder och kostymer",
  },
  {
    id: "painting",
    name: "Tavelkartonger",
    price: 60,
    icon: <PaintingBoxIcon />,
    description: "Skyddar tavlor och ramar",
  },
  {
    id: "mirror",
    name: "Spegelkartonger",
    price: 75,
    icon: <MirrorBoxIcon />,
    description: "Extra skydd för ömtåliga speglar",
  },
]

interface Step7Props {
  formData: {
    movingBoxes: number
    rentalBoxes: { [key: string]: number }
    startLivingArea: string
    needsMovingBoxes?: boolean
  }
  handleChange: (field: string, value: any) => void
  nextStep: () => void
  prevStep: () => void
}

export default function Step7ExtraServices({ formData, handleChange, nextStep, prevStep }: Step7Props) {
  const [estimatedBoxes, setEstimatedBoxes] = useState(0)
  const [rentalBoxCounts, setRentalBoxCounts] = useState<{ [key: string]: number }>(formData.rentalBoxes || {})
  const [movingBoxCount, setMovingBoxCount] = useState(formData.movingBoxes || 0)
  const [needsMovingBoxes, setNeedsMovingBoxes] = useState(
    formData.needsMovingBoxes !== undefined ? formData.needsMovingBoxes : true,
  )

  useEffect(() => {
    const livingArea = Number.parseInt(formData.startLivingArea) || 0
    const calculatedBoxes = Math.ceil((livingArea * 0.7) / 10) * 10 // Round up to nearest 10
    setEstimatedBoxes(calculatedBoxes)

    // Only set the initial value if movingBoxes is not already set and user needs moving boxes
    if (!formData.movingBoxes && needsMovingBoxes) {
      setMovingBoxCount(calculatedBoxes)
      handleChange("movingBoxes", calculatedBoxes)
    }
  }, [formData.startLivingArea, formData.movingBoxes, handleChange, needsMovingBoxes])

  const updateRentalBoxCount = (boxId: string, count: number) => {
    const newCounts = {
      ...rentalBoxCounts,
      [boxId]: count,
    }
    setRentalBoxCounts(newCounts)
    handleChange("rentalBoxes", newCounts)
  }

  const updateMovingBoxCount = (newCount: number) => {
    const validCount = Math.max(0, newCount)
    setMovingBoxCount(validCount)
    handleChange("movingBoxes", validCount)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    updateMovingBoxCount(value)
  }

  const toggleNeedsMovingBoxes = (checked: boolean) => {
    setNeedsMovingBoxes(!checked)
    handleChange("needsMovingBoxes", !checked)

    // Om användaren väljer bort flyttkartonger, sätt antalet till 0
    if (checked) {
      updateMovingBoxCount(0)

      // Återställ även specialkartonger
      const emptyRentalBoxes = Object.keys(rentalBoxCounts).reduce(
        (acc, key) => {
          acc[key] = 0
          return acc
        },
        {} as { [key: string]: number },
      )

      setRentalBoxCounts(emptyRentalBoxes)
      handleChange("rentalBoxes", emptyRentalBoxes)
    } else {
      // Om användaren väljer att ha flyttkartonger igen, sätt till rekommenderat antal
      updateMovingBoxCount(estimatedBoxes)
    }
  }

  const incrementBoxCount = () => {
    updateMovingBoxCount(movingBoxCount + 1)
  }

  const decrementBoxCount = () => {
    updateMovingBoxCount(Math.max(0, movingBoxCount - 1))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Behöver du flyttmaterial?</h2>

      <div className="space-y-8">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox id="noMovingBoxes" checked={!needsMovingBoxes} onCheckedChange={toggleNeedsMovingBoxes} />
          <Label htmlFor="noMovingBoxes" className="text-base font-medium cursor-pointer">
            Behöver inte flyttkartonger
          </Label>
        </div>

        {needsMovingBoxes ? (
          <>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <Label htmlFor="movingBoxes" className="block mb-3 text-lg font-medium">
                Antal flyttkartonger att hyra (20 SEK/st)
              </Label>

              <div className="flex items-center mb-3">
                <button
                  type="button"
                  onClick={() => updateMovingBoxCount(movingBoxCount - 10)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-3 rounded-l-lg transition-colors"
                  aria-label="Minska med 10"
                >
                  <Minus className="w-4 h-4" />
                  <span className="sr-only">Minska med 10</span>
                </button>

                <button
                  type="button"
                  onClick={decrementBoxCount}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-3 transition-colors"
                  aria-label="Minska med 1"
                >
                  <Minus className="w-3 h-3" />
                  <span className="sr-only">Minska med 1</span>
                </button>

                <Input
                  type="number"
                  id="movingBoxes"
                  value={movingBoxCount}
                  onChange={handleInputChange}
                  className="w-24 text-center border-y border-blue-200 rounded-none py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                  min="0"
                  aria-label="Antal flyttkartonger"
                />

                <button
                  type="button"
                  onClick={incrementBoxCount}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-3 transition-colors"
                  aria-label="Öka med 1"
                >
                  <Plus className="w-3 h-3" />
                  <span className="sr-only">Öka med 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateMovingBoxCount(movingBoxCount + 10)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-3 rounded-r-lg transition-colors"
                  aria-label="Öka med 10"
                >
                  <Plus className="w-4 h-4" />
                  <span className="sr-only">Öka med 10</span>
                </button>
              </div>

              <div className="flex items-center text-sm text-blue-700 bg-blue-100 p-3 rounded-md">
                <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                <p>
                  Rekommenderat antal baserat på din bostadsyta ({formData.startLivingArea} m²):
                  <span className="font-bold ml-1">{estimatedBoxes} st</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                Specialkartonger för en smidigare flytt
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 ml-2 text-blue-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Specialkartonger är designade för att skydda specifika föremål under flytten.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-8">
                {rentalBoxes.map((box) => (
                  <Card
                    key={box.id}
                    className={`p-5 hover:shadow-md transition-all ${
                      (rentalBoxCounts[box.id] || 0) > 0
                        ? "border-2 border-blue-300 bg-blue-50"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center h-full">
                      <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-3">
                        {box.icon}
                      </div>
                      <span className="font-medium mb-1">{box.name}</span>
                      <span className="text-sm text-muted-foreground mb-2">{box.price} SEK/st</span>
                      <p className="text-xs text-gray-600 mb-4">{box.description}</p>

                      <div className="flex items-center space-x-3 mt-auto">
                        <button
                          type="button"
                          onClick={() => updateRentalBoxCount(box.id, Math.max(0, (rentalBoxCounts[box.id] || 0) - 1))}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          aria-label={`Minska antal ${box.name}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{rentalBoxCounts[box.id] || 0}</span>
                        <button
                          type="button"
                          onClick={() => updateRentalBoxCount(box.id, (rentalBoxCounts[box.id] || 0) + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          aria-label={`Öka antal ${box.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <div className="flex items-center justify-center mb-4">
              <X className="w-6 h-6 text-gray-500 mr-2" />
              <span className="text-lg font-medium">Inga flyttkartonger valda</span>
            </div>
            <p className="text-gray-600">
              Du har valt att inte hyra några flyttkartonger. Om du ändrar dig kan du avmarkera rutan ovan.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-10">
        <button type="button" onClick={prevStep} className="back-button">
          Tillbaka
        </button>
        <button
          type="submit"
          onClick={nextStep}
          className="next-button bg-blue-600 hover:bg-blue-800 flex items-center justify-center py-3 px-6 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
        >
          Nästa
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
