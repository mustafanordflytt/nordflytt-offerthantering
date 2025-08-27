import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// POST /api/quote-requests - Process quote request from offertformulär
export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log('📋 Processing quote request:', formData);

    // Check if Supabase is configured
    if (!supabase) {
      console.log('⚠️ Supabase not configured, returning mock response');
      return NextResponse.json({
        success: true,
        customer: {
          id: 'mock-customer-id',
          name: formData.name || 'Test Kund',
          email: formData.email || 'test@example.com'
        },
        lead: {
          id: 'mock-lead-id',
          status: 'new'
        },
        quote: {
          id: 'mock-quote-id',
          quote_number: `Q-MOCK-${Date.now()}`
        },
        message: 'Din offertförfrågan har mottagits (demo-läge). Vi återkommer inom kort!'
      }, { status: 201 });
    }

    // 1. Create or find customer
    let customer;
    
    // Check if customer exists by email
    if (formData.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', formData.email)
        .single();
      
      if (existingCustomer) {
        customer = existingCustomer;
        console.log('✅ Found existing customer:', customer.id);
        
        // Update customer info if provided
        const updates: any = {};
        if (formData.phone && !customer.phone) updates.phone = formData.phone;
        if (formData.address && !customer.address) updates.address = formData.address;
        if (formData.city && !customer.city) updates.city = formData.city;
        if (formData.postal_code && !customer.postal_code) updates.postal_code = formData.postal_code;
        
        if (Object.keys(updates).length > 0) {
          const { data: updatedCustomer } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', customer.id)
            .select()
            .single();
          
          if (updatedCustomer) customer = updatedCustomer;
        }
      }
    }
    
    // Create new customer if not found
    if (!customer) {
      // Prepare customer data for existing table structure
      const customerData: any = {
        name: formData.name || formData.firstName + ' ' + formData.lastName || 'Okänd kund',
        email: formData.email || null,
        phone: formData.phone || null,
        customer_type: formData.customerType || 'private'
      };

      // Store address info in notes field as JSON
      const addressInfo: any = {};
      if (formData.address || formData.moveFromAddress) {
        addressInfo.address = formData.address || formData.moveFromAddress;
      }
      if (formData.city || formData.moveFromCity) {
        addressInfo.city = formData.city || formData.moveFromCity;
      }
      if (formData.postal_code || formData.moveFromPostalCode) {
        addressInfo.postal_code = formData.postal_code || formData.moveFromPostalCode;
      }
      if (formData.moveToAddress) {
        addressInfo.move_to_address = formData.moveToAddress;
      }
      if (formData.additionalInfo) {
        addressInfo.additional_info = formData.additionalInfo;
      }

      if (Object.keys(addressInfo).length > 0) {
        customerData.notes = JSON.stringify(addressInfo);
      }

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      
      if (customerError) {
        console.error('❌ Error creating customer:', customerError);
        throw new Error('Failed to create customer');
      }
      
      customer = newCustomer;
      console.log('✅ Created new customer:', customer.id);
    }

    // 2. Create lead with the actual table structure
    const leadNotes = [];
    if (formData.moveFromAddress) leadNotes.push(`Från: ${formData.moveFromAddress}`);
    if (formData.moveToAddress) leadNotes.push(`Till: ${formData.moveToAddress}`);
    if (formData.apartmentSize) leadNotes.push(`Storlek: ${formData.apartmentSize}`);
    if (formData.moveDate) leadNotes.push(`Datum: ${formData.moveDate}`);
    if (formData.additionalInfo) leadNotes.push(`Info: ${formData.additionalInfo}`);
    leadNotes.push(`Kund-ID: ${customer.id}`); // Store customer reference in notes

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([{
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        services: ['moving'], // Default service
        status: 'Ny', // Match existing status format
        notes: leadNotes.join('\n'),
        last_activity: new Date().toISOString().split('T')[0] // Today's date
      }])
      .select()
      .single();
    
    if (leadError) {
      console.error('❌ Error creating lead:', leadError);
      throw new Error('Failed to create lead');
    }
    
    console.log('✅ Created lead:', lead.id);

    // 3. Create quote
    const lineItems = [];
    
    // Add main service
    if (formData.serviceType || formData.services) {
      const mainService = formData.serviceType || formData.services?.[0] || 'Flyttjänst';
      lineItems.push({
        description: mainService,
        quantity: 1,
        unit_price: formData.estimatedValue || 0,
        total: formData.estimatedValue || 0
      });
    }
    
    // Add additional services
    if (formData.additionalServices && Array.isArray(formData.additionalServices)) {
      formData.additionalServices.forEach((service: string) => {
        lineItems.push({
          description: service,
          quantity: 1,
          unit_price: 0,
          total: 0
        });
      });
    }

    const quoteTitle = formData.serviceType || 
                      (formData.moveFromCity && formData.moveToCity ? 
                        `Flytt ${formData.moveFromCity} - ${formData.moveToCity}` : 
                        'Offertförfrågan');

    // Prepare quote data matching actual table structure
    const services = ['Flyttjänst']; // Default service
    if (formData.additionalServices && Array.isArray(formData.additionalServices)) {
      services.push(...formData.additionalServices);
    }

    const quoteDetails = {
      quote_number: `Q-${Date.now()}`,
      title: quoteTitle,
      customer_name: customer.name,
      customer_email: customer.email,
      lead_id: lead.id,
      from_address: formData.moveFromAddress,
      to_address: formData.moveToAddress,
      move_date: formData.moveDate,
      apartment_size: formData.apartmentSize,
      additional_info: formData.additionalInfo,
      line_items: lineItems
    };

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        customer_id: customer.id,
        services: services,
        value: formData.estimatedValue || 15000, // Default estimate
        status: 'Väntande', // Match existing status format
        date: new Date().toISOString().split('T')[0], // Today's date
        details: JSON.stringify(quoteDetails),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days
      }])
      .select()
      .single();
    
    if (quoteError) {
      console.error('❌ Error creating quote:', quoteError);
      throw new Error('Failed to create quote');
    }
    
    const quoteNumber = JSON.parse(quote.details || '{}').quote_number || quote.id;
    console.log('✅ Created quote:', quoteNumber);

    // 4. Send confirmation (mock for now)
    console.log('📧 Would send confirmation email to:', customer.email);

    // Return success response
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      lead: {
        id: lead.id,
        status: lead.status
      },
      quote: {
        id: quote.id,
        quote_number: quoteNumber
      },
      message: 'Din offertförfrågan har mottagits och bearbetas. Vi återkommer inom kort!'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Quote request error:', error);
    
    // Return user-friendly error
    return NextResponse.json({
      success: false,
      error: 'Ett fel uppstod vid behandling av din förfrågan. Vänligen försök igen eller kontakta oss direkt.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}