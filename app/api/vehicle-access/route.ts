import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Generate personal code
function generatePersonalCode(employeeName: string): string {
  const initials = employeeName.split(' ').map(n => n[0]).join('').toUpperCase()
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 90) + 10
  return `${initials}${year}${random}`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const vehicleId = searchParams.get('vehicle_id')
    const employeeId = searchParams.get('employee_id')
    const isActive = searchParams.get('is_active')
    
    let query = supabase
      .from('fordon_access')
      .select(`
        *,
        fordon!inner(registration_number, make, model, type),
        anstallda_extended!inner(name, email, department, role)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`anstallda_extended.name.ilike.%${search}%,personal_code.ilike.%${search}%`)
    }
    
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching vehicle access:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicle access' }, { status: 500 })
    }
    
    return NextResponse.json({
      vehicleAccess: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in vehicle-access GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    // Generate personal code
    const personalCode = generatePersonalCode(data.employeeName)
    
    const accessData = {
      ...data,
      personal_code: personalCode,
      is_active: true,
      granted_date: new Date().toISOString().split('T')[0]
    }
    
    const { error } = await supabase
      .from('fordon_access')
      .insert(accessData)
    
    if (error) {
      console.error('Error creating vehicle access:', error)
      return NextResponse.json({ error: 'Failed to create vehicle access' }, { status: 500 })
    }
    
    // Update employee personal code
    await supabase
      .from('anstallda_extended')
      .update({ personal_code: personalCode })
      .eq('id', data.employee_id)
    
    return NextResponse.json({ 
      message: 'Vehicle access created successfully',
      personalCode 
    })
  } catch (error) {
    console.error('Error in vehicle-access POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('fordon_access')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating vehicle access:', error)
      return NextResponse.json({ error: 'Failed to update vehicle access' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Vehicle access updated successfully' })
  } catch (error) {
    console.error('Error in vehicle-access PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Revoke or activate access
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { id, action, revokedBy } = await request.json()
    
    let updateData: any = {}
    
    switch (action) {
      case 'revoke':
        updateData = {
          is_active: false,
          revoked_date: new Date().toISOString().split('T')[0],
          revoked_by: revokedBy
        }
        break
      case 'activate':
        updateData = {
          is_active: true,
          revoked_date: null,
          revoked_by: null
        }
        break
      case 'regenerate_code':
        // Get employee name to generate new code
        const { data: access } = await supabase
          .from('fordon_access')
          .select('anstallda_extended(name)')
          .eq('id', id)
          .single()
        
        if (access?.anstallda_extended) {
          const newCode = generatePersonalCode(access.anstallda_extended.name)
          updateData = { personal_code: newCode }
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('fordon_access')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating vehicle access status:', error)
      return NextResponse.json({ error: 'Failed to update vehicle access status' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Vehicle access status updated successfully' })
  } catch (error) {
    console.error('Error in vehicle-access PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}