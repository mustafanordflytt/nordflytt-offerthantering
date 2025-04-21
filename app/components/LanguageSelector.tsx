"use client"

interface LanguageSelectorProps {
  onChange: (language: string) => void
  currentLanguage: string
}

export default function LanguageSelector({ onChange, currentLanguage }: LanguageSelectorProps) {
  const languages = [
    { code: "sv", name: "Svenska", flag: "🇸🇪" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ]

  const handleLanguageChange = (languageCode: string) => {
    onChange(languageCode)
    // Save language preference to localStorage
    try {
      localStorage.setItem("preferredLanguage", languageCode)
    } catch (error) {
      console.error("Error saving language preference:", error)
    }
  }

  return (
    <div className="flex justify-end mb-4 space-x-2">
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          onClick={() => handleLanguageChange(language.code)}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center transition-colors ${
            currentLanguage === language.code
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="mr-1.5">{language.flag}</span>
          <span>{language.name}</span>
        </button>
      ))}
    </div>
  )
}
