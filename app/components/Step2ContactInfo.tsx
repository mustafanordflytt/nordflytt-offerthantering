"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Building2, PhoneIcon, Mail, MessageSquare } from "lucide-react"
import CountryCodeSelect from "./CountryCodeSelect"
import LanguageSelector from "./LanguageSelector"
import { translations, type Language, type TranslationKey } from "../i18n/translations"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

// Uppdatera Step2Props för att inkludera customerType
interface Step2Props {
  formData: {
    name: string
    phone: string
    email: string
    customerType: string
    companyName?: string
    orgNumber?: string
    contactPerson?: string
    role?: string
    contactPreference?: string[]
  }
  handleChange: (field: string, value: string | string[]) => void
  nextStep: () => void
  prevStep: () => void
}

export default function Step2ContactInfo({ formData, handleChange, nextStep, prevStep }: Step2Props) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+46")
  const [isFormComplete, setIsFormComplete] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [orgNumberError, setOrgNumberError] = useState("")
  const [activeField, setActiveField] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>("sv")
  const [contactPreferences, setContactPreferences] = useState<string[]>(formData.contactPreference || ["email"])

  const isBusinessCustomer = formData.customerType === "business"

  // Get translation function
  const t = (key: TranslationKey) => translations[language][key]

  // Load saved language preference or detect browser language
  useEffect(() => {
    try {
      // First try to get from localStorage
      const savedLanguage = localStorage.getItem("preferredLanguage") as Language | null

      if (savedLanguage && (savedLanguage === "sv" || savedLanguage === "en")) {
        setLanguage(savedLanguage)
      } else {
        // If no saved preference, detect from browser
        const browserLang = navigator.language.split("-")[0]
        if (browserLang === "en") {
          setLanguage("en")
        }
      }
    } catch (error) {
      console.error("Error loading language preference:", error)
    }
  }, [])

  // Initialize phone number from formData
  useEffect(() => {
    if (formData.phone) {
      // Extract the country code and number part
      const match = formData.phone.match(/^\+(\d+)\s(.*)$/)
      if (match) {
        setCountryCode(`+${match[1]}`)
        setPhoneNumber(match[2])
      }
    }

    // Initialize contact preferences
    if (formData.contactPreference) {
      setContactPreferences(formData.contactPreference)
    }
  }, [formData.phone, formData.contactPreference])

  // Check if all fields are filled and valid
  useEffect(() => {
    const isNameValid = !!formData.name
    const isPhoneValid = !!phoneNumber && phoneNumber.length >= 9 && !phoneError
    const isEmailValid = !!formData.email && validateEmail(formData.email)

    let isBusinessFieldsValid = true
    if (isBusinessCustomer) {
      isBusinessFieldsValid = !!formData.companyName && !!formData.orgNumber && !orgNumberError
    }

    setIsFormComplete(isNameValid && isPhoneValid && isEmailValid && isBusinessFieldsValid)
  }, [
    formData.name,
    phoneNumber,
    formData.email,
    phoneError,
    isBusinessCustomer,
    formData.companyName,
    formData.orgNumber,
    orgNumberError,
  ])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)

    if (email && !isValid) {
      setEmailError(t("emailError"))
    } else {
      setEmailError("")
    }

    return isValid
  }

  // Validate Swedish organization number
  const validateOrgNumber = (orgNumber: string): boolean => {
    // Remove spaces and dashes
    const cleanOrgNumber = orgNumber.replace(/[- ]/g, "")

    // Check if it's 10 or 12 digits
    const isValid = /^(\d{10}|\d{12})$/.test(cleanOrgNumber)

    if (orgNumber && !isValid) {
      setOrgNumberError("Ange ett giltigt organisationsnummer (10 eller 12 siffror)")
    } else {
      setOrgNumberError("")
    }

    return isValid
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    let digits = value.replace(/\D/g, "")

    // If it starts with a 0, remove it (Swedish convention)
    if (digits.startsWith("0")) {
      digits = digits.substring(1)
    }

    // Format with spaces: 72 123 45 67
    let formatted = ""
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5 || i === 7) {
        formatted += " "
      }
      formatted += digits[i]
    }

    // Validate phone number length
    if (digits.length > 0) {
      if (digits.length < 9) {
        setPhoneError(t("phoneError"))
      } else if (digits.length > 10) {
        setPhoneError(t("phoneTooLongError"))
      } else {
        setPhoneError("")
      }
    } else {
      setPhoneError("")
    }

    return formatted.trim()
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatPhoneNumber(value)
    setPhoneNumber(formattedValue)

    // Store the complete phone number with country code in formData
    handleChange("phone", `${countryCode} ${formattedValue}`)
  }

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code)
    handleChange("phone", `${code} ${phoneNumber}`)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleChange("email", value)
    if (value) validateEmail(value)
  }

  const handleOrgNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleChange("orgNumber", value)
    if (value) validateOrgNumber(value)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as Language)
  }

  const handleContactPreferenceChange = (id: string, checked: boolean) => {
    let newPreferences = [...contactPreferences]

    if (checked) {
      if (!newPreferences.includes(id)) {
        newPreferences.push(id)
      }
    } else {
      newPreferences = newPreferences.filter((pref) => pref !== id)
    }

    setContactPreferences(newPreferences)
    handleChange("contactPreference", newPreferences)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormComplete) {
      nextStep()
    }
  }

  const handleFocus = (fieldName: string) => {
    setActiveField(fieldName)
  }

  const handleBlur = () => {
    setActiveField(null)
  }

  // Uppdatera formulärets wrapper för att ge mer utrymme
  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <LanguageSelector onChange={handleLanguageChange} currentLanguage={language} />

      <h2 className="text-2xl font-semibold mb-2">
        {isBusinessCustomer ? "Företagsuppgifter" : t("contactInfoTitle")}
      </h2>

      <p className="text-muted-foreground mb-5">
        {isBusinessCustomer
          ? "Fyll i dina företagsuppgifter så tar vi fram en skräddarsydd offert. Vi kontaktar dig om vi behöver mer information om era behov."
          : t("contactInfoDescription")}
      </p>

      <div className="space-y-8">
        {isBusinessCustomer && (
          <>
            <div className="space-y-6">
              {/* Företagsinformation */}
              <Card
                className="p-7 border border-gray-200 shadow-sm hover:shadow-md transition-all mb-8"
                style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}
              >
                <div className="flex items-center mb-4">
                  <Building2 className="w-7 h-7 text-blue-700 mr-3" />
                  <h3 className="text-2xl font-semibold text-blue-900 pb-3 border-b-2 border-gray-200 w-full">
                    Företagsinformation
                  </h3>
                </div>
                <p className="text-gray-700 mb-4 font-medium">
                  Dessa uppgifter hjälper oss att skräddarsy offerten efter ert företags behov och underlättar
                  fakturering.
                </p>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="companyName" className="block mb-1 flex items-center">
                      Företagsnamn <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="companyName"
                      value={formData.companyName || ""}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      onFocus={() => handleFocus("companyName")}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                        activeField === "companyName" ? "bg-blue-50" : ""
                      }`}
                      placeholder="Företagets namn AB"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="orgNumber" className="block mb-1 flex items-center">
                      Organisationsnummer <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="orgNumber"
                      value={formData.orgNumber || ""}
                      onChange={handleOrgNumberChange}
                      onFocus={() => handleFocus("orgNumber")}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                        orgNumberError ? "border-red-600 focus:border-red-600" : "border-gray-200 focus:border-blue-400"
                      } ${activeField === "orgNumber" ? "bg-blue-50" : ""}`}
                      placeholder="XXXXXX-XXXX"
                      required
                    />
                    {orgNumberError && (
                      <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                        {orgNumberError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Ange organisationsnummer utan bindestreck (t.ex. 5591234567)
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        <Card
          className="p-7 border border-gray-200 shadow-sm hover:shadow-md transition-all mb-8 mt-4"
          style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center mb-4">
            <Mail className="w-7 h-7 text-purple-600 mr-3" />
            <h3 className="text-2xl font-semibold text-blue-900 pb-3 border-b-2 border-gray-200 w-full">
              {isBusinessCustomer ? "Kontaktuppgifter" : "Dina kontaktuppgifter"}
            </h3>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="block mb-1">
                {isBusinessCustomer ? "Ditt namn" : t("nameLabel")}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onFocus={() => handleFocus("name")}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                  activeField === "name" ? "bg-blue-50" : ""
                }`}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block mb-1">
                {t("phoneLabel")}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex">
                <CountryCodeSelect value={countryCode} onChange={handleCountryCodeChange} language={language} />
                <Input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onFocus={() => handleFocus("phone")}
                  onBlur={handleBlur}
                  className={`flex-1 px-4 py-3 rounded-r-xl border-y border-r shadow-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                    phoneError ? "border-red-600 focus:border-red-600" : "border-gray-200 focus:border-blue-400"
                  } ${activeField === "phone" ? "bg-blue-50" : ""}`}
                  placeholder={t("phonePlaceholder")}
                  required
                />
              </div>
              {phoneError && (
                <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {phoneError}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">{t("phoneHelper")}</p>
            </div>

            <div>
              <Label htmlFor="email" className="block mb-1">
                {t("emailLabel")}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleEmailChange}
                onFocus={() => handleFocus("email")}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                  emailError ? "border-red-600 focus:border-red-600" : "border-gray-200 focus:border-blue-400"
                } ${activeField === "email" ? "bg-blue-50" : ""}`}
                placeholder={t("emailPlaceholder")}
                required
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {emailError}
                </p>
              )}
            </div>

            {isBusinessCustomer && (
              <>
                <div>
                  <Label htmlFor="contactPerson" className="block mb-1">
                    Kontaktperson
                  </Label>
                  <Input
                    type="text"
                    id="contactPerson"
                    value={formData.contactPerson || ""}
                    onChange={(e) => handleChange("contactPerson", e.target.value)}
                    onFocus={() => handleFocus("contactPerson")}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                      activeField === "contactPerson" ? "bg-blue-50" : ""
                    }`}
                    placeholder="Namn på kontaktperson"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="block mb-1">
                    Roll i företaget
                  </Label>
                  <Input
                    type="text"
                    id="role"
                    value={formData.role || ""}
                    onChange={(e) => handleChange("role", e.target.value)}
                    onFocus={() => handleFocus("role")}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                      activeField === "role" ? "bg-blue-50" : ""
                    }`}
                    placeholder="T.ex. VD, Kontorschef"
                  />
                </div>
              </>
            )}

            {isBusinessCustomer && (
              <div className="mt-4">
                <Label className="block mb-3">Hur vill du bli kontaktad?</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact-email"
                      checked={contactPreferences.includes("email")}
                      onCheckedChange={(checked) => handleContactPreferenceChange("email", checked as boolean)}
                    />
                    <Label htmlFor="contact-email" className="flex items-center cursor-pointer">
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      E-post
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact-phone"
                      checked={contactPreferences.includes("phone")}
                      onCheckedChange={(checked) => handleContactPreferenceChange("phone", checked as boolean)}
                    />
                    <Label htmlFor="contact-phone" className="flex items-center cursor-pointer">
                      <PhoneIcon className="w-4 h-4 mr-2 text-green-600" />
                      Telefon
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact-sms"
                      checked={contactPreferences.includes("sms")}
                      onCheckedChange={(checked) => handleContactPreferenceChange("sms", checked as boolean)}
                    />
                    <Label htmlFor="contact-sms" className="flex items-center cursor-pointer">
                      <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                      SMS
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Du kan välja flera kontaktmetoder.</p>
                {contactPreferences.length === 0 && (
                  <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                    Välj minst ett kontaktsätt
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button
          type="button"
          onClick={prevStep}
          className="border border-blue-300 text-blue-600 py-2 px-5 rounded-lg hover:bg-blue-50 transition duration-300 text-sm font-medium"
        >
          {t("backButton")}
        </button>
        <button
          type="submit"
          disabled={!isFormComplete}
          className={`text-white py-4 px-8 rounded-lg transition-all duration-300 font-medium text-lg ${
            isFormComplete
              ? isBusinessCustomer
                ? "bg-green-600 hover:bg-green-700 transform hover:scale-[1.02] hover:shadow-lg"
                : "bg-green-600 hover:bg-green-700 transform hover:scale-[1.02] hover:shadow-lg"
              : "bg-gray-400 cursor-not-allowed opacity-70"
          }`}
          style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
        >
          {isBusinessCustomer ? "Nästa steg: Välj tjänst →" : t("nextButton")}
        </button>
      </div>
    </form>
  )
}
