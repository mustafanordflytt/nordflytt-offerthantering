"use client"

import { useState } from "react"
import type { FormData } from "@/types/formData"
import { ButtonLoadingSpinner, LoadingSpinner } from "@/components/ui/loading-spinner"

interface Step2Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  nextStep: () => void
  prevStep: () => void
}

export default function Step2MovingInfo({ formData, updateFormData, nextStep, prevStep }: Step2Props) {
  const [moveType, setMoveType] = useState(formData.moveDetails.moveType)
  const [startAddress, setStartAddress] = useState(formData.moveDetails.startAddress)
  const [endAddress, setEndAddress] = useState(formData.moveDetails.endAddress)
  const [moveDate, setMoveDate] = useState(formData.moveDetails.moveDate || "")
  const [moveSize, setMoveSize] = useState(formData.moveDetails.moveSize)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingDistance, setIsLoadingDistance] = useState(false)

  const [startFloor, setStartFloor] = useState(formData.moveDetails.floors.start)
  const [endFloor, setEndFloor] = useState(formData.moveDetails.floors.end)
  const [startElevator, setStartElevator] = useState(formData.moveDetails.elevator.start)
  const [endElevator, setEndElevator] = useState(formData.moveDetails.elevator.end)
  const [startParkingDistance, setStartParkingDistance] = useState(formData.moveDetails.parkingDistance.start)
  const [endParkingDistance, setEndParkingDistance] = useState(formData.moveDetails.parkingDistance.end)
  const [hasBalcony, setHasBalcony] = useState(formData.moveDetails.hasBalcony || false)

  const [errors, setErrors] = useState({
    startAddress: "",
    endAddress: "",
    moveDate: "",
  })

  const validateForm = () => {
    let valid = true
    const newErrors = {
      startAddress: "",
      endAddress: "",
      moveDate: "",
    }

    if (!startAddress.trim()) {
      newErrors.startAddress = "Från-adress är obligatorisk"
      valid = false
    }

    if (!endAddress.trim()) {
      newErrors.endAddress = "Till-adress är obligatorisk"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsProcessing(true)
      try {
        // Simulera distansberäkning om adresser har ändrats
        if (startAddress && endAddress) {
          setIsLoadingDistance(true)
          await new Promise(resolve => setTimeout(resolve, 500))
          setIsLoadingDistance(false)
        }
        
        updateFormData({
        moveDetails: {
          moveType,
          startAddress,
          endAddress,
          moveDate,
          moveSize,
          floors: {
            start: startFloor,
            end: endFloor,
          },
          elevator: {
            start: startElevator,
            end: endElevator,
          },
          parkingDistance: {
            start: startParkingDistance,
            end: endParkingDistance,
          },
          hasBalcony,
        },
      })
        nextStep()
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Flyttinformation</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Typ av flytt</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveType === "local" ? "selected" : ""}`}
              onClick={() => setMoveType("local")}
            >
              <div className="card-icon">🏙️</div>
              <h3>Lokalflytt</h3>
              <p>Inom samma stad</p>
            </button>

            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveType === "distance" ? "selected" : ""}`}
              onClick={() => setMoveType("distance")}
            >
              <div className="card-icon">🚚</div>
              <h3>Distansflytt</h3>
              <p>Mellan städer i Sverige</p>
            </button>

            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveType === "international" ? "selected" : ""}`}
              onClick={() => setMoveType("international")}
            >
              <div className="card-icon">✈️</div>
              <h3>Utlandsflytt</h3>
              <p>Till eller från utlandet</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Från-adress</label>
            <input
              type="text"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              placeholder="Gatuadress, postnummer, ort"
            />
            {errors.startAddress && <p className="text-red-500 text-sm mt-1">{errors.startAddress}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Till-adress</label>
            <input
              type="text"
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              placeholder="Gatuadress, postnummer, ort"
            />
            {errors.endAddress && <p className="text-red-500 text-sm mt-1">{errors.endAddress}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Önskat flyttdatum (valfritt)</label>
          <input
            type="date"
            value={moveDate}
            onChange={(e) => setMoveDate(e.target.value)}
            min={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          />
          {errors.moveDate && <p className="text-red-500 text-sm mt-1">{errors.moveDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Storlek på flytt</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveSize === "small" ? "selected" : ""}`}
              onClick={() => setMoveSize("small")}
            >
              <div className="card-icon">🏠</div>
              <h3>Liten</h3>
              <p>1 rum</p>
            </button>

            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveSize === "medium" ? "selected" : ""}`}
              onClick={() => setMoveSize("medium")}
            >
              <div className="card-icon">🏡</div>
              <h3>Mellan</h3>
              <p>2-3 rum</p>
            </button>

            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveSize === "large" ? "selected" : ""}`}
              onClick={() => setMoveSize("large")}
            >
              <div className="card-icon">🏘️</div>
              <h3>Stor</h3>
              <p>4+ rum</p>
            </button>

            <button
              type="button"
              className={`moving-type-card min-h-[120px] cursor-pointer ${moveSize === "office" ? "selected" : ""}`}
              onClick={() => setMoveSize("office")}
            >
              <div className="card-icon">🏢</div>
              <h3>Kontor</h3>
              <p>Företagsflytt</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Från-adress detaljer</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Våning</label>
              <select
                value={startFloor}
                onChange={(e) => setStartFloor(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              >
                <option value={0}>Bottenvåning</option>
                <option value={1}>1:a våningen</option>
                <option value={2}>2:a våningen</option>
                <option value={3}>3:e våningen</option>
                <option value={4}>4:e våningen</option>
                <option value={5}>5:e våningen eller högre</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="startElevator"
                checked={startElevator}
                onChange={(e) => setStartElevator(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="startElevator" className="ml-2 block text-sm text-gray-700">
                Hiss finns
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avstånd till parkering (meter)</label>
              <input
                type="number"
                value={startParkingDistance}
                onChange={(e) => setStartParkingDistance(Number(e.target.value))}
                min={0}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Till-adress detaljer</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Våning</label>
              <select
                value={endFloor}
                onChange={(e) => setEndFloor(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              >
                <option value={0}>Bottenvåning</option>
                <option value={1}>1:a våningen</option>
                <option value={2}>2:a våningen</option>
                <option value={3}>3:e våningen</option>
                <option value={4}>4:e våningen</option>
                <option value={5}>5:e våningen eller högre</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="endElevator"
                checked={endElevator}
                onChange={(e) => setEndElevator(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="endElevator" className="ml-2 block text-sm text-gray-700">
                Hiss finns
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avstånd till parkering (meter)</label>
              <input
                type="number"
                value={endParkingDistance}
                onChange={(e) => setEndParkingDistance(Number(e.target.value))}
                min={0}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasBalcony"
            checked={hasBalcony}
            onChange={(e) => setHasBalcony(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="hasBalcony" className="ml-2 block text-sm text-gray-700">
            Balkong finns (kräver särskild hantering)
          </label>
        </div>
      </div>

      <div className="step-form-navigation">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[100px]"
          disabled={isProcessing}
        >
          Tillbaka
        </button>
        <button 
          onClick={handleSubmit} 
          className="next-button min-h-[44px] min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          disabled={isProcessing}
        >
          <ButtonLoadingSpinner loading={isProcessing} loadingText="Beräknar...">
            Nästa steg
          </ButtonLoadingSpinner>
        </button>
      </div>
    </div>
  )
}
