import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'development-secret';
const JWT_ISSUER = 'nordflytt-api';
const JWT_AUDIENCE = 'nordflytt-client';

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  permissions?: string[];
}

/**
 * Generate a secure JWT token
 */
export async function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('24h')
    .sign(secret);
    
  return jwt;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    
    // Verify the token
    const { payload } = await jwtVerify(cleanToken, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Validate token for production use
 */
export async function validateTokenProduction(token: string): Promise<TokenPayload | null> {
  // In production, never accept development tokens
  if (process.env.NODE_ENV === 'production') {
    if (token === 'Bearer development-token' || token === 'development-token') {
      throw new Error('Development tokens not allowed in production');
    }
  }
  
  try {
    return await verifyToken(token);
  } catch (error) {
    // In development with AUTH_BYPASS, allow some flexibility
    if (process.env.NODE_ENV === 'development' && process.env.AUTH_BYPASS === 'true') {
      // Return a mock payload for development
      return {
        userId: 'dev-user',
        role: 'staff',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
        iss: JWT_ISSUER,
        aud: JWT_AUDIENCE,
      };
    }
    
    throw error;
  }
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(payload: TokenPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp * 1000 < Date.now();
}

/**
 * Extract user info from request headers
 */
export async function getUserFromRequest(authHeader?: string | null): Promise<TokenPayload | null> {
  if (!authHeader) return null;
  
  try {
    return await validateTokenProduction(authHeader);
  } catch {
    return null;
  }
}