import { jwtVerify } from 'jose'

// JWT Secret for staff authentication
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nordflytt-personalapp-secret-key-2025'
)

// Helper function to verify JWT token
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}