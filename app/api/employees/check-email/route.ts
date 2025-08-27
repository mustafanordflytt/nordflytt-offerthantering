import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseKey) {
      const { getAllEmployees } = await import('@/lib/supabase/employees')
      
      try {
        const employees = await getAllEmployees()
        const emailExists = employees.some(emp => 
          emp.email.toLowerCase() === email.toLowerCase() && emp.is_active
        )
        
        return NextResponse.json({
          exists: emailExists,
          message: emailExists ? 'E-postadressen används redan av en aktiv anställd' : 'E-postadressen är tillgänglig'
        })
      } catch (error) {
        console.error('Error checking email:', error)
        // Return false to allow the user to proceed
        return NextResponse.json({
          exists: false,
          message: 'Kunde inte kontrollera e-post (databas ej tillgänglig)'
        })
      }
    } else {
      // No Supabase configured - always return available
      return NextResponse.json({
        exists: false,
        message: 'E-postkontroll ej tillgänglig (demo-läge)'
      })
    }
  } catch (error) {
    console.error('Error in check-email:', error)
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    )
  }
}