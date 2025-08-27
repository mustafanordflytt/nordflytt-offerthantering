import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SmsService } from '@/lib/notifications/sms-service'

// Initialize Supabase Admin client (service role)
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

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Telefonnummer krävs' },
        { status: 400 }
      )
    }

    // Check if employee exists with this phone number (get only active ones)
    const { data: employees, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, name, role, status')
      .eq('phone', phone)
      .eq('status', 'active')
    
    const employee = employees?.[0]

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Inget konto hittat med detta nummer' },
        { status: 404 }
      )
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: 'Ditt konto är inte aktivt. Kontakta din chef.' },
        { status: 403 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store OTP in database (without employee_id since column doesn't exist)
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone,
        code: otp,
        expires_at: expiresAt.toISOString()
      })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      return NextResponse.json(
        { error: 'Kunde inte skapa engångskod' },
        { status: 500 }
      )
    }

    // Clean up old OTPs
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .or('expires_at.lt.now(),used.eq.true')

    // Send SMS with professional message
    const message = `Din Nordflytt-kod: ${otp}
    
Koden är giltig i 5 minuter.

Loggar du inte in? Kontakta din chef.`
    
    // Log OTP in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP for ${phone}]: ${otp}`)
    }
    
    // Send SMS using the SMS service
    const smsResult = await SmsService.sendSms({
      to: phone,
      message
    })
    
    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error)
      // Don't fail in development
      if (process.env.NODE_ENV !== 'development') {
        throw new Error(smsResult.error || 'Failed to send SMS')
      }
    }

    // In development, also return OTP for testing
    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Kod skickad',
      ...(isDev && { otp }) // Only in development!
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Serverfel' },
      { status: 500 }
    )
  }
}