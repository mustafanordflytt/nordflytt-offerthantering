import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Initialize Supabase Admin client
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

// Generate JWT token
function generateToken(employee: any): string {
  const payload = {
    id: employee.id,
    phone: employee.phone,
    name: employee.name,
    role: employee.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key')
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()
    
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Telefonnummer och kod krävs' },
        { status: 400 }
      )
    }

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången kod' },
        { status: 401 }
      )
    }

    // Get employee data separately
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'active')
      .single()
    
    if (empError || !employee) {
      return NextResponse.json(
        { error: 'Anställd hittades inte' },
        { status: 404 }
      )
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)

    // Create or update Supabase auth user
    let supabaseUserId = employee.supabase_user_id

    if (!supabaseUserId) {
      // Create auth user if doesn't exist
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        phone: phone,
        phone_confirm: true,
        user_metadata: {
          name: employee.name,
          role: employee.role,
          employee_id: employee.id
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
      } else if (authUser?.user) {
        supabaseUserId = authUser.user.id
        
        // Update employee with Supabase user ID
        await supabaseAdmin
          .from('employees')
          .update({
            supabase_user_id: supabaseUserId,
            phone_verified: true
          })
          .eq('id', employee.id)
      }
    }

    // Update login stats
    await supabaseAdmin
      .from('employees')
      .update({
        last_login: new Date().toISOString(),
        login_count: (employee.login_count || 0) + 1
      })
      .eq('id', employee.id)

    // Generate JWT token
    const token = generateToken(employee)

    // Get fresh employee data
    const { data: updatedEmployee } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employee.id)
      .single()

    return NextResponse.json({
      success: true,
      token,
      employee: {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        role: updatedEmployee.role,
        avatar_url: updatedEmployee.avatar_url,
        specialties: updatedEmployee.specialties,
        driver_license_type: updatedEmployee.driver_license_type,
        certifications: updatedEmployee.certifications
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Serverfel' },
      { status: 500 }
    )
  }
}