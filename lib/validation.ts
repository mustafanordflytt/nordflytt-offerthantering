// Robust form validation utilities

// Swedish phone number validation
export function validateSwedishPhone(phone: string): boolean {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Valid formats:
  // 07X-XXX XX XX (mobile)
  // 08-XXX XX XX (Stockholm)
  // International: +467XXXXXXXX or 00467XXXXXXXX
  
  // Check Swedish mobile (07X)
  if (/^0[7][0-9]{8}$/.test(cleaned)) return true
  
  // Check Swedish landline (0X)
  if (/^0[1-9][0-9]{7,8}$/.test(cleaned)) return true
  
  // Check international format
  if (/^46[1-9][0-9]{7,8}$/.test(cleaned)) return true
  if (/^0046[1-9][0-9]{7,8}$/.test(cleaned)) return true
  
  return false
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  // Swedish mobile
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
  }
  
  // Stockholm landline
  if (cleaned.startsWith('08') && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`
  }
  
  // International
  if (cleaned.startsWith('46')) {
    const number = cleaned.slice(2)
    if (number.startsWith('7') && number.length === 9) {
      return `+46 ${number.slice(0, 2)}-${number.slice(2, 5)} ${number.slice(5, 7)} ${number.slice(7)}`
    }
  }
  
  return phone
}

// Enhanced email validation
export function validateEmail(email: string): boolean {
  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(email)) return false
  
  // Additional checks
  const parts = email.split('@')
  if (parts.length !== 2) return false
  
  const [localPart, domain] = parts
  
  // Check local part length (max 64 characters)
  if (localPart.length > 64) return false
  
  // Check domain has at least one dot
  if (!domain.includes('.')) return false
  
  // Check no consecutive dots
  if (email.includes('..')) return false
  
  return true
}

// Date validation - must be at least 48 hours in the future
export function validateMoveDate(date: string): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: true } // Date is optional
  }
  
  const selectedDate = new Date(date)
  const now = new Date()
  const minDate = new Date(now.getTime() + (48 * 60 * 60 * 1000)) // 48 hours from now
  
  if (selectedDate < now) {
    return { valid: false, error: 'Datum kan inte vara i det förflutna' }
  }
  
  if (selectedDate < minDate) {
    return { valid: false, error: 'Flyttdatum måste vara minst 48 timmar framåt' }
  }
  
  // Check if it's a weekend (optional - companies might not work weekends)
  const dayOfWeek = selectedDate.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Just a warning, not an error
    return { valid: true, error: 'OBS: Du har valt en helgdag. Kontrollera tillgänglighet.' }
  }
  
  return { valid: true }
}

// Personal number validation (Swedish)
export function validatePersonalNumber(pn: string): boolean {
  // Remove all non-digits
  const cleaned = pn.replace(/\D/g, '')
  
  // Should be 10 or 12 digits
  if (cleaned.length !== 10 && cleaned.length !== 12) return false
  
  // If 12 digits, should start with 19 or 20
  if (cleaned.length === 12) {
    const century = cleaned.substring(0, 2)
    if (century !== '19' && century !== '20') return false
  }
  
  // Basic date validation
  const year = cleaned.length === 12 ? cleaned.substring(2, 4) : cleaned.substring(0, 2)
  const month = cleaned.length === 12 ? cleaned.substring(4, 6) : cleaned.substring(2, 4)
  const day = cleaned.length === 12 ? cleaned.substring(6, 8) : cleaned.substring(4, 6)
  
  const monthNum = parseInt(month)
  const dayNum = parseInt(day)
  
  if (monthNum < 1 || monthNum > 12) return false
  if (dayNum < 1 || dayNum > 31) return false
  
  // Could add Luhn algorithm check here for full validation
  
  return true
}

// Address validation
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || address.trim().length < 5) {
    return { valid: false, error: 'Adress är för kort' }
  }
  
  // Check for at least street and number
  const hasNumber = /\d/.test(address)
  if (!hasNumber) {
    return { valid: false, error: 'Adress måste innehålla gatunummer' }
  }
  
  // Warning if no postal code detected (5 digits)
  const hasPostalCode = /\d{5}/.test(address)
  if (!hasPostalCode) {
    return { valid: true, error: 'Tips: Inkludera postnummer för bättre precision' }
  }
  
  return { valid: true }
}

// Name validation
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Namn är för kort' }
  }
  
  // Check for numbers (unless it's a company name)
  if (/\d/.test(name)) {
    return { valid: true } // Allow numbers for company names
  }
  
  // Check for at least two words for personal names
  const words = name.trim().split(/\s+/)
  if (words.length < 2) {
    return { valid: true, error: 'Tips: Ange både för- och efternamn' }
  }
  
  return { valid: true }
}

// Parking distance validation
export function validateParkingDistance(distance: number): { valid: boolean; error?: string } {
  if (distance < 0) {
    return { valid: false, error: 'Avstånd kan inte vara negativt' }
  }
  
  if (distance > 500) {
    return { valid: false, error: 'Avstånd verkar orimligt långt. Kontakta oss för speciallösning.' }
  }
  
  if (distance > 100) {
    return { valid: true, error: 'OBS: Långt bäravstånd kan påverka priset avsevärt' }
  }
  
  return { valid: true }
}