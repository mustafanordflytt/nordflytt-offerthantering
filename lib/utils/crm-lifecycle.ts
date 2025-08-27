/**
 * Complete CRM Customer Lifecycle Management
 * Ensures all entities are created and linked properly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface CustomerLifecycleResult {
  success: boolean;
  customerId?: string;
  leadId?: string;
  offerId?: string;
  jobId?: string;
  errors?: string[];
}

/**
 * Ensure customer exists in the CRM
 */
export async function ensureCustomerExists(data: {
  name: string;
  email: string;
  phone: string;
  customerType: string;
}): Promise<{ customerId?: string; error?: string }> {
  try {
    console.log('👤 Ensuring customer exists:', data.email);
    
    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('email', data.email)
      .single();
    
    if (existingCustomer) {
      console.log('✅ Customer already exists:', existingCustomer.id);
      return { customerId: existingCustomer.id };
    }
    
    // Create new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        customer_type: data.customerType,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Failed to create customer:', error);
      return { error: error.message };
    }
    
    console.log('✅ Customer created:', newCustomer.id);
    return { customerId: newCustomer.id };
    
  } catch (error) {
    console.error('Error ensuring customer:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Ensure lead exists and is properly linked
 */
export async function ensureLeadExists(data: {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  offerId?: string;
  offerReference?: string;
  services: string[];
  value: number;
  moveDate: string;
  fromAddress: string;
  toAddress: string;
}): Promise<{ leadId?: string; error?: string }> {
  try {
    console.log('📊 Ensuring lead exists for customer:', data.customerId);
    
    // Check if lead already exists for this offer
    if (data.offerId) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, status')
        .eq('customer_id', data.customerId)
        .eq('metadata->>offer_id', data.offerId)
        .single();
      
      if (existingLead) {
        console.log('✅ Lead already exists:', existingLead.id);
        return { leadId: existingLead.id };
      }
    }
    
    // Create new lead with the actual database schema
    const leadData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      services: data.services || ['moving'],
      status: 'Ny', // Swedish status as per existing data
      notes: `Bokningsförfrågan från hemsidan. Tjänster: ${(data.services || []).join(', ')}. Flyttdatum: ${data.moveDate}. Från: ${data.fromAddress} Till: ${data.toAddress}. Referens: ${data.offerReference}`,
      last_activity: new Date().toISOString().split('T')[0], // Date only
      created_at: new Date().toISOString()
    };
    
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Failed to create lead:', error);
      return { error: error.message };
    }
    
    console.log('✅ Lead created:', newLead.id);
    return { leadId: newLead.id };
    
  } catch (error) {
    console.error('Error ensuring lead:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update lead status when offer is accepted
 */
export async function updateLeadToConverted(
  offerId: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Updating lead status to converted for offer:', offerId);
    
    // Find the lead by offer_id in metadata
    const query = supabase
      .from('leads')
      .select('id, status');
    
    // Try multiple search strategies
    let lead = null;
    
    // Strategy 1: Search by exact offer_id in metadata
    const { data: leadByOfferId } = await query
      .eq('metadata->>offer_id', offerId)
      .single();
    
    if (leadByOfferId) {
      lead = leadByOfferId;
    }
    
    // Strategy 2: If we have customer_id, search by that
    if (!lead && customerId) {
      const { data: leadsByCustomer } = await supabase
        .from('leads')
        .select('id, status, metadata')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      // Find the most recent lead that matches
      lead = leadsByCustomer?.find(l => 
        l.metadata?.offer_id === offerId || 
        l.status === 'new' || 
        l.status === 'contacted'
      );
    }
    
    if (!lead) {
      console.log('⚠️ No lead found to update');
      return { success: true }; // Not an error - lead might not exist
    }
    
    // Update lead status to converted
    const { error } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    if (error) {
      console.error('❌ Failed to update lead:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Lead updated to converted:', lead.id);
    return { success: true };
    
  } catch (error) {
    console.error('Error updating lead:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Complete customer lifecycle when booking is created
 */
export async function completeCustomerLifecycle(
  bookingData: any,
  offerId: string,
  offerReference: string
): Promise<CustomerLifecycleResult> {
  const errors: string[] = [];
  let customerId: string | undefined;
  let leadId: string | undefined;
  
  try {
    console.log('🔄 Starting complete customer lifecycle for:', bookingData.email);
    
    // Step 1: Ensure customer exists
    const customerResult = await ensureCustomerExists({
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      customerType: bookingData.customerType
    });
    
    if (customerResult.error) {
      errors.push(`Customer: ${customerResult.error}`);
    } else {
      customerId = customerResult.customerId;
    }
    
    // Step 2: Ensure lead exists
    if (customerId) {
      const leadResult = await ensureLeadExists({
        customerId,
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        offerId,
        offerReference,
        services: bookingData.serviceTypes || [],
        value: bookingData.totalPrice || 0,
        moveDate: bookingData.moveDate,
        fromAddress: bookingData.startAddress,
        toAddress: bookingData.endAddress
      });
      
      if (leadResult.error) {
        errors.push(`Lead: ${leadResult.error}`);
      } else {
        leadId = leadResult.leadId;
      }
    }
    
    // Step 3: Update customer statistics
    if (customerId) {
      await updateCustomerStats();
    }
    
    console.log('✅ Customer lifecycle completed:', {
      customerId,
      leadId,
      offerId
    });
    
    return {
      success: errors.length === 0,
      customerId,
      leadId,
      offerId,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    console.error('Error in customer lifecycle:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Update customer statistics in dashboard
 */
async function updateCustomerStats(): Promise<void> {
  try {
    // This would update any cached statistics
    // For now, the dashboard queries live data
    console.log('📊 Customer statistics will update on next dashboard load');
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}