import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genererar en unik bokningsreferens baserad på timestamp och slumpmässiga tecken
 */
export function generateBookingReference(): string {
  const timestamp = Date.now().toString().slice(-8)
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${timestamp}${randomChars}`
}

/**
 * Normaliserar ett svenskt telefonnummer till E.164-format
 */
export function normalizePhoneNumber(phone: string): string {
  return phone
    .replace(/\s+/g, '') // Ta bort mellanslag
    .replace(/^0/, '+46') // Ersätt inledande 0 med +46
    .replace(/[^\d+]/g, '') // Ta bort alla tecken utom siffror och +
}

/**
 * Validerar en e-postadress
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validerar ett svenskt telefonnummer
 */
export function validatePhone(phone: string): boolean {
  const normalizedPhone = normalizePhoneNumber(phone)
  const phoneRegex = /^\+46[1-9]\d{8}$/
  return phoneRegex.test(normalizedPhone)
}
