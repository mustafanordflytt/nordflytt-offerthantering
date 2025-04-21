"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Truck, Sparkles, Building2, Store, DollarSign, ArrowRight, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Language, TranslationKey } from "../i18n/translations"

interface Service {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  isNew?: boolean
  highlight?: boolean
  selectedColor?: string
}

interface Step3Props {
  formData: {
    serviceTypes: string[]
    serviceType: string
    customerType: string
  }
  handleChange: (field: string, value: string | string[]) => void
  nextStep: () => void
  prevStep: () => void
  language: Language
  t: (key: TranslationKey) => string
}

export default function Step3ServiceType({ formData, handleChange, nextStep, prevStep, language, t }: Step3Props) {
  const [selectedServices, setSelectedServices] = useState<string[]>(formData.serviceTypes || [])
  const [buttonText, setButtonText] = useState<string>(t("nextButton"))

  // Define services based on customer type and language
  const privateServices: Service[] = [
    {
      id: "moving",
      icon: <Truck className="w-6 h-6" />,
      label: t("movingService"),
      description: t("movingServiceDesc"),
      selectedColor: "bg-blue-100 border-blue-500",
    },
    {
      id: "cleaning",
      icon: <Sparkles className="w-6 h-6" />,
      label: t("cleaningService"),
      description: t("cleaningServiceDesc"),
      selectedColor: "bg-purple-100 border-purple-500",
    },
  ]

  const businessServices: Service[] = [
    {
      id: "office_moving",
      icon: <Building2 className="w-6 h-6" />,
      label: t("officeMovingService"),
      description: t("officeMovingServiceDesc"),
      selectedColor: "bg-blue-100 border-blue-500",
    },
    {
      id: "store_moving",
      icon: <Store className="w-6 h-6" />,
      label: t("storeMovingService"),
      description: t("storeMovingServiceDesc"),
      selectedColor: "bg-indigo-100 border-indigo-500",
    },
    {
      id: "sell_furniture",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      label: t("sellFurnitureService"),
      description: t("sellFurnitureServiceDesc"),
      isNew: true,
      highlight: true,
      selectedColor: "bg-green-100 border-green-500",
    },
  ]

  // Välj rätt tjänster baserat på kundtyp
  const services = formData.customerType === "business" ? businessServices : privateServices

  // Uppdatera knapptext baserat på valda tjänster
  useEffect(() => {
    if (formData.customerType === "business") {
      if (selectedServices.length === 0) {
        setButtonText(t("nextButton"))
      } else if (selectedServices.length > 1) {
        setButtonText(t("continueToNextStep"))
      } else if (selectedServices.includes("sell_furniture")) {
        setButtonText(t("continueToValuation"))
      } else if (selectedServices.includes("office_moving") || selectedServices.includes("store_moving")) {
        setButtonText(t("continueToQuoteRequest"))
      } else {
        setButtonText(t("nextButton"))
      }
    } else {
      setButtonText(t("nextButton"))
    }
  }, [selectedServices, formData.customerType, t])

  const toggleService = (serviceId: string) => {
    let updatedServices = [...selectedServices]

    if (selectedServices.includes(serviceId)) {
      updatedServices = updatedServices.filter((id) => id !== serviceId)
    } else {
      updatedServices.push(serviceId)
    }

    setSelectedServices(updatedServices)
    handleChange("serviceTypes", updatedServices)

    // If store_moving is selected, make sure office_moving is deselected and vice versa
    if (
      serviceId === "store_moving" &&
      updatedServices.includes("store_moving") &&
      updatedServices.includes("office_moving")
    ) {
      updatedServices = updatedServices.filter((type) => type !== "office_moving")
      setSelectedServices(updatedServices)
      handleChange("serviceTypes", updatedServices)
    } else if (
      serviceId === "office_moving" &&
      updatedServices.includes("office_moving") &&
      updatedServices.includes("store_moving")
    ) {
      updatedServices = updatedServices.filter((type) => type !== "store_moving")
      setSelectedServices(updatedServices)
      handleChange("serviceTypes", updatedServices)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedServices.length > 0) {
      // Om både tjänster är valda eller endast moving är vald, sätt serviceType till "moving"
      if (
        selectedServices.includes("moving") ||
        selectedServices.includes("office_moving") ||
        selectedServices.includes("store_moving")
      ) {
        handleChange("serviceType", "moving")
      } else if (selectedServices.includes("sell_furniture")) {
        handleChange("serviceType", "sell_furniture")
      } else {
        handleChange("serviceType", "cleaning")
      }
      nextStep()
    } else {
      alert("Vänligen välj minst en tjänst")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">{t("serviceTypeTitle")}</h2>
      <p className="mb-4 text-muted-foreground">{t("serviceTypeDescription")}</p>
      <div className="space-y-4 mb-8">
        {services.map((service) => {
          const isSelected = selectedServices.includes(service.id)
          const selectedClass = isSelected ? service.selectedColor : ""

          return (
            <Card
              key={service.id}
              className={`p-6 cursor-pointer transition-all relative border-2 ${
                isSelected
                  ? formData.customerType === "private"
                    ? "service-card-selected"
                    : selectedClass
                  : service.highlight
                    ? "border-green-300 bg-green-50"
                    : "border-transparent hover:border-accent/50"
              }`}
              onClick={() => toggleService(service.id)}
            >
              {service.isNew && (
                <Badge className="absolute top-0 right-0 transform translate-x-1 -translate-y-1/2 bg-green-600 text-white">
                  {t("newService")}
                </Badge>
              )}
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full ${
                    isSelected
                      ? service.id === "office_moving"
                        ? "bg-blue-200 text-blue-700"
                        : service.id === "store_moving"
                          ? "bg-indigo-200 text-indigo-700"
                          : service.id === "sell_furniture"
                            ? "bg-green-200 text-green-700"
                            : "bg-primary/10 text-primary"
                      : service.highlight
                        ? "bg-green-100 text-green-600"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl ${service.highlight ? "font-bold" : "font-semibold"}`}>{service.label}</h3>
                  <p className={`${service.highlight ? "text-green-800" : "text-muted-foreground"}`}>
                    {service.description}
                  </p>
                </div>
                {isSelected && (
                  <div
                    className={`rounded-full p-1 checkmark-icon ${
                      formData.customerType === "private"
                        ? "bg-green-500 text-white"
                        : service.id === "office_moving"
                          ? "bg-blue-500 text-white"
                          : service.id === "store_moving"
                            ? "bg-indigo-500 text-white"
                            : service.id === "sell_furniture"
                              ? "bg-green-500 text-white"
                              : "bg-green-500 text-white"
                    }`}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="back-button text-gray-600 hover:text-gray-800">
          {t("backButton")}
        </button>
        <button
          type="submit"
          className="next-button bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          disabled={selectedServices.length === 0}
        >
          {buttonText}
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </form>
  )
}
