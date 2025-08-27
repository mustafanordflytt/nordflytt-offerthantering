import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('customers:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const customerId = resolvedParams.id
    
    // Fetch customer basic data first
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      console.error('Customer fetch error:', customerError)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Fetch related data separately
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    // Calculate statistics
    const totalRevenue = bookings?.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0) || 0
    const completedJobs = jobs?.filter((j: any) => j.status === 'completed').length || 0
    
    // Get most recent activity
    const lastActivity = bookings?.[0]?.created_at || customer.created_at

    // Transform customer data
    const transformedCustomer = {
      id: customer.id.toString(),
      name: customer.name || 'Unknown',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      customerType: customer.customer_type || 'private',
      organizationNumber: customer.organization_number || null,
      notes: customer.notes || '',
      tags: customer.tags || [],
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at || customer.created_at),
      status: customer.status || 'active',
      metadata: customer.metadata || {},
      // Relationships
      bookings: bookings || [],
      jobs: jobs || [],
      // Statistics
      stats: {
        totalRevenue,
        completedJobs,
        totalBookings: bookings?.length || 0,
        totalJobs: jobs?.length || 0,
        totalOffers: 0,
        acceptedOffers: 0,
        lastActivity: lastActivity ? new Date(lastActivity) : null,
        customerSince: new Date(customer.created_at),
        lifetimeValue: totalRevenue
      }
    }

    return NextResponse.json({
      customer: transformedCustomer
    })
    
  } catch (error) {
    console.error('Unexpected error in customer details API:', error)
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
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('customers:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const customerId = resolvedParams.id
    const body = await request.json()
    
    // Get current customer
    const { data: currentCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()
    
    if (fetchError || !currentCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      updated_by: authResult.user.id,
      updated_at: new Date().toISOString()
    }
    
    // Update fields if provided
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.customerType !== undefined) updateData.customer_type = body.customerType
    if (body.organizationNumber !== undefined) updateData.organization_number = body.organizationNumber
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.status !== undefined) updateData.status = body.status
    if (body.metadata !== undefined) updateData.metadata = body.metadata
    
    // Validate email if changed
    if (body.email && body.email !== currentCustomer.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', body.email)
        .neq('id', customerId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Customer update error:', updateError)
      throw updateError
    }

    // Transform response
    const transformedCustomer = {
      id: updatedCustomer.id.toString(),
      name: updatedCustomer.name,
      email: updatedCustomer.email || '',
      phone: updatedCustomer.phone || '',
      address: updatedCustomer.address || '',
      customerType: updatedCustomer.customer_type,
      organizationNumber: updatedCustomer.organization_number || null,
      notes: updatedCustomer.notes || '',
      tags: updatedCustomer.tags || [],
      updatedAt: new Date(updatedCustomer.updated_at),
      status: updatedCustomer.status
    }
    
    return NextResponse.json({
      customer: transformedCustomer,
      message: 'Customer updated successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in customer update:', error)
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
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('customers:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const customerId = resolvedParams.id
    
    // Check if customer exists
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .single()
    
    if (fetchError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Check if customer has active bookings/jobs
    const { data: activeJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', customerId)
      .in('status', ['scheduled', 'in_progress'])
      .limit(1)

    if (activeJobs && activeJobs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with active jobs' },
        { status: 400 }
      )
    }
    
    // Soft delete by updating status
    const { error: deleteError } = await supabase
      .from('customers')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString(),
        updated_by: authResult.user.id
      })
      .eq('id', customerId)
    
    if (deleteError) {
      console.error('Customer deletion error:', deleteError)
      throw deleteError
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Customer deleted successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in customer deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}