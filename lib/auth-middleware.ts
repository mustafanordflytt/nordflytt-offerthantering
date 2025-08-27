import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface AuthUser {
  id: string
  phone: string
  name: string
  role: string
  iat: number
  exp: number
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)

    // Verify JWT
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as AuthUser

    // Check if user still exists and is active
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('id, status')
      .eq('id', decoded.id)
      .single()

    if (error || !employee || employee.status !== 'active') {
      return null
    }

    return decoded

  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

// Helper to require auth in API routes
export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await verifyAuth(req)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(req, user)
  }
}