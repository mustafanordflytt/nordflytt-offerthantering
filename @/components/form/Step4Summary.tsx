"use client"

import type { FormData } from "@/types/formData"

interface Step4Props {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  prevStep: () => void
  handleSubmit: () => void
}

export default function Step4Summary({ formData, updateFormData, prevStep, handleSubmit }: Step4Props) {
  const { customerType, customerInfo, moveDetails, services, additionalServices, totalPrice } = formData

  const selectedAdditionalServices = additionalServices.filter((service) => service.selected)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Sammanfattning</h2>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Kunduppgifter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Kundtyp</p>
              <p className="font-medium">{customerType === "private" ? "Privatperson" : "Företag"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Namn</p>
              <p className="font-medium">{customerInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">E-post</p>
              <p className="font-medium">{customerInfo.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="font-medium">{customerInfo.phone}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Flyttinformation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Typ av flytt</p>
              <p className="font-medium">
                {moveDetails.moveType === "local"
                  ? "Lokalflytt"
                  : moveDetails.moveType === "distance"
                    ? "Distansflytt"
                    : "Utlandsflytt"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Storlek</p>
              <p className="font-medium">
                {moveDetails.moveSize === "small"
                  ? "Liten bostad"
                  : moveDetails.moveSize === "medium"
                    ? "Mellanstor bostad"
                    : moveDetails.moveSize === "large"
                      ? "Stor bostad"
                      : "Kontor"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Från-adress</p>
              <p className="font-medium">{moveDetails.startAddress}</p>
              <p className="text-xs text-gray-500">
                Våning: {moveDetails.floors.start === 0 ? "Bottenvåning" : `${moveDetails.floors.start}:a våningen`}
                {moveDetails.elevator.start ? ", Hiss finns" : ", Ingen hiss"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Till-adress</p>
              <p className="font-medium">{moveDetails.endAddress}</p>
              <p className="text-xs text-gray-500">
                Våning: {moveDetails.floors.end === 0 ? "Bottenvåning" : `${moveDetails.floors.end}:a våningen`}
                {moveDetails.elevator.end ? ", Hiss finns" : ", Ingen hiss"}
              </p>
            </div>
            {moveDetails.moveDate && (
              <div>
                <p className="text-sm text-gray-500">Önskat flyttdatum</p>
                <p className="font-medium">{new Date(moveDetails.moveDate).toLocaleDateString("sv-SE")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Tjänster</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Flyttjänst</p>
                <p className="text-sm text-gray-500">
                  {moveDetails.moveType === "local"
                    ? "Lokalflytt"
                    : moveDetails.moveType === "distance"
                      ? "Distansflytt"
                      : "Utlandsflytt"}
                  {" - "}
                  {moveDetails.moveSize === "small"
                    ? "Liten bostad"
                    : moveDetails.moveSize === "medium"
                      ? "Mellanstor bostad"
                      : moveDetails.moveSize === "large"
                        ? "Stor bostad"
                        : "Kontor"}
                </p>
              </div>
              <p className="font-medium">
                {totalPrice - selectedAdditionalServices.reduce((sum, service) => sum + service.price, 0)} kr
              </p>
            </div>

            {selectedAdditionalServices.map((service) => (
              <div key={service.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                </div>
                <p className="font-medium">{service.price} kr</p>
              </div>
            ))}

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <p className="font-medium">Totalt</p>
                <p className="text-xl font-bold">{totalPrice} kr</p>
              </div>
              <p className="text-sm text-gray-500">Inkl. moms och försäkring</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Vad händer nu?</h3>
          <p className="text-blue-700">
            När du skickar in din offertförfrågan kommer vi att gå igenom dina uppgifter och återkomma med en bekräftad
            offert inom 24 timmar. Du kan sedan välja att acceptera offerten eller kontakta oss för justeringar.
          </p>
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
          Skicka offertförfrågan
        </button>
      </div>
    </div>
  )
}
