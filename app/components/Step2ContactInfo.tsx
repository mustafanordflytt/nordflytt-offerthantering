"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Building2, PhoneIcon, Mail, MessageSquare } from "lucide-react"
import CountryCodeSelect from "./CountryCodeSelect"
import LanguageSelector from "./LanguageSelector"
import { translations, type Language, type TranslationKey } from "../i18n/translations"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

// Debounce utility function
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

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
  // Core state - minimized re-renders
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+46")
  const [language, setLanguage] = useState<Language>("sv")
  const [activeField, setActiveField] = useState<string | null>(null)
  
  // Local state for immediate UI feedback (prevents lag)
  const [localName, setLocalName] = useState(formData.name)
  const [localEmail, setLocalEmail] = useState(formData.email)
  const [localCompanyName, setLocalCompanyName] = useState(formData.companyName || "")
  const [localOrgNumber, setLocalOrgNumber] = useState(formData.orgNumber || "")
  const [localContactPerson, setLocalContactPerson] = useState(formData.contactPerson || "")
  const [localRole, setLocalRole] = useState(formData.role || "")
  
  // Error states
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
    orgNumber: ""
  })
  
  const [contactPreferences, setContactPreferences] = useState<string[]>(
    formData.contactPreference || ["email"]
  )

  const isBusinessCustomer = useMemo(() => formData.customerType === "business", [formData.customerType])

  // Memoized translation function
  const t = useCallback((key: TranslationKey) => translations[language][key], [language])

  // Optimized validation functions
  const validateEmail = useCallback((email: string): boolean => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: "" }))
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)
    
    setErrors(prev => ({ 
      ...prev, 
      email: isValid ? "" : t("emailError")
    }))
    
    return isValid
  }, [t])

  const validateOrgNumber = useCallback((orgNumber: string): boolean => {
    if (!orgNumber) {
      setErrors(prev => ({ ...prev, orgNumber: "" }))
      return false
    }
    
    const cleanOrgNumber = orgNumber.replace(/[- ]/g, "")
    const isValid = /^(\d{10}|\d{12})$/.test(cleanOrgNumber)
    
    setErrors(prev => ({ 
      ...prev, 
      orgNumber: isValid ? "" : "Ange ett giltigt organisationsnummer (10 eller 12 siffror)"
    }))
    
    return isValid
  }, [])

  const validatePhone = useCallback((digits: string): boolean => {
    if (!digits) {
      setErrors(prev => ({ ...prev, phone: "" }))
      return false
    }
    
    let errorMsg = ""
    if (digits.length < 9) {
      errorMsg = t("phoneError")
    } else if (digits.length > 10) {
      errorMsg = t("phoneTooLongError")
    }
    
    setErrors(prev => ({ ...prev, phone: errorMsg }))
    return !errorMsg
  }, [t])

  // Optimized phone formatting
  const formatPhoneNumber = useCallback((value: string): string => {
    let digits = value.replace(/\D/g, "")
    
    if (digits.startsWith("0")) {
      digits = digits.substring(1)
    }
    
    // Fast formatting without complex loops
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 10)}`
  }, [])

  // Debounced update functions - key performance improvement
  const debouncedUpdateName = useCallback(
    debounce((name: string) => handleChange("name", name), 300),
    [handleChange]
  )

  const debouncedUpdateEmail = useCallback(
    debounce((email: string) => {
      handleChange("email", email)
      validateEmail(email)
    }, 400),
    [handleChange, validateEmail]
  )

  const debouncedUpdateCompanyName = useCallback(
    debounce((name: string) => handleChange("companyName", name), 300),
    [handleChange]
  )

  const debouncedUpdateOrgNumber = useCallback(
    debounce((orgNumber: string) => {
      handleChange("orgNumber", orgNumber)
      validateOrgNumber(orgNumber)
    }, 400),
    [handleChange, validateOrgNumber]
  )

  const debouncedUpdateContactPerson = useCallback(
    debounce((person: string) => handleChange("contactPerson", person), 300),
    [handleChange]
  )

  const debouncedUpdateRole = useCallback(
    debounce((role: string) => handleChange("role", role), 300),
    [handleChange]
  )

  // Form validation - memoized for performance
  const isFormComplete = useMemo(() => {
    const isNameValid = !!localName.trim()
    const isPhoneValid = !!phoneNumber && phoneNumber.replace(/\s/g, "").length >= 9 && !errors.phone
    const isEmailValid = !!localEmail && validateEmail(localEmail)
    
    let isBusinessFieldsValid = true
    if (isBusinessCustomer) {
      isBusinessFieldsValid = !!localCompanyName.trim() && !!localOrgNumber.trim() && !errors.orgNumber
    }
    
    return isNameValid && isPhoneValid && isEmailValid && isBusinessFieldsValid
  }, [localName, phoneNumber, localEmail, errors.phone, errors.orgNumber, isBusinessCustomer, localCompanyName, localOrgNumber, validateEmail])

  // Load language preference
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("preferredLanguage") as Language | null
      if (savedLanguage && (savedLanguage === "sv" || savedLanguage === "en")) {
        setLanguage(savedLanguage)
      } else {
        const browserLang = navigator.language.split("-")[0]
        if (browserLang === "en") {
          setLanguage("en")
        }
      }
    } catch (error) {
      console.error("Error loading language preference:", error)
    }
  }, [])

  // Initialize phone number
  useEffect(() => {
    if (formData.phone) {
      const match = formData.phone.match(/^\+(\d+)\s(.*)$/)
      if (match) {
        setCountryCode(`+${match[1]}`)
        setPhoneNumber(match[2])
      }
    }
  }, [formData.phone])

  // Event handlers - optimized for performance
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalName(value)
    debouncedUpdateName(value)
  }, [debouncedUpdateName])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalEmail(value)
    debouncedUpdateEmail(value)
  }, [debouncedUpdateEmail])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatPhoneNumber(value)
    const digits = value.replace(/\D/g, "")
    
    setPhoneNumber(formattedValue)
    validatePhone(digits)
    
    // Immediate update for phone since it's critical for UX
    handleChange("phone", `${countryCode} ${formattedValue}`)
  }, [formatPhoneNumber, validatePhone, handleChange, countryCode])

  const handleCountryCodeChange = useCallback((code: string) => {
    setCountryCode(code)
    handleChange("phone", `${code} ${phoneNumber}`)
  }, [handleChange, phoneNumber])

  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalCompanyName(value)
    debouncedUpdateCompanyName(value)
  }, [debouncedUpdateCompanyName])

  const handleOrgNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalOrgNumber(value)
    debouncedUpdateOrgNumber(value)
  }, [debouncedUpdateOrgNumber])

  const handleContactPersonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalContactPerson(value)
    debouncedUpdateContactPerson(value)
  }, [debouncedUpdateContactPerson])

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalRole(value)
    debouncedUpdateRole(value)
  }, [debouncedUpdateRole])

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang as Language)
  }, [])

  const handleContactPreferenceChange = useCallback((id: string, checked: boolean) => {
    setContactPreferences(prev => {
      const newPreferences = checked 
        ? [...prev, id].filter((item, index, arr) => arr.indexOf(item) === index)
        : prev.filter(pref => pref !== id)
      
      handleChange("contactPreference", newPreferences)
      return newPreferences
    })
  }, [handleChange])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (isFormComplete) {
      nextStep()
    }
  }, [isFormComplete, nextStep])

  const handleFocus = useCallback((fieldName: string) => {
    setActiveField(fieldName)
  }, [])

  const handleBlur = useCallback(() => {
    setActiveField(null)
  }, [])

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
          <Card className="p-7 border border-gray-200 shadow-sm hover:shadow-md transition-all mb-8">
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
                  value={localCompanyName}
                  onChange={handleCompanyNameChange}
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
                  value={localOrgNumber}
                  onChange={handleOrgNumberChange}
                  onFocus={() => handleFocus("orgNumber")}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                    errors.orgNumber ? "border-red-600 focus:border-red-600" : "border-gray-200 focus:border-blue-400"
                  } ${activeField === "orgNumber" ? "bg-blue-50" : ""}`}
                  placeholder="XXXXXX-XXXX"
                  required
                />
                {errors.orgNumber && (
                  <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.orgNumber}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ange organisationsnummer utan bindestreck (t.ex. 5591234567)
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-7 border border-gray-200 shadow-sm hover:shadow-md transition-all mb-8 mt-4">
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
                value={localName}
                onChange={handleNameChange}
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
                    errors.phone ? "border-red-600 focus:border-red-600" : "border-gray-200 focus:border-blue-400"
                  } ${activeField === "phone" ? "bg-blue-50" : ""}`}
                  placeholder={t("phonePlaceholder")}
                  required
                />
              </div>
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.phone}
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
                value={localEmail}
                onChange={handleEmailChange}
                onFocus={() => handleFocus("email")}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 ${
                  errors.email ? "border-red-600 focus:border-red-600" : "border-gray-200 focus:border-blue-400"
                } ${activeField === "email" ? "bg-blue-50" : ""}`}
                placeholder={t("emailPlaceholder")}
                required
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.email}
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
                    value={localContactPerson}
                    onChange={handleContactPersonChange}
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
                    value={localRole}
                    onChange={handleRoleChange}
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