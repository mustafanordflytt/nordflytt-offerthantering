// Staff login API endpoint with JWT authentication
import { NextRequest, NextResponse } from 'next/server'
import { generateTokens, setAuthCookies, validateStaffCredentials } from '@/lib/auth/jwt'
import { createStaffSession } from '@/lib/staff-employee-sync'
import { rateLimit } from '@/lib/auth/middleware'

// Rate limit login attempts
const loginRateLimit = rateLimit(5, 300000) // 5 attempts per 5 minutes

export async function POST(request: NextRequest) {
  // Apply rate limiting
  return loginRateLimit(request, async () => {
    try {
      const body = await request.json()
      const { email, password } = body

      // Validate input
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        )
      }

      // Validate credentials
      const user = await validateStaffCredentials(email, password)
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Generate JWT tokens
      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.id,
      })

      // Set auth cookies
      await setAuthCookies(tokens)

      // Create staff session for backward compatibility
      await createStaffSession(email, password)

      // Log login event
      console.log(`Staff login: ${user.name} (${user.email}) at ${new Date().toISOString()}`)

      // Return user data and tokens
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 500 }
      )
    }
  })
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    // Clear auth cookies using the clearAuthCookies function
    const { clearAuthCookies } = await import('@/lib/auth/jwt')
    await clearAuthCookies()
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Logout failed'
    }, { status: 500 })
  }
}