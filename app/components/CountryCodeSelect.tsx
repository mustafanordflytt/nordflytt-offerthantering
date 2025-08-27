"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import type { Language } from "../i18n/translations"

interface Country {
  code: string
  name: {
    sv: string
    en: string
  }
  dialCode: string
  flag: string
}

interface CountryCodeSelectProps {
  value: string
  onChange: (value: string) => void
  language: Language
}

// Common country codes with flags (emoji flags)
const countries: Country[] = [
  { code: "SE", name: { sv: "Sverige", en: "Sweden" }, dialCode: "+46", flag: "🇸🇪" },
  { code: "DK", name: { sv: "Danmark", en: "Denmark" }, dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: { sv: "Finland", en: "Finland" }, dialCode: "+358", flag: "🇫🇮" },
  { code: "FR", name: { sv: "Frankrike", en: "France" }, dialCode: "+33", flag: "🇫🇷" },
  { code: "DE", name: { sv: "Tyskland", en: "Germany" }, dialCode: "+49", flag: "🇩🇪" },
  { code: "GB", name: { sv: "Storbritannien", en: "United Kingdom" }, dialCode: "+44", flag: "🇬🇧" },
  { code: "IT", name: { sv: "Italien", en: "Italy" }, dialCode: "+39", flag: "🇮🇹" },
  { code: "NO", name: { sv: "Norge", en: "Norway" }, dialCode: "+47", flag: "🇳🇴" },
  { code: "ES", name: { sv: "Spanien", en: "Spain" }, dialCode: "+34", flag: "🇪🇸" },
  { code: "US", name: { sv: "USA", en: "USA" }, dialCode: "+1", flag: "🇺🇸" },
]

// Sort countries: Sweden first, then alphabetically by name
const getSortedCountries = (language: Language) => {
  const sweden = countries.find((c) => c.code === "SE")!
  const otherCountries = countries
    .filter((c) => c.code !== "SE")
    .sort((a, b) => a.name[language].localeCompare(b.name[language]))

  return [sweden, ...otherCountries]
}

export default function CountryCodeSelect({ value, onChange, language }: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find((c) => c.dialCode === value) || countries[0],
  )
  const [sortedCountries, setSortedCountries] = useState<Country[]>(getSortedCountries(language))
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update sorted countries when language changes
  useEffect(() => {
    setSortedCountries(getSortedCountries(language))
  }, [language])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Try to detect user's country based on browser locale
  useEffect(() => {
    try {
      const userLocale = navigator.language || navigator.languages[0]
      const countryCode = userLocale.split("-")[1]?.toUpperCase()

      if (countryCode && countryCode !== "SE") {
        const detectedCountry = countries.find((c) => c.code === countryCode)
        if (detectedCountry && selectedCountry.code === "SE") {
          setSelectedCountry(detectedCountry)
          onChange(detectedCountry.dialCode)
        }
      }
    } catch (error) {
      console.error("Error detecting country:", error)
    }
  }, [])

  const handleSelect = (country: Country) => {
    setSelectedCountry(country)
    onChange(country.dialCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 bg-gray-100 border border-gray-200 rounded-l-xl flex items-center justify-between px-2 py-3 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
      >
        <span className="flex items-center">
          <span className="mr-1">{selectedCountry.flag}</span>
          <span>{selectedCountry.dialCode}</span>
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {sortedCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleSelect(country)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
            >
              <span className="mr-2">{country.flag}</span>
              <span>{country.name[language]}</span>
              <span className="ml-auto text-gray-500">{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
