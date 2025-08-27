import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { getStaffById, updateStaff, deleteStaff } from '@/lib/staff-data'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Mock staff data for fallback - includes detailed info
const mockStaffData: Record<string, any> = {
  'staff-001': {
    id: 'staff-001',
    name: 'Lars Andersson',
    email: 'lars.andersson@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'admin',
    status: 'available',
    hireDate: new Date('2020-01-15'),
    skills: ['Projektledning', 'Kundservice', 'Kvalitetssäkring'],
    currentJobs: ['job-001', 'job-005'],
    totalJobsCompleted: 156,
    rating: 4.9,
    notes: 'Erfaren projektledare med expertis inom komplexa flytt',
    department: 'Ledning',
    address: 'Stockholm',
    emergencyContact: { name: 'Anna Andersson', phone: '+46 70 987 65 43', relation: 'Fru' },
    salary: 45000,
    employmentType: 'full_time',
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2025-06-30'),
    certifications: ['Arbetsledare', 'Första Hjälpen', 'Truck-körkort'],
    languages: ['Svenska', 'Engelska', 'Tyska'],
    documents: [
      { name: 'Anställningsavtal', status: 'valid', expiryDate: null },
      { name: 'Truck-körkort', status: 'valid', expiryDate: '2026-01-15' },
      { name: 'Första hjälpen certifikat', status: 'expiring', expiryDate: '2025-03-20' }
    ],
    vacationDays: { total: 25, used: 12, remaining: 13 },
    performance: {
      scores: { leadership: 4.8, technical: 4.5, communication: 4.9, teamwork: 4.7 },
      thisMonth: { completed: 8, rating: 4.9, efficiency: 95 },
      lastMonth: { completed: 12, rating: 4.8, efficiency: 92 },
      thisYear: { completed: 156, rating: 4.9, efficiency: 94 }
    },
    recentJobs: [
      { id: 'job-001', customer: 'Volvo AB', date: '2025-07-01', status: 'completed', rating: 5 },
      { id: 'job-005', customer: 'IKEA Stockholm', date: '2025-06-28', status: 'in_progress', rating: null },
      { id: 'job-012', customer: 'Microsoft Sverige', date: '2025-06-25', status: 'completed', rating: 5 }
    ]
  },
  'staff-002': {
    id: 'staff-002',
    name: 'Maria Eriksson',
    email: 'maria.eriksson@nordflytt.se',
    phone: '+46 73 234 56 78',
    role: 'manager',
    status: 'busy',
    hireDate: new Date('2021-03-22'),
    skills: ['Teamledning', 'Schemaläggning', 'Kvalitetskontroll'],
    currentJobs: ['job-002', 'job-003'],
    totalJobsCompleted: 89,
    rating: 4.7,
    notes: 'Stark teamledare med fokus på effektivitet',
    department: 'Operations',
    address: 'Göteborg',
    emergencyContact: { name: 'Per Eriksson', phone: '+46 70 876 54 32', relation: 'Make' },
    languages: ['Svenska', 'Engelska'],
    documents: [
      { name: 'Anställningsavtal', status: 'valid', expiryDate: null }
    ],
    vacationDays: { total: 25, used: 5, remaining: 20 },
    performance: {
      scores: { leadership: 4.9, technical: 4.3, communication: 4.8, teamwork: 4.7 }
    },
    recentJobs: [
      { id: 'job-002', customer: 'H&M Huvudkontor', date: '2025-07-02', status: 'in_progress', rating: null },
      { id: 'job-003', customer: 'Ericsson', date: '2025-06-30', status: 'completed', rating: 4.5 }
    ]
  },
  'staff-003': {
    id: 'staff-003',
    name: 'Emma Nilsson',
    email: 'emma.nilsson@nordflytt.se',
    phone: '+46 72 456 78 90',
    role: 'customer_service',
    status: 'available',
    hireDate: new Date('2023-01-08'),
    skills: ['Kundservice', 'Problemlösning', 'Språk (EN, DE)'],
    currentJobs: [],
    totalJobsCompleted: 45,
    rating: 4.6,
    notes: 'Ny medarbetare med stark kundservicebakgrund',
    department: 'Kundtjänst',
    address: 'Stockholm',
    emergencyContact: { name: 'Mikael Nilsson', phone: '+46 70 654 32 10', relation: 'Sambo' },
    languages: ['Svenska', 'Engelska', 'Tyska'],
    documents: [
      { name: 'Anställningsavtal', status: 'valid', expiryDate: null }
    ],
    vacationDays: { total: 25, used: 2, remaining: 23 },
    performance: {
      scores: { leadership: 3.8, technical: 4.2, communication: 4.9, teamwork: 4.5 }
    },
    recentJobs: []
  },
  'staff-004': {
    id: 'staff-004',
    name: 'Peter Svensson',
    email: 'peter.svensson@nordflytt.se',
    phone: '+46 74 567 89 01',
    role: 'driver',
    status: 'scheduled',
    hireDate: new Date('2019-05-10'),
    skills: ['C-kort', 'CE-kort', 'Lastbilskörning', 'YKB'],
    currentJobs: ['job-004'],
    totalJobsCompleted: 312,
    rating: 4.9,
    notes: 'Senior chaufför med expertis inom långdistanstransporter',
    department: 'Transport',
    address: 'Uppsala',
    emergencyContact: { name: 'Ingrid Svensson', phone: '+46 70 543 21 09', relation: 'Fru' },
    languages: ['Svenska', 'Norska'],
    documents: [
      { name: 'C-körkort', status: 'valid', expiryDate: '2028-05-10' },
      { name: 'CE-körkort', status: 'valid', expiryDate: '2028-05-10' },
      { name: 'YKB', status: 'valid', expiryDate: '2026-09-15' }
    ],
    vacationDays: { total: 30, used: 18, remaining: 12 },
    performance: {
      scores: { leadership: 4.2, technical: 4.9, communication: 4.5, teamwork: 4.8 }
    },
    recentJobs: [
      { id: 'job-004', customer: 'Spotify', date: '2025-07-03', status: 'scheduled', rating: null }
    ]
  },
  'staff-005': {
    id: 'staff-005',
    name: 'Anna Johansson',
    email: 'anna.johansson@nordflytt.se',
    phone: '+46 75 678 90 12',
    role: 'mover',
    status: 'available',
    hireDate: new Date('2022-08-15'),
    skills: ['Tunga lyft', 'Möbelmontering', 'Packteknik'],
    currentJobs: ['job-006'],
    totalJobsCompleted: 98,
    rating: 4.5,
    notes: 'Noggrann packare med särskild expertis inom ömtåliga föremål',
    department: 'Flyttteam',
    address: 'Stockholm',
    emergencyContact: { name: 'Erik Johansson', phone: '+46 70 432 10 98', relation: 'Make' },
    languages: ['Svenska'],
    documents: [
      { name: 'Anställningsavtal', status: 'valid', expiryDate: null }
    ],
    vacationDays: { total: 25, used: 10, remaining: 15 },
    performance: {
      scores: { leadership: 3.5, technical: 4.6, communication: 4.3, teamwork: 4.7 }
    },
    recentJobs: [
      { id: 'job-006', customer: 'Privatperson - Villa', date: '2025-07-01', status: 'in_progress', rating: null }
    ]
  },
  'staff-006': {
    id: 'staff-006',
    name: 'Mustafa Abdulkarim',
    email: 'mustafa.abdulkarim@hotmail.com',
    phone: '+46 76 789 01 23',
    role: 'flyttpersonal_utan_körkort',
    status: 'available',
    hireDate: new Date('2024-01-01'),
    skills: ['Flyttarbete', 'Kundservice', 'Problemlösning'],
    currentJobs: [],
    totalJobsCompleted: 0,
    rating: 0.0,
    notes: 'Ny anställd, under upplärning',
    department: 'Flyttteam',
    address: 'Stockholm',
    emergencyContact: null,
    languages: ['Svenska', 'Engelska', 'Arabiska'],
    documents: [
      { name: 'Anställningsavtal', status: 'valid', expiryDate: null }
    ],
    vacationDays: { total: 25, used: 0, remaining: 25 },
    performance: {
      scores: { leadership: 0, technical: 0, communication: 0, teamwork: 0 }
    },
    recentJobs: []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const staffId = resolvedParams.id
    
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    
    // In development mode or with demo mode, check mock/demo data first
    if (process.env.NODE_ENV === 'development' || !supabase) {
      // Check in mockStaffData first for detailed info
      const mockStaff = mockStaffData[staffId]
      if (mockStaff) {
        return NextResponse.json({ staff: mockStaff, stats: {} })
      }
      
      // Then check in centralized demo data (for dynamically created staff)
      const staffMember = getStaffById(staffId)
      if (staffMember) {
        // Add default detailed info for demo staff
        const enhancedStaff = {
          ...staffMember,
          emergencyContact: staffMember.emergencyContact || null,
          languages: ['Svenska'],
          documents: [{ name: 'Anställningsavtal', status: 'valid', expiryDate: null }],
          vacationDays: { total: 25, used: 0, remaining: 25 },
          performance: {
            scores: { leadership: 0, technical: 0, communication: 0, teamwork: 0 }
          },
          recentJobs: []
        }
        return NextResponse.json({ staff: enhancedStaff, stats: {} })
      }
      
      // If not found in development mode, return 404
      if (!authResult.isValid) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
    }
    
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('staff:read') && !authResult.permissions.includes('employees:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch staff member from database
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select(`
        *,
        staff_availability!staff_id (
          status,
          current_job_id,
          available_from,
          available_until
        ),
        staff_time_reports!staff_id (
          id,
          job_id,
          report_date,
          total_minutes,
          status
        ),
        staff_training!staff_id (
          id,
          training_name,
          training_type,
          completed,
          certificate_url
        ),
        staff_documents!staff_id (
          id,
          document_type,
          document_name,
          valid_until
        )
      `)
      .eq('id', staffId)
      .single()

    if (staffError || !staffData) {
      console.error('Staff fetch error:', staffError)
      // Fallback to mock data for demo
      const staff = mockStaffData[staffId as keyof typeof mockStaffData]
      if (staff) {
        return NextResponse.json({ staff, stats: {} })
      }
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Transform staff data
    const transformedStaff = {
      id: staffData.id,
      name: `${staffData.first_name} ${staffData.last_name}`,
      email: staffData.email,
      phone: staffData.phone || staffData.mobile || '',
      role: staffData.role,
      status: staffData.staff_availability?.[0]?.status || 'available',
      hireDate: new Date(staffData.hire_date),
      skills: staffData.skills || [],
      currentJobs: staffData.staff_availability?.[0]?.current_job_id ? [staffData.staff_availability[0].current_job_id] : [],
      totalJobsCompleted: staffData.total_jobs_completed || 0,
      rating: staffData.average_rating || 0,
      notes: staffData.notes || '',
      department: staffData.department || 'Operations',
      address: staffData.city || '',
      emergencyContact: staffData.emergency_contact_name ? 
        `${staffData.emergency_contact_name}, ${staffData.emergency_contact_phone}` : 
        '',
      employmentType: staffData.employment_type || 'full_time',
      createdAt: new Date(staffData.created_at),
      updatedAt: new Date(staffData.updated_at),
      employee_number: staffData.employee_number,
      personalNumber: staffData.personal_number,
      certifications: staffData.certifications || [],
      languages: staffData.languages || [],
      driverLicenseTypes: staffData.driver_license_types || []
    }

    // Calculate statistics
    const recentReports = staffData.staff_time_reports?.slice(0, 10) || []
    const totalMinutesWorked = recentReports.reduce((sum: number, report: any) => sum + (report.total_minutes || 0), 0)
    const completedTrainings = staffData.staff_training?.filter((t: any) => t.completed).length || 0
    const totalTrainings = staffData.staff_training?.length || 0
    
    const stats = {
      daysEmployed: Math.ceil((Date.now() - new Date(staffData.hire_date).getTime()) / (1000 * 60 * 60 * 24)),
      currentWorkload: staffData.staff_availability?.[0]?.current_job_id ? 1 : 0,
      totalHoursWorked: Math.round(totalMinutesWorked / 60),
      trainingProgress: totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0,
      documentsCount: staffData.staff_documents?.length || 0,
      performanceScore: staffData.performance_score || 0
    }
    
    return NextResponse.json({
      staff: transformedStaff,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in staff details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    
    // In development, allow 'dev-token' or if auth is not fully valid
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment && (!authResult.isValid || !authResult.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions (skip in development if auth is not valid)
    if (authResult.isValid && authResult.permissions && 
        !authResult.permissions.includes('staff:write') && 
        !authResult.permissions.includes('employees:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const staffId = resolvedParams.id
    const body = await request.json()
    
    // For updates, we don't require all fields (partial update)
    // Only validate if fields are provided
    const { name, email, phone, role, department } = body
    
    // Split name into first and last name (if name is provided)
    let firstName, lastName
    if (name) {
      const nameParts = name.trim().split(' ')
      firstName = nameParts[0]
      lastName = nameParts.slice(1).join(' ') || nameParts[0]
    }
    
    // Validate email format (if email is provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }
    
    // Validate role (if role is provided)
    if (role) {
      const validRoles = ['admin', 'manager', 'mover', 'driver', 'customer_service', 'cleaner', 'office']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
    }
    
    // Prepare update data
    const staffUpdateData: any = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      mobile: body.mobile,
      role: role,
      department: department,
      address: body.address,
      city: body.city,
      postal_code: body.postalCode,
      skills: body.skills || [],
      languages: body.languages || [],
      driver_license_types: body.driverLicenseTypes || [],
      notes: body.notes,
      emergency_contact_name: body.emergencyContactName,
      emergency_contact_phone: body.emergencyContactPhone,
      emergency_contact_relation: body.emergencyContactRelation,
      updated_by: authResult.user.id,
      updated_at: new Date().toISOString()
    }

    // Always use demo mode for now (Supabase table structure issues)
    const useDemoMode = true // Force demo mode until Supabase is properly configured
    
    if (!supabase || useDemoMode) {
      // Check in mockStaffData first
      let staffToUpdate = mockStaffData[staffId]
      
      // If not found, use centralized demo data
      if (!staffToUpdate) {
        // Build update object
        const updates: any = {}
        if (name) {
          updates.name = `${firstName} ${lastName}`
        }
        if (email) {
          updates.email = email
        }
        if (phone) {
          updates.phone = phone
        }
        if (role) {
          updates.role = role
        }
        if (department) {
          updates.department = department
        }
        if (body.skills !== undefined) {
          updates.skills = body.skills
        }
        if (body.languages !== undefined) {
          updates.languages = body.languages
        }
        if (body.notes !== undefined) {
          updates.notes = body.notes
        }
        if (body.status !== undefined) {
          updates.status = body.status
        }
        if (body.address !== undefined) {
          updates.address = body.address
        }
        if (body.emergencyContact !== undefined) {
          updates.emergencyContact = body.emergencyContact
        }
        
        updates.updatedAt = new Date()
        
        // Update using centralized function
        const updatedStaff = updateStaff(staffId, updates)
        
        if (updatedStaff) {
          return NextResponse.json({
            success: true,
            staff: updatedStaff
          })
        }
      }
      
      if (!staffToUpdate) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
      
      // Update mockStaffData member
      // Update the staff data (partial update - only update provided fields)
      if (name) {
        staffToUpdate.name = `${firstName} ${lastName}`
      }
      if (email) {
        staffToUpdate.email = email
      }
      if (phone) {
        staffToUpdate.phone = phone
      }
      if (role) {
        staffToUpdate.role = role
      }
      if (department) {
        staffToUpdate.department = department
      }
      if (body.skills !== undefined) {
        staffToUpdate.skills = body.skills
      }
      if (body.languages !== undefined) {
        staffToUpdate.languages = body.languages
      }
      if (body.notes !== undefined) {
        staffToUpdate.notes = body.notes
      }
      if (body.status !== undefined) {
        staffToUpdate.status = body.status
      }
      if (body.address !== undefined) {
        staffToUpdate.address = body.address
      }
      if (body.emergencyContact !== undefined) {
        staffToUpdate.emergencyContact = body.emergencyContact
      }
      
      staffToUpdate.updatedAt = new Date()
      
      return NextResponse.json({
        success: true,
        staff: staffToUpdate
      })
    }
    
    // Update staff record
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update(staffUpdateData)
      .eq('id', staffId)
      .select()
      .single()

    if (updateError) {
      console.error('Staff update error:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
      throw updateError
    }

    // Update availability status if provided
    if (body.status) {
      const validStatuses = ['available', 'busy', 'scheduled', 'on_leave', 'off_duty']
      if (validStatuses.includes(body.status)) {
        await supabase
          .from('staff_availability')
          .update({ 
            status: body.status,
            updated_at: new Date().toISOString()
          })
          .eq('staff_id', staffId)
      }
    }

    // Transform response
    const transformedStaff = {
      id: updatedStaff.id,
      name: `${updatedStaff.first_name} ${updatedStaff.last_name}`,
      email: updatedStaff.email,
      phone: updatedStaff.phone || updatedStaff.mobile || '',
      role: updatedStaff.role,
      status: body.status || 'available',
      hireDate: new Date(updatedStaff.hire_date),
      skills: updatedStaff.skills || [],
      totalJobsCompleted: updatedStaff.total_jobs_completed || 0,
      rating: updatedStaff.average_rating || 0,
      notes: updatedStaff.notes || '',
      department: updatedStaff.department,
      address: updatedStaff.city || '',
      emergencyContact: updatedStaff.emergency_contact_name ? 
        `${updatedStaff.emergency_contact_name}, ${updatedStaff.emergency_contact_phone}` : 
        '',
      employmentType: updatedStaff.employment_type || 'full_time',
      updatedAt: new Date(updatedStaff.updated_at)
    }
    
    return NextResponse.json(transformedStaff)
    
  } catch (error) {
    console.error('Unexpected error in staff update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    
    // In development, allow 'dev-token' or if auth is not fully valid
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment && (!authResult.isValid || !authResult.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions (skip in development if auth is not valid)
    if (authResult.isValid && authResult.permissions && 
        !authResult.permissions.includes('staff:delete') && 
        !authResult.permissions.includes('employees:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const staffId = resolvedParams.id
    
    // Always use demo mode for now (Supabase table structure issues)
    const useDemoMode = true // Force demo mode until Supabase is properly configured
    
    if (!supabase || useDemoMode) {
      // Check in mockStaffData first
      let staffToDelete = mockStaffData[staffId]
      
      // If found in mockStaffData, update it
      if (staffToDelete) {
        staffToDelete.status = 'terminated'
        staffToDelete.employmentStatus = 'terminated'
        staffToDelete.terminationDate = new Date()
        
        return NextResponse.json({
          success: true,
          message: 'Staff member deactivated successfully'
        })
      }
      
      // Otherwise, use centralized delete function
      const deleted = deleteStaff(staffId)
      
      if (deleted) {
        return NextResponse.json({
          success: true,
          message: 'Staff member deactivated successfully'
        })
      }
      
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }
    
    // Check if staff member exists
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id, employment_status')
      .eq('id', staffId)
      .single()
    
    if (checkError || !existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Don't delete, just mark as terminated (soft delete)
    const { error: updateError } = await supabase
      .from('staff')
      .update({ 
        employment_status: 'terminated',
        termination_date: new Date().toISOString(),
        updated_by: authResult.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)

    if (updateError) {
      console.error('Staff termination error:', updateError)
      throw updateError
    }

    // Update availability to off_duty
    await supabase
      .from('staff_availability')
      .update({ 
        status: 'off_duty',
        current_job_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('staff_id', staffId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Staff member deactivated successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in staff deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}