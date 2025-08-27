/**
 * Utility functions for masking sensitive data
 */

/**
 * Mask personal number (personnummer)
 * 19901225-1234 -> XXXXXX-1234
 */
export function maskPersonalNumber(personalNumber: string | undefined | null): string {
  if (!personalNumber) return ''
  
  // Remove any spaces or special characters except dash
  const cleaned = personalNumber.replace(/[^\d-]/g, '')
  
  // Handle both 10 and 12 digit formats
  if (cleaned.length >= 10) {
    const parts = cleaned.split('-')
    if (parts.length === 2) {
      const lastFour = parts[1]
      return `XXXXXX-${lastFour}`
    }
  }
  
  // Fallback: mask all but last 4 digits
  if (cleaned.length >= 4) {
    const lastFour = cleaned.slice(-4)
    return 'X'.repeat(cleaned.length - 4) + lastFour
  }
  
  return 'XXXXXX-XXXX'
}

/**
 * Mask phone number
 * 0701234567 -> 070X XXX 567
 * +46701234567 -> +46 70X XXX 567
 */
export function maskPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return ''
  
  // Remove spaces and special characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle Swedish mobile numbers
  if (cleaned.startsWith('+46')) {
    if (cleaned.length >= 12) {
      return `+46 ${cleaned.slice(3, 5)}X XXX ${cleaned.slice(-3)}`
    }
  } else if (cleaned.startsWith('07') && cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}X XXX ${cleaned.slice(-3)}`
  } else if (cleaned.startsWith('46') && cleaned.length >= 11) {
    return `+46 ${cleaned.slice(2, 4)}X XXX ${cleaned.slice(-3)}`
  }
  
  // Fallback: show first 3 and last 3 digits
  if (cleaned.length >= 6) {
    const first = cleaned.slice(0, 3)
    const last = cleaned.slice(-3)
    const middleLength = cleaned.length - 6
    return `${first}${'X'.repeat(middleLength)}${last}`
  }
  
  return 'XXX XXX XXX'
}

/**
 * Mask email address
 * john.doe@example.com -> j***@example.com
 * verylongemail@test.se -> v***@test.se
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return ''
  
  const parts = email.split('@')
  if (parts.length !== 2) return 'x***@example.com'
  
  const [localPart, domain] = parts
  
  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`
  }
  
  // Show first character and mask the rest
  return `${localPart[0]}***@${domain}`
}

/**
 * Mask credit card number
 * 1234567812345678 -> **** **** **** 5678
 */
export function maskCreditCard(cardNumber: string | undefined | null): string {
  if (!cardNumber) return ''
  
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (cleaned.length >= 4) {
    const lastFour = cleaned.slice(-4)
    return `**** **** **** ${lastFour}`
  }
  
  return '**** **** **** ****'
}

/**
 * Mask bank account number
 * Shows only last 4 digits
 */
export function maskBankAccount(accountNumber: string | undefined | null): string {
  if (!accountNumber) return ''
  
  const cleaned = accountNumber.replace(/\D/g, '')
  
  if (cleaned.length >= 4) {
    const lastFour = cleaned.slice(-4)
    return `****-${lastFour}`
  }
  
  return '****-****'
}

/**
 * Mask address - show only city
 * Kungsgatan 1, 111 43 Stockholm -> ***, Stockholm
 */
export function maskAddress(address: string | undefined | null): string {
  if (!address) return ''
  
  // Try to extract city (usually after postal code)
  const postalMatch = address.match(/\d{3}\s?\d{2}\s+([^,]+)/)
  if (postalMatch && postalMatch[1]) {
    return `***, ${postalMatch[1].trim()}`
  }
  
  // Try to find last part after comma
  const parts = address.split(',')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim()
    // Check if it looks like a city name (not just numbers)
    if (lastPart && !/^\d+$/.test(lastPart)) {
      return `***, ${lastPart}`
    }
  }
  
  return '***'
}

/**
 * Mask name - show only initials
 * Anna Andersson -> A.A.
 * Per Svensson -> P.S.
 */
export function maskName(name: string | undefined | null): string {
  if (!name) return ''
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'X.X.'
  
  const initials = parts
    .filter(part => part.length > 0)
    .map(part => part[0].toUpperCase())
    .join('.')
  
  return initials + '.'
}

/**
 * Utility to mask multiple fields in an object
 */
export function maskSensitiveData<T extends Record<string, any>>(
  data: T,
  fieldsToMask: {
    [K in keyof T]?: (value: T[K]) => string
  }
): T {
  const masked = { ...data }
  
  for (const [field, maskFn] of Object.entries(fieldsToMask)) {
    if (field in masked && maskFn) {
      masked[field as keyof T] = (maskFn as any)(masked[field as keyof T]) as any
    }
  }
  
  return masked
}

/**
 * Check if user should see unmasked data
 * Can be extended with role-based checks
 */
export function shouldMaskData(userRole?: string): boolean {
  // For now, mask data for everyone except admin
  return userRole !== 'admin'
}

// Example usage:
/*
const customer = {
  name: 'Anna Andersson',
  email: 'anna@example.com',
  phone: '0701234567',
  personalNumber: '19901225-1234',
  address: 'Kungsgatan 1, 111 43 Stockholm'
}

const maskedCustomer = maskSensitiveData(customer, {
  email: maskEmail,
  phone: maskPhoneNumber,
  personalNumber: maskPersonalNumber,
  address: maskAddress
})

console.log(maskedCustomer)
// {
//   name: 'Anna Andersson',
//   email: 'a***@example.com',
//   phone: '070X XXX 567',
//   personalNumber: 'XXXXXX-1234',
//   address: '***, Stockholm'
// }
*/