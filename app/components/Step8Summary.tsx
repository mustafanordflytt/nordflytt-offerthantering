"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import {
  CreditCard,
  Banknote,
  Wallet,
  ArrowRight,
  Package,
  Sparkles,
  Truck,
  PencilLine,
  Wrench,
  Server,
  Recycle,
  X,
  Edit,
  Home,
  Box,
  Tag,
  FileSpreadsheet,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { translations, type Language } from "../i18n/translations"

interface Step8Props {
  formData: {
    customerType: string
    name: string
    email: string
    phone: string
    serviceTypes: string[]
    moveDate: string
    moveTime: string
    flexibleMoveDate?: boolean
    startAddress: string
    startFloor: string
    startElevator: "big" | "small" | "none"
    endAddress: string
    endFloor: string
    endElevator: "big" | "small" | "none"
    parkingDistance: string
    startParkingDistance: string
    endParkingDistance: string
    startLivingArea: string
    endLivingArea: string
    startPropertyType: "apartment" | "house"
    endPropertyType: "apartment" | "house"
    startDoorCode: string
    endDoorCode: string
    selectedItems: { [key: string]: number }
    packingService: string
    cleaningService: string
    movingBoxes: number
    rentalBoxes: { [key: string]: number }
    needsMovingBoxes?: boolean
    paymentMethod: string
    calculatedDistance: string
    companyName?: string
    orgNumber?: string
    contactPerson?: string
    role?: string
    contactPreference?: string[]
    additionalBusinessServices?: string[]
    // Office moving specific fields
    officeFromAddress?: string
    officeToAddress?: string
    officeType?: string
    storeType?: string
    workstations?: string
    additionalSpaces?: string[]
    officeMoveDate?: string
    approximateDestination?: boolean
    officeSizeSquareMeters?: string
    officeElevator?: "big" | "small" | "none"
    hasLoadingZone?: boolean
    officeInventory?: { [key: string]: number }
    needsLabeling?: boolean
    labelingType?: string[]
    specialHandling?: string[]
    estimatedVolume?: number
    manualVolume?: string
    needsITSetup?: boolean
  }
  handleChange: (field: string, value: string) => void
  nextStep: () => void
  prevStep: () => void
  goToStep?: (step: number) => void
}

