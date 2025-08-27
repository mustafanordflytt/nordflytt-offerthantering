import crypto from 'crypto'

// IMPORTANT: In production, these should be stored in secure environment variables
// and rotated regularly. Never commit actual keys to version control.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dummy-key-for-development-only!'
const IV_LENGTH = 16
const ALGORITHM = 'aes-256-cbc'

// Ensure key is 32 bytes for AES-256
function getKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
}

/**
 * Encrypts sensitive data using AES-256-CBC
 * @param text - The plain text to encrypt
 * @returns Encrypted text in format: iv:encryptedData (base64 encoded)
 */
export function encrypt(text: string): string {
  if (!text) return ''
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = getKey()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    // Return iv:encryptedData format
    return `${iv.toString('base64')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedText - Encrypted text in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
    const [ivBase64, encrypted] = encryptedText.split(':')
    if (!ivBase64 || !encrypted) {
      throw new Error('Invalid encrypted format')
    }
    
    const iv = Buffer.from(ivBase64, 'base64')
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hashes sensitive data for comparison (e.g., for searching)
 * @param text - Text to hash
 * @returns SHA-256 hash
 */
export function hash(text: string): string {
  if (!text) return ''
  
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}

/**
 * Encrypts an object's sensitive fields
 * @param obj - Object containing sensitive data
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with specified fields encrypted
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field] as string) as T[typeof field]
    }
  }
  
  return encrypted
}

/**
 * Decrypts an object's encrypted fields
 * @param obj - Object containing encrypted data
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @returns Object with specified fields decrypted
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field] as string) as T[typeof field]
      } catch (error) {
        // If decryption fails, keep original value
        console.error(`Failed to decrypt field ${String(field)}`)
      }
    }
  }
  
  return decrypted
}

// Sensitive fields that should be encrypted in the database
export const SENSITIVE_FIELDS = {
  customer: ['personalNumber', 'email', 'phone', 'address', 'bankAccount'],
  booking: ['customerEmail', 'customerPhone', 'startAddress', 'endAddress'],
  creditCheck: ['personalNumber', 'result'],
  payment: ['swishNumber', 'accountNumber', 'transactionId']
}

/**
 * Example usage for encrypting customer data before saving to database
 */
export function encryptCustomerData(customer: any) {
  return encryptObject(customer, SENSITIVE_FIELDS.customer)
}

/**
 * Example usage for decrypting customer data after fetching from database
 */
export function decryptCustomerData(customer: any) {
  return decryptObject(customer, SENSITIVE_FIELDS.customer)
}

/**
 * Generates a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Validates that encryption is properly configured
 * @returns true if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return ENCRYPTION_KEY !== 'dummy-key-for-development-only!'
}