import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const resolvedParams = await params
    const leadId = resolvedParams.id
    const body = await request.json()
    
    // Mock leads data to find the lead to convert
    const mockLeads = [
      {
        id: 'lead-001',
        name: 'Anna Svensson',
        email: 'anna.svensson@email.com',
        phone: '+46 70 123 45 67',
        source: 'website',
        status: 'new',
        priority: 'medium',
        estimatedValue: 8500,
        expectedCloseDate: new Date('2025-07-15'),
        assignedTo: 'admin',
        notes: 'Intresserad av stora flytten för 3:a i Stockholm',
        createdAt: new Date('2025-06-25'),
        updatedAt: new Date('2025-06-28')
      },
      {
        id: 'lead-002', 
        name: 'Erik Johansson AB',
        email: 'erik@johansson-ab.se',
        phone: '+46 8 555 123 45',
        source: 'referral',
        status: 'contacted',
        priority: 'high',
        estimatedValue: 25000,
        expectedCloseDate: new Date('2025-07-10'),
        assignedTo: 'admin',
        notes: 'Företagsflytt, 50 anställda, kontorslokaler',
        createdAt: new Date('2025-06-20'),
        updatedAt: new Date('2025-06-29')
      },
      {
        id: 'lead-003',
        name: 'Maria Lindqvist',
        email: 'maria.lindqvist@gmail.com', 
        phone: '+46 73 987 65 43',
        source: 'marketing',
        status: 'qualified',
        priority: 'high',
        estimatedValue: 12000,
        expectedCloseDate: new Date('2025-07-05'),
        assignedTo: 'admin',
        notes: 'Behöver städning och packning, villa till lägenhet',
        createdAt: new Date('2025-06-18'),
        updatedAt: new Date('2025-06-30')
      },
      {
        id: 'lead-004',
        name: 'Petras Villaservice',
        email: 'info@petrasvillaservice.se',
        phone: '+46 70 444 55 66',
        source: 'cold_call',
        status: 'proposal',
        priority: 'medium',
        estimatedValue: 15000,
        expectedCloseDate: new Date('2025-07-20'),
        assignedTo: 'admin',
        notes: 'Återkommande partner för kundernas flyttar',
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-06-29')
      },
      {
        id: 'lead-005',
        name: 'Stockholm Housing Corp',
        email: 'procurement@stockholmhousing.com',
        phone: '+46 8 123 456 78',
        source: 'other',
        status: 'negotiation', 
        priority: 'high',
        estimatedValue: 45000,
        expectedCloseDate: new Date('2025-08-01'),
        assignedTo: 'admin',
        notes: 'Ramavtal för hyresgäster, stort volymkontrakt',
        createdAt: new Date('2025-06-10'),
        updatedAt: new Date('2025-06-30')
      }
    ]
    
    // Find the lead to convert
    const lead = mockLeads.find(l => l.id === leadId)
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Check if lead can be converted (should be qualified or beyond)
    const convertibleStatuses = ['qualified', 'proposal', 'negotiation']
    if (!convertibleStatuses.includes(lead.status)) {
      return NextResponse.json(
        { error: 'Lead must be qualified before conversion' },
        { status: 400 }
      )
    }
    
    // Check if customer with this email already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('email', lead.email)
      .single()
    
    if (existingCustomer) {
      return NextResponse.json(
        { 
          error: 'Customer with this email already exists',
          existingCustomer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            email: existingCustomer.email
          }
        },
        { status: 409 }
      )
    }
    
    // Determine customer type based on lead name and notes
    const isBusinessCustomer = lead.name.includes('AB') || 
                              lead.name.includes('Corp') || 
                              lead.notes.toLowerCase().includes('företag') ||
                              lead.notes.toLowerCase().includes('kontors')
    
    const customerType = isBusinessCustomer ? 'business' : 'private'
    
    // Create customer in database
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        customer_type: customerType,
        notes: `Konverterad från lead ${leadId}. Original anteckningar: ${lead.notes}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (customerError) {
      console.error('Error creating customer:', customerError)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }
    
    // If conversion includes creating a booking (optional)
    let newBooking = null
    if (body.createBooking && body.bookingDetails) {
      const { bookingDetails } = body
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: newCustomer.id,
          service_type: bookingDetails.serviceType || 'moving',
          service_types: bookingDetails.serviceTypes || ['moving'],
          move_date: bookingDetails.moveDate || null,
          move_time: bookingDetails.moveTime || '13:00',
          start_address: bookingDetails.startAddress || null,
          end_address: bookingDetails.endAddress || null,
          status: 'pending',
          total_price: lead.estimatedValue || 0,
          details: {
            ...bookingDetails,
            convertedFromLead: leadId,
            originalLeadValue: lead.estimatedValue
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        // Don't fail the conversion if booking creation fails
        // The customer is already created successfully
      } else {
        newBooking = booking
      }
    }
    
    // In real implementation, mark lead as converted
    // const { error: leadUpdateError } = await supabase
    //   .from('leads')
    //   .update({
    //     status: 'won',
    //     converted_to_customer_id: newCustomer.id,
    //     conversion_date: new Date().toISOString(),
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', leadId)
    
    // Transform customer data to CRM format
    const transformedCustomer = {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: '',
      customerType: newCustomer.customer_type === 'business' ? 'business' : 'private',
      notes: newCustomer.notes || '',
      createdAt: new Date(newCustomer.created_at),
      updatedAt: new Date(newCustomer.updated_at),
      bookingCount: newBooking ? 1 : 0,
      totalValue: newBooking ? newBooking.total_price : 0,
      lastBooking: newBooking ? new Date(newBooking.created_at) : null,
      status: 'active' as const
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lead converted successfully',
      customer: transformedCustomer,
      booking: newBooking ? {
        id: newBooking.id,
        bookingNumber: `NF-${newBooking.id.slice(0, 8).toUpperCase()}`,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        fromAddress: newBooking.start_address || '',
        toAddress: newBooking.end_address || '',
        moveDate: new Date(newBooking.move_date || Date.now()),
        moveTime: newBooking.move_time || '13:00',
        status: 'scheduled' as const,
        priority: 'medium' as const,
        assignedStaff: [],
        estimatedHours: 4,
        actualHours: null,
        totalPrice: newBooking.total_price || 0,
        services: newBooking.service_types || [],
        notes: '',
        createdAt: new Date(newBooking.created_at),
        updatedAt: new Date(newBooking.created_at)
      } : null,
      leadId: leadId,
      conversionDate: new Date()
    }, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in lead conversion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}