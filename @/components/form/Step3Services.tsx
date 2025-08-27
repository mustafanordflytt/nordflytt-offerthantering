"use client"

import { useState, useEffect } from "react"
import type { FormData, AdditionalService } from "@/types/formData"

interface Step3Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function Step3Services({ formData, updateFormData, nextStep, prevStep }: Step3Props) {
  const [services, setServices] = useState<string[]>(formData.services)
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>(
    formData.additionalServices.length > 0
      ? formData.additionalServices
      : [
          { id: "packing", name: "Packning", price: 1500, selected: false },
          { id: "unpacking", name: "Uppackning", price: 1500, selected: false },
          { id: "cleaning", name: "Städning", price: 2000, selected: false },
          { id: "storage", name: "Magasinering", price: 1000, selected: false },
          { id: "piano", name: "Pianoflytt", price: 2500, selected: false },
          { id: "assembly", name: "Möbelmontering", price: 1200, selected: false },
        ],
  )

  const [basePrice, setBasePrice] = useState(calculateBasePrice())
  const [totalPrice, setTotalPrice] = useState(calculateTotalPrice())

  function calculateBasePrice() {
    const { moveType, moveSize } = formData.moveDetails

    // Basera priset på flytttyp och storlek
    let price = 0

    if (moveType === "local") {
      if (moveSize === "small") price = 3500
      else if (moveSize === "medium") price = 5500
      else if (moveSize === "large") price = 8500
      else if (moveSize === "office") price = 12000
    } else if (moveType === "distance") {
      if (moveSize === "small") price = 6500
      else if (moveSize === "medium") price = 9500
      else if (moveSize === "large") price = 14500
      else if (moveSize === "office") price = 20000
    } else if (moveType === "international") {
      if (moveSize === "small") price = 12000
      else if (moveSize === "medium") price = 18000
      else if (moveSize === "large") price = 25000
      else if (moveSize === "office") price = 35000
    }

    // Justera för våning och hiss
    const { floors, elevator } = formData.moveDetails

    if (floors.start > 0 && !elevator.start) {
      price += floors.start * 500
    }

    if (floors.end > 0 && !elevator.end) {
      price += floors.end * 500
    }

    return price
  }

  function calculateTotalPrice() {
    let total = basePrice

    // Lägg till pris för tilläggstjänster
    additionalServices.forEach((service) => {
      if (service.selected) {
        total += service.price
      }
    })

    return total
  }

  useEffect(() => {
    const newBasePrice = calculateBasePrice()
    setBasePrice(newBasePrice)

    const newTotalPrice = calculateTotalPrice()
    setTotalPrice(newTotalPrice)
  }, [additionalServices])

  const toggleService = (serviceId: string) => {
    setAdditionalServices((prev) =>
      prev.map((service) => (service.id === serviceId ? { ...service, selected: !service.selected } : service)),
    )
  }

  const handleSubmit = () => {
    updateFormData({
      services,
      additionalServices,
      totalPrice,
    })
    nextStep()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Tjänster och tillägg</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Grundtjänst</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">🚚</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-md font-medium">Flyttjänst</h4>
                <p className="text-sm text-gray-500">
                  {formData.moveDetails.moveType === "local"
                    ? "Lokalflytt"
                    : formData.moveDetails.moveType === "distance"
                      ? "Distansflytt"
                      : "Utlandsflytt"}
                  {" - "}
                  {formData.moveDetails.moveSize === "small"
                    ? "Liten bostad"
                    : formData.moveDetails.moveSize === "medium"
                      ? "Mellanstor bostad"
                      : formData.moveDetails.moveSize === "large"
                        ? "Stor bostad"
                        : "Kontor"}
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-lg font-semibold">{basePrice} kr</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Tilläggstjänster</h3>
          <div className="space-y-3">
            {additionalServices.map((service) => (
              <div
                key={service.id}
                className={`border rounded-md p-4 cursor-pointer transition-colors ${
                  service.selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleService(service.id)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={service.selected}
                    onChange={() => toggleService(service.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-grow">
                    <h4 className="text-md font-medium">{service.name}</h4>
                    <p className="text-sm text-gray-500">
                      {service.id === "packing" && "Vi packar dina tillhörigheter säkert och effektivt"}
                      {service.id === "unpacking" && "Vi packar upp dina tillhörigheter i ditt nya hem"}
                      {service.id === "cleaning" && "Professionell städning av din gamla bostad"}
                      {service.id === "storage" && "Säker förvaring av dina tillhörigheter"}
                      {service.id === "piano" && "Specialhantering för säker flytt av piano"}
                      {service.id === "assembly" && "Montering av möbler i ditt nya hem"}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-lg font-semibold">{service.price} kr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Totalt pris</h3>
            <span className="text-xl font-bold">{totalPrice} kr</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Inkl. moms och försäkring</p>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Tillbaka
        </button>
        <button onClick={handleSubmit} className="next-button">
          Nästa steg
        </button>
      </div>
    </div>
  )
}
