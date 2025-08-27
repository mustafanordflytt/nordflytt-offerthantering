import { NextRequest, NextResponse } from 'next/server'
import { getAllStaff, addStaff } from '@/lib/staff-data'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client if env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null

export async function GET(request: NextRequest) {
  try {
    // Try Supabase first if configured
    if (supabase) {
      const searchParams = request.nextUrl.searchParams
      const status = searchParams.get('status') || 'active'
      
      let query = supabase
        .from('staff')
        .select('*')
        .order('name')
      
      if (status) {
        query = query.eq('status', status)
      }
      
      const { data, error } = await query
      
      if (!error && data && data.length > 0) {
        return NextResponse.json({ staff: data, data: data })
      }
    }
    
    // Fall back to mock data
    const staffData = getAllStaff()
    return NextResponse.json({ staff: staffData, data: staffData })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Create new staff member
    const newStaff = addStaff({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: 'available',
      hireDate: new Date(data.hireDate),
      skills: data.skills || [],
      currentJobs: [],
      totalJobsCompleted: 0,
      rating: 5.0,
      notes: data.notes || '',
      avatar: '/placeholder-user.jpg',
      department: data.department,
      address: data.address || '',
      emergencyContact: data.emergencyContact || '',
      salary: data.salary ? parseInt(data.salary) : undefined,
      employmentType: data.employmentType || 'full_time'
    })
    
    return NextResponse.json({ 
      message: 'Staff member created successfully',
      staff: newStaff
    })
  } catch (error) {
    console.error('Error creating staff member:', error)
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}