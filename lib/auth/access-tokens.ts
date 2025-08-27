import crypto from 'crypto'

// Generera säker access token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generera tidsbegränsad token
export function generateTimedToken(data: any, expiresInHours: number = 48): string {
  const expires = Date.now() + (expiresInHours * 60 * 60 * 1000)
  const payload = {
    ...data,
    exp: expires
  }
  
  // I produktion, använd JWT eller liknande
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// Validera token
export function validateToken(token: string): { valid: boolean; data?: any; error?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const payload = JSON.parse(decoded)
    
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false, error: 'Token has expired' }
    }
    
    return { valid: true, data: payload }
  } catch (error) {
    return { valid: false, error: 'Invalid token format' }
  }
}

// Generera säker länk för offert
export function generateOfferLink(offerId: string, baseUrl?: string): string {
  const token = generateSecureToken()
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // TODO: Spara token i databas med offerId
  
  return `${url}/offer/${offerId}?token=${token}`
}

// Generera säker länk för bokningsbekräftelse
export function generateOrderConfirmationLink(orderId: string, baseUrl?: string): string {
  const token = generateSecureToken()
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // TODO: Spara token i databas med orderId
  
  return `${url}/order-confirmation/${orderId}?token=${token}`
}