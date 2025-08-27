import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createLeadFromBooking(bookingData: any, customerId: string | null) {
  try {
    console.log('Creating lead from booking...');
    
    // Check if lead already exists for this customer
    if (customerId) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('customer_id', customerId)
        .single();
      
      if (existingLead) {
        console.log('Lead already exists for customer');
        return { success: true, leadId: existingLead.id };
      }
    }
    
    // Create new lead
    const leadData = {
      customer_id: customerId,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      source: 'website_form',
      status: 'new',
      priority: 'high', // High priority since they submitted a booking
      services_interested: bookingData.serviceTypes || ['moving'],
      estimated_value: bookingData.totalPrice || 0,
      notes: `Booking request submitted. Services: ${(bookingData.serviceTypes || []).join(', ')}. Special instructions: ${bookingData.specialInstructions || 'None'}`,
      metadata: {
        moveDate: bookingData.moveDate,
        fromAddress: bookingData.startAddress,
        toAddress: bookingData.endAddress,
        bookingReference: bookingData.reference
      }
    };
    
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating lead:', error);
      return { success: false, error };
    }
    
    console.log('Lead created successfully:', lead.id);
    return { success: true, leadId: lead.id };
    
  } catch (error) {
    console.error('Failed to create lead:', error);
    return { success: false, error };
  }
}