import { NextRequest, NextResponse } from 'next/server'
import { validateCRMAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Demo staff data
const demoStaff = [
  { id: 'staff_001', name: 'Johan Andersson', role: 'driver', phone: '070-111-2222', available: true },
  { id: 'staff_002', name: 'Peter Nilsson', role: 'mover', phone: '070-333-4444', available: true },
  { id: 'staff_003', name: 'Erik Svensson', role: 'lead', phone: '070-555-6666', available: true },
  { id: 'staff_004', name: 'Maria Larsson', role: 'mover', phone: '070-777-8888', available: false },
  { id: 'staff_005', name: 'Lars Andersson', role: 'driver', phone: '070-999-0000', available: true }
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id
    const { staffIds, action = 'assign' } = await request.json()

    if (!staffIds || !Array.isArray(staffIds)) {
      return NextResponse.json({ error: 'Invalid staff IDs' }, { status: 400 })
    }

    // Handle demo mode
    if (!supabase) {
      const assignedStaff = staffIds
        .map(id => demoStaff.find(s => s.id === id))
        .filter(Boolean)
        .map(staff => ({
          id: staff!.id,
          name: staff!.name,
          role: staff!.role,
          phone: staff!.phone
        }))

      return NextResponse.json({
        success: true,
        assignedStaff,
        message: action === 'assign' ? 'Staff assigned successfully' : 'Staff removed successfully'
      })
    }

    // Get current job details
    const { data: job, error: fetchError } = await supabase
      .from('bookings')
      .select('details')
      .eq('id', jobId)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const currentDetails = job.details || {}
    let assignedStaff = currentDetails.assignedStaff || []

    if (action === 'assign') {
      // Add new staff
      const newStaff = staffIds
        .filter(id => !assignedStaff.some((s: any) => s.id === id))
        .map(id => {
          const staff = demoStaff.find(s => s.id === id)
          return staff ? {
            id: staff.id,
            name: staff.name,
            role: staff.role,
            phone: staff.phone,
            assignedAt: new Date().toISOString()
          } : null
        })
        .filter(Boolean)

      assignedStaff = [...assignedStaff, ...newStaff]
    } else if (action === 'remove') {
      // Remove staff
      assignedStaff = assignedStaff.filter((s: any) => !staffIds.includes(s.id))
    }

    // Update job with new staff assignment
    const { data: updatedJob, error: updateError } = await supabase
      .from('bookings')
      .update({
        details: {
          ...currentDetails,
          assignedStaff
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating job:', updateError)
      return NextResponse.json({ error: 'Failed to update staff assignment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assignedStaff,
      message: action === 'assign' ? 'Staff assigned successfully' : 'Staff removed successfully'
    })

  } catch (error) {
    console.error('Error assigning staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Handle demo mode
    if (!supabase) {
      return NextResponse.json({
        success: true,
        availableStaff: demoStaff,
        assignedStaff: []
      })
    }

    // Get current job details
    const { data: job, error: fetchError } = await supabase
      .from('bookings')
      .select('details')
      .eq('id', jobId)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const assignedStaff = job.details?.assignedStaff || []

    // In a real system, this would check staff availability based on schedule
    // For now, return demo staff with availability
    const availableStaff = demoStaff.map(staff => ({
      ...staff,
      isAssigned: assignedStaff.some((a: any) => a.id === staff.id)
    }))

    return NextResponse.json({
      success: true,
      availableStaff,
      assignedStaff
    })

  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}