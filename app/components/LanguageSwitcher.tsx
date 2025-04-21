"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { translations, type Language } from "../i18n/translations"

interface LanguageSwitcherProps {
  currentLanguage: Language
  onChange: (language: Language) => void
}

export default function LanguageSwitcher({ currentLanguage, onChange }: LanguageSwitcherProps) {
  const [mounted, setMounted] = useState(false)

  // Only show the language switcher after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const languages = [
    { code: "sv", name: "Svenska", flag: "🇸🇪" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ]

  const handleLanguageChange = (languageCode: Language) => {
    onChange(languageCode)

    // Save language preference to localStorage
    try {
      localStorage.setItem("preferredLanguage", languageCode)
    } catch (error) {
      console.error("Error saving language preference:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{translations[currentLanguage].languageSelector}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code as Language)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="mr-1">{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {currentLanguage === language.code && <Check className="h-4 w-4 text-green-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
