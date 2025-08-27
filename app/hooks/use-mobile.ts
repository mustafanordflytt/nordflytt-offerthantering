import { useState, useEffect } from 'react'

// Hook för att kontrollera om nuvarande enhet är en mobil
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Funktion för att kontrollera om skärmbredden är för mobil
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px är vanlig brytpunkt för mobil
    }

    // Kör funktionen direkt
    checkIfMobile()

    // Lägg till event listener för window resize
    window.addEventListener('resize', checkIfMobile)

    // Städa upp när komponenten unmountar
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return isMobile
}

// Alias för bakåtkompatibilitet
export const useIsMobile = useMobile