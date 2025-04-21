"use client"

import { Building2, Users, CheckCircle, Star, Shield } from "lucide-react"
import { useRef } from "react"
import type { Language, TranslationKey } from "../i18n/translations"

interface Step1Props {
  formData: {
    customerType: string
  }
  handleChange: (field: string, value: string) => void
  nextStep: () => void
  language: Language
  t: (key: TranslationKey) => string
}

export default function Step1CustomerType({ formData, handleChange, nextStep, language, t }: Step1Props) {
  const privateButtonRef = useRef<HTMLButtonElement>(null)

  const handleSelect = (type: string) => {
    handleChange("customerType", type)
    nextStep()
  }

  const scrollToPrivateButton = () => {
    privateButtonRef.current?.scrollIntoView({ behavior: "smooth" })
    setTimeout(() => {
      handleSelect("private")
    }, 500)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-3">{t("offerRequest")}</h1>

      {/* Ny text under rubriken */}
      <p style={{ fontSize: "14px", color: "#555", marginBottom: "16px" }}>
        🕊️ Inget är bindande. Du får ett förslag – du väljer sen.
      </p>

      {/* Horizontal USPs as supporting information */}
      <div className="mb-5 flex flex-wrap justify-center gap-3 text-sm">
        <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 text-amber-500 mr-1.5" />
          <span className="font-medium">{t("customerRating")}</span>
        </div>
        <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full">
          <Users className="w-4 h-4 text-amber-500 mr-1.5" />
          <span className="font-medium">{t("satisfiedCustomers")}</span>
        </div>
        <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full">
          <Shield className="w-4 h-4 text-amber-500 mr-1.5" />
          <span className="font-medium">{t("insuredService")}</span>
        </div>
      </div>

      {/* Enhanced main text with urgency */}
      <p className="mb-5 text-muted-foreground">{t("quickQuote")}</p>

      <div className="grid gap-5">
        <div
          className={`relative overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg ${
            formData.customerType === "private"
              ? "border-secondary bg-secondary/5"
              : "border-[#DADADA] hover:border-accent/50"
          }`}
          onClick={() => handleSelect("private")}
          style={{ transition: "all 0.2s ease-in-out" }}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{t("privateCustomer")}</h3>
                <p className="text-muted-foreground mb-2">{t("privateDescription")}</p>

                <ul className="grid gap-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("privateServices")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-blue-600 font-semibold">{t("quickQuotePrivate")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("transparentPrice")}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Added boost text before CTA button */}
            <p className="text-center text-sm font-medium mb-3 text-blue-700">{t("privateBoost")}</p>

            <button
              ref={privateButtonRef}
              className="w-full mt-3 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-4 px-4 rounded-lg text-lg mb-6 sm:mb-0 hover:scale-[1.02] transition-all duration-200"
              style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)" }}
            >
              {t("getQuoteNow")}
            </button>
            <p className="text-center text-sm mt-2 text-muted-foreground">{t("quoteEmailSms")}</p>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg ${
            formData.customerType === "business"
              ? "border-secondary bg-secondary/5"
              : "border-[#DADADA] hover:border-accent/50"
          }`}
          onClick={() => handleSelect("business")}
          style={{ transition: "all 0.2s ease-in-out" }}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{t("businessCustomer")}</h3>
                <p className="text-muted-foreground mb-2">{t("businessDescription")}</p>

                <ul className="grid gap-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("businessServices")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("customizedQuote")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{t("invoiceFlexible")}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Enhanced business boost text */}
            <div className="text-center text-sm font-medium mb-3 text-green-800">
              <p>{t("businessBoost")}</p>
              <p className="mt-1">{t("businessBoostSub")}</p>
            </div>

            <button
              className="w-full mt-3 bg-green-800 hover:bg-green-900 text-white font-medium py-3 px-4 rounded-lg hover:scale-[1.02] transition-all duration-200"
              style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)" }}
            >
              {t("bookFreeConsultation")}
            </button>
            <p className="text-center text-sm mt-2 text-muted-foreground">{t("freeConsultationDesc")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