export default function Step8Summary({ formData, handleChange, nextStep, prevStep, goToStep }: Step8Props) {
  // Add this at the beginning of the component, after the imports
  useEffect(() => {
    // Add a subtle pulse animation for the selected payment method
    const style = document.createElement("style")
    style.innerHTML = `
  @keyframes payment-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.2);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }
  
  .payment-selected {
    animation: payment-pulse 2.5s infinite;
  }

  .northmill-logo {
    filter: invert(1) sepia(1) saturate(5) hue-rotate(240deg);
  }

  .northmill-logo-black {
    filter: invert(1);
  }
`
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Improve the InfoItem component to better handle undefined values and provide fallback text
  const InfoItem = ({
    label,
    value,
    fallback = "Ej angivet",
  }: {
    label: string
    value: string | number | undefined | boolean
    fallback?: string
  }) => {
    // Convert boolean values to Yes/No text
    if (typeof value === "boolean") {
      return (
        <div className="mb-4">
          <span className="font-semibold">{label}:</span> {value ? "Ja" : "Nej"}
        </div>
      )
    }

    // Handle undefined, null, or empty string values
    if (value === undefined || value === null || value === "") {
      return (
        <div className="mb-4">
          <span className="font-semibold">{label}:</span> <span className="text-gray-500">{fallback}</span>
        </div>
      )
    }

    // Return normal value
    return (
      <div className="mb-4">
        <span className="font-semibold">{label}:</span> <span>{value}</span>
      </div>
    )
  }

  // Update the useEffect to log more detailed information about the received data
  useEffect(() => {
    console.log("Step8Summary - Received formData:", formData)
    console.log("Office moving specific data:", {
      officeFromAddress: formData.officeFromAddress || "Missing",
      officeToAddress: formData.officeToAddress || "Missing",
      officeType: formData.officeType || "Missing",
      workstations: formData.workstations || "Missing",
      officeSizeSquareMeters: formData.officeSizeSquareMeters || "Missing",
      officeElevator: formData.officeElevator || "Missing",
      hasLoadingZone: formData.hasLoadingZone !== undefined ? String(formData.hasLoadingZone) : "Missing",
      officeMoveDate: formData.officeMoveDate || "Missing",
      additionalSpaces: formData.additionalSpaces ? JSON.stringify(formData.additionalSpaces) : "Missing",
    })
  }, [formData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  const paymentMethods = [
    {
      id: "swish",
      name: "Swish",
      icon: <Wallet className="w-6 h-6" />,
      description: "Betala direkt",
    },
    {
      id: "invoice",
      name: "Faktura",
      icon: <CreditCard className="w-6 h-6" />,
      description: "30 dagar",
    },
    {
      id: "installment",
      name: "Delbetalning",
      icon: <Banknote className="w-6 h-6" />,
      description: "Upp till 60 månader",
    },
  ]

  // Function to get the appropriate icon for a service
  const getServiceIcon = (service: string) => {
    if (service === "moving") return <Truck className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
    if (service === "cleaning") return <Sparkles className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
    return <Package className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
  }

  // Function to navigate to specific steps
  const handleEditSection = (step: number) => {
    if (goToStep) {
      goToStep(step)
    } else {
      // Fallback if goToStep is not provided
      prevStep()
    }
  }

  // Lägg till en funktion för att beräkna totalpriset för flyttmaterial
  const calculateMovingMaterialsTotal = () => {
    let total = formData.movingBoxes * 20 // 20 SEK per flyttkartong

    // Lägg till pris för specialkartonger
    if (formData.rentalBoxes) {
      Object.entries(formData.rentalBoxes).forEach(([boxId, count]) => {
        if (count > 0) {
          const price = boxId === "wardrobe" ? 40 : boxId === "painting" ? 60 : 75
          total += count * price
        }
      })
    }

    return total
  }

  // Kontrollera om användaren har valt bort flyttkartonger
  const needsMovingBoxes = formData.needsMovingBoxes !== false

  // Använda översättningar direkt utan useTranslation
  const language = "sv" as Language

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-gray-800">Låt oss sammanfatta</h2>

      <Card className="p-6 mb-12 relative shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Valda tjänster</h3>
          <button
            type="button"
            onClick={() => handleEditSection(3)}
            className="text-blue-700 hover:text-blue-900 flex items-center text-base font-medium border border-blue-200 rounded-md px-4 py-2.5 hover:bg-blue-50 transition-colors shadow-sm hover:shadow-md"
            aria-label="Redigera valda tjänster"
          >
            <PencilLine className="w-4 h-4 mr-2" />
            Redigera
          </button>
        </div>

        <div className="space-y-6">
          {formData.customerType === "business" ? (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Företagsflytt</h4>
              <ul className="space-y-3 pl-2">
                {formData.serviceTypes.map((service) => (
                  <li key={service} className="text-gray-600 flex items-center">
                    {getServiceIcon(service)}
                    <span>
                      {service === "office_moving"
                        ? "Kontorsflytt"
                        : service === "store_moving"
                          ? "Butiksflytt"
                          : service === "moving"
                            ? "Flytthjälp"
                            : service === "cleaning"
                              ? "Flyttstädning"
                              : "Packhjälp"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Flyttjänster</h4>
              <ul className="space-y-3 pl-2">
                {formData.serviceTypes.map((service) => (
                  <li key={service} className="text-gray-600 flex items-center">
                    {getServiceIcon(service)}
                    <span>
                      {service === "moving" ? "Flytthjälp" : service === "cleaning" ? "Flyttstädning" : "Packhjälp"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {formData.packingService && formData.packingService !== "Ingen packning" && (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Packningstjänst</h4>
              <ul className="space-y-3 pl-2">
                <li className="text-gray-600 flex items-center">
                  <Package className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                  {formData.packingService}
                </li>
              </ul>
            </div>
          )}

          {formData.cleaningService && formData.cleaningService !== "Ingen städning" && (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Städningstjänst</h4>
              <ul className="space-y-3 pl-2">
                <li className="text-gray-600 flex items-center">
                  <Sparkles className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                  {formData.cleaningService === "Flyttstädning"
                    ? "Flyttstädning"
                    : formData.cleaningService === "Djuprengöring"
                      ? "Djuprengöring"
                      : formData.cleaningService === "Avflyttningsstädning"
                        ? "Avflyttningsstädning"
                        : formData.cleaningService}
                </li>
              </ul>
            </div>
          )}

          {formData.additionalBusinessServices && formData.additionalBusinessServices.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Ytterligare tjänster</h4>
              <ul className="space-y-3 pl-2">
                {formData.additionalBusinessServices.map((service) => (
                  <li key={service} className="text-gray-600 flex items-center">
                    {service === "Demontering & montering" ? (
                      <Wrench className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                    ) : service === "Nätverksinstallation & IT-drift" ? (
                      <Server className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                    ) : service === "Avfallshantering & återvinning" ? (
                      <Recycle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                    ) : (
                      <Package className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                    )}
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flyttmaterial-sektion */}
          <div>
            <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Flyttmaterial</h4>

            {needsMovingBoxes ? (
              <ul className="space-y-3 pl-2">
                <li className="text-gray-600 flex items-center">
                  <Package className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                  {formData.movingBoxes} flyttkartonger ({formData.movingBoxes * 20} SEK)
                </li>
                {Object.entries(formData.rentalBoxes || {}).map(
                  ([boxId, count]) =>
                    count > 0 && (
                      <li key={boxId} className="text-gray-600 flex items-center">
                        <Package className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                        {count} st{" "}
                        {boxId === "wardrobe"
                          ? "garderobskartonger"
                          : boxId === "painting"
                            ? "tavelkartonger"
                            : "spegelkartonger"}
                      </li>
                    ),
                )}

                {/* Visa totalpris för flyttmaterial */}
                {formData.movingBoxes > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-medium">Totalt flyttmaterial:</span>
                      <span className="font-bold">{calculateMovingMaterialsTotal()} SEK</span>
                    </div>
                  </div>
                )}
              </ul>
            ) : (
              <div className="flex items-center text-gray-600 pl-2">
                <X className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                <span>Behöver inte flyttkartonger</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-12 relative shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Flyttinformation</h3>
          <button
            type="button"
            onClick={() => handleEditSection(4)}
            className="text-blue-700 hover:text-blue-900 flex items-center text-base font-medium border border-blue-200 rounded-md px-4 py-2.5 hover:bg-blue-50 transition-colors shadow-sm hover:shadow-md"
            aria-label="Redigera flyttinformation"
          >
            <PencilLine className="w-4 h-4 mr-2" />
            Redigera
          </button>
        </div>

        <div className="space-y-8">
          {/* Inside the render function, update the date section: */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">1. Datum och tid</h4>
            <InfoItem
              label="Datum"
              value={
                formData.flexibleMoveDate
                  ? "Flexibelt datum"
                  : formData.customerType === "business" 
                    ? formData.officeMoveDate || formData.moveDate 
                    : formData.moveDate
              }
              fallback="Vänligen välj ett datum"
            />
            <InfoItem label="Tid" value={formData.moveTime || "Flexibel"} />
          </div>

          <Separator className="my-2 opacity-30" />

          {formData.customerType === "business" ? (
            <>
              {/* Update the office information section: */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">
                  {formData.storeType ? "2. Butiksinformation" : "2. Kontorsinformation"}
                </h4>
                <InfoItem label="Från adress" value={formData.officeFromAddress} fallback="Vänligen ange från-adress" />
                <InfoItem
                  label="Till adress"
                  value={
                    formData.officeToAddress || (formData.approximateDestination ? "Ungefärlig destination" : undefined)
                  }
                  fallback="Vänligen ange till-adress"
                />

                {formData.storeType ? (
                  <InfoItem
                    label="Butikstyp"
                    value={
                      formData.storeType === "small"
                        ? "Liten butik"
                        : formData.storeType === "medium"
                          ? "Mellanstor butik"
                          : formData.storeType === "large"
                            ? "Stor butik"
                            : formData.storeType === "popup"
                              ? "Pop-up butik / Tillfällig butik"
                              : formData.storeType
                    }
                    fallback="Vänligen välj en butikstyp"
                  />
                ) : (
                  <InfoItem
                    label="Kontorstyp"
                    value={
                      formData.officeType === "small"
                        ? "Litet kontor"
                        : formData.officeType === "medium"
                          ? "Mellanstort kontor"
                          : formData.officeType === "large"
                            ? "Stort kontor"
                            : formData.officeType === "coworking"
                              ? "Coworking space"
                              : formData.officeType
                    }
                    fallback="Vänligen välj kontorstyp"
                  />
                )}

                {!formData.storeType && (
                  <InfoItem
                    label="Antal arbetsplatser"
                    value={formData.workstations}
                    fallback="Vänligen ange antal arbetsplatser"
                  />
                )}

                <InfoItem
                  label={formData.storeType ? "Butiksstorlek" : "Kontorsstorlek"}
                  value={formData.officeSizeSquareMeters ? `${formData.officeSizeSquareMeters} kvm` : undefined}
                  fallback={formData.storeType ? "Vänligen ange butiksstorlek" : "Vänligen ange kontorsstorlek"}
                />
                <InfoItem
                  label="Hiss"
                  value={
                    formData.officeElevator === "big"
                      ? "Stor hiss"
                      : formData.officeElevator === "small"
                        ? "Liten hiss"
                        : formData.officeElevator === "none"
                          ? "Ingen hiss"
                          : undefined
                  }
                  fallback="Vänligen ange hisstyp"
                />
                <InfoItem
                  label="Lastzon"
                  value={formData.hasLoadingZone !== undefined ? formData.hasLoadingZone : undefined}
                  fallback="Vänligen ange om lastzon finns"
                />
                {formData.additionalSpaces && formData.additionalSpaces.length > 0 ? (
                  <div className="mb-4">
                    <span className="font-semibold">Ytterligare utrymmen:</span>
                    <ul className="list-disc pl-5 mt-1">
                      {formData.additionalSpaces.map((space, index) => (
                        <li key={index}>
                          {space === "conference"
                            ? "Konferensrum"
                            : space === "kitchen"
                              ? "Kök/Pentry"
                              : space === "storage"
                                ? "Lager/Förråd"
                                : space === "reception"
                                  ? "Reception"
                                  : space === "server"
                                    ? "Serverrum"
                                    : space === "other"
                                      ? "Annat"
                                      : space}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="font-semibold">Ytterligare utrymmen:</span>{" "}
                    <span className="text-gray-500">Inga ytterligare utrymmen valda</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">2. Flyttar från</h4>
                <InfoItem label="Adress" value={formData.startAddress} />
                <InfoItem
                  label="Bostadstyp"
                  value={formData.startPropertyType === "apartment" ? "Lägenhet" : "Villa/Radhus"}
                />
                <InfoItem label="Boarea" value={`${formData.startLivingArea} kvm`} />
                {formData.startPropertyType === "apartment" && (
                  <>
                    <InfoItem label="Våning" value={formData.startFloor} />
                    <InfoItem
                      label="Hiss"
                      value={
                        formData.startElevator === "big"
                          ? "Stor hiss"
                          : formData.startElevator === "small"
                            ? "Liten hiss"
                            : "Ingen hiss"
                      }
                    />
                    <InfoItem label="Portkod" value={formData.startDoorCode} fallback="Ej angiven" />
                  </>
                )}
                <InfoItem 
                  label="Avstånd till parkering" 
                  value={
                    formData.startParkingDistance 
                      ? `${formData.startParkingDistance} meter` 
                      : formData.parkingDistance 
                        ? `${formData.parkingDistance} meter`
                        : undefined
                  } 
                />
              </div>

              <Separator className="my-2 opacity-30" />

              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">3. Flyttar till</h4>
                <InfoItem label="Adress" value={formData.endAddress} />
                <InfoItem
                  label="Bostadstyp"
                  value={formData.endPropertyType === "apartment" ? "Lägenhet" : "Villa/Radhus"}
                />
                <InfoItem label="Boarea" value={`${formData.endLivingArea} kvm`} />
                {formData.endPropertyType === "apartment" && (
                  <>
                    <InfoItem label="Våning" value={formData.endFloor} />
                    <InfoItem
                      label="Hiss"
                      value={
                        formData.endElevator === "big"
                          ? "Stor hiss"
                          : formData.endElevator === "small"
                            ? "Liten hiss"
                            : "Ingen hiss"
                      }
                    />
                    <InfoItem label="Portkod" value={formData.endDoorCode} fallback="Ej angiven" />
                  </>
                )}
                <InfoItem 
                  label="Avstånd till parkering" 
                  value={
                    formData.endParkingDistance 
                      ? `${formData.endParkingDistance} meter` 
                      : formData.parkingDistance 
                        ? `${formData.parkingDistance} meter`
                        : undefined
                  } 
                />
              </div>
            </>
          )}

          <Separator className="my-2 opacity-30" />

          {/* Kommenterat bort "Beräknat avstånd" sektion tillfälligt 
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900">
                Beräknat avstånd
              </h3>
              <div className="mt-1 flex items-center">
                {formData.calculatedDistance ? (
                  <p className="text-sm text-gray-500">
                    {(parseInt(formData.calculatedDistance) / 1000).toFixed(1)} km
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-amber-600">
                      Avståndet har inte beräknats. Vänligen gå tillbaka till steg 4 för att beräkna avståndet.
                    </p>
                    <button
                      type="button"
                      onClick={() => goToStep && goToStep(4)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Gå till steg 4
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          */}
        </div>
      </Card>
      {formData.customerType === "business" && (
        <>
          <Separator className="my-2 opacity-30" />

          <div className="bg-gray-50 p-5 rounded-lg">
            <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Företagsinformation</h4>
            <InfoItem label="Företagsnamn" value={formData.companyName || ""} />
            <InfoItem label="Organisationsnummer" value={formData.orgNumber || ""} />
            {formData.contactPerson && <InfoItem label="Kontaktperson" value={formData.contactPerson} />}
            {formData.role && <InfoItem label="Roll" value={formData.role} />}
            {formData.contactPreference && formData.contactPreference.length > 0 && (
              <div>
                <span className="font-semibold">Föredragen kontaktmetod:</span>{" "}
                {formData.contactPreference.map((method, index) => (
                  <span key={method}>
                    {method === "email" ? "E-post" : method === "phone" ? "Telefon" : "SMS"}
                    {index < (formData.contactPreference?.length || 0) - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {formData.customerType !== "business" && (
        <>
          <div className="mt-12 mb-8">
            <Separator className="mb-8" />
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Önskat betalsätt</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
            {paymentMethods.map((method) => {
              const isSelected = formData.paymentMethod === method.id
              return (
                <Card
                  key={method.id}
                  className={`relative p-5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-2 border-green-500 payment-selected"
                      : "border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  } group`}
                  onClick={() => handleChange("paymentMethod", method.id)}
                  style={{
                    boxShadow: isSelected ? "0 6px 12px rgba(0, 0, 0, 0.1)" : "0 2px 4px rgba(0, 0, 0, 0.05)",
                    transform: isSelected ? "translateY(-2px)" : "none",
                    transition: "all 0.3s ease",
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(240, 249, 240, 1) 0%, rgba(220, 252, 231, 0.7) 100%)"
                      : "",
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-14 h-14 flex items-center justify-center rounded-full mb-3 ${
                        isSelected ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {method.icon}
                    </div>
                    <span className={`font-medium text-2xl ${isSelected ? "text-[#8A2BE2]" : ""}`}>{method.name}</span>
                    {/* Update description text for payment methods */}
                    <span className={`text-sm mt-1 ${isSelected ? "text-green-600" : "text-muted-foreground"}`}>
                      {method.description}
                    </span>
                    {/* Remove Northmill logo from payment methods */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 mt-2 mr-2 bg-green-500 text-white rounded-full p-1 z-10 shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {formData.customerType === "business" && (
        <>
          <div className="mt-12 mb-8">
            <Separator className="mb-8" />
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Betalningsinformation</h3>
          </div>

          {/* Enhance the payment information section for business customers */}
          <div className="bg-gray-50 p-5 rounded-lg mb-10">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold">Betalningsmetod:</span> Faktura (
              <span className="font-bold">30 dagars betalningsvillkor</span>)
            </div>
            <p className="text-sm text-gray-600">
              För företagskunder skickas alltid en faktura med{" "}
              <span className="font-bold">30 dagars betalningsvillkor</span>. Fakturan skickas till den e-postadress som
              angivits i formuläret.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800 font-bold flex items-center">
                <span className="text-blue-600 mr-2 text-xl">🔹</span> Viktig information
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-2 list-disc pl-6">
                <li>
                  <strong>Faktura skickas endast efter godkänd offert</strong>, aldrig innan.
                </li>
                <li>
                  <strong>En offert är aldrig bindande</strong> utan ditt uttryckliga godkännande.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between mt-10">
        <button type="button" onClick={prevStep} className="back-button">
          Tillbaka
        </button>
        <button
          type="submit"
          className="next-button bg-[#E91E63] hover:bg-[#C2185B] flex items-center justify-center py-3.5 px-7 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg text-lg relative overflow-hidden group"
          style={{ boxShadow: "0 4px 10px rgba(233, 30, 99, 0.3)" }}
        >
          <span className="relative z-10">Få din snabb offert</span>
          <ArrowRight className="ml-2 w-5 h-5 relative z-10" />
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-hover:animate-pulse transition-opacity"></span>
        </button>
      </div>
    </form>
  )
}
