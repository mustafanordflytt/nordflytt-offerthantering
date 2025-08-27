/**
 * Complete Business Workflow Automation
 * Handles the entire lifecycle from booking to completion
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

// =====================================================
// WORKFLOW STAGES
// =====================================================

export interface WorkflowContext {
  bookingData: any;
  customerId?: string;
  offerId?: string;
  leadId?: string;
  jobId?: string;
  invoiceId?: string;
  errors: string[];
  notifications: any[];
}

/**
 * Stage 1: Customer Creation/Update
 */
export async function processCustomer(ctx: WorkflowContext): Promise<WorkflowContext> {
  try {
    console.log('🔄 Stage 1: Processing customer...');
    
    // Check if customer exists (use existing customers table)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', ctx.bookingData.email)
      .single();
    
    if (existingCustomer) {
      // Update existing customer
      ctx.customerId = existingCustomer.id;
      
      await supabase
        .from('customers')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id);
        
      console.log('✅ Existing customer updated:', existingCustomer.id);
    } else {
      // Create new customer (use existing schema)
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: ctx.bookingData.name,
          email: ctx.bookingData.email,
          phone: ctx.bookingData.phone,
          customer_type: ctx.bookingData.customerType || 'private',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      ctx.customerId = newCustomer.id;
      console.log('✅ New customer created:', newCustomer.id);
    }
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Customer processing failed: ${error}`);
    console.error('❌ Customer processing error:', error);
    return ctx;
  }
}

/**
 * Stage 2: Offer Creation
 */
export async function createOffer(ctx: WorkflowContext): Promise<WorkflowContext> {
  if (!ctx.customerId) {
    ctx.errors.push('Cannot create offer without customer');
    return ctx;
  }
  
  try {
    console.log('🔄 Stage 2: Creating offer/booking...');
    
    // Since offers table doesn't exist, create booking directly
    const bookingData = {
      customer_id: ctx.customerId,
      customer_email: ctx.bookingData.email,
      customer_phone: ctx.bookingData.phone,
      service_type: ctx.bookingData.serviceType || 'moving',
      service_types: ctx.bookingData.serviceTypes || ['moving'],
      move_date: ctx.bookingData.moveDate,
      move_time: ctx.bookingData.moveTime || '09:00',
      start_address: ctx.bookingData.startAddress,
      end_address: ctx.bookingData.endAddress,
      start_living_area: ctx.bookingData.startLivingArea,
      end_living_area: ctx.bookingData.endLivingArea,
      start_floor: ctx.bookingData.startFloor,
      end_floor: ctx.bookingData.endFloor,
      start_elevator: ctx.bookingData.startElevator || false,
      end_elevator: ctx.bookingData.endElevator || false,
      start_parking_distance: ctx.bookingData.startParkingDistance,
      end_parking_distance: ctx.bookingData.endParkingDistance,
      additional_services: ctx.bookingData.additionalServices || [],
      special_instructions: ctx.bookingData.specialInstructions || '',
      total_price: ctx.bookingData.totalPrice || 5000,
      status: 'pending',
      details: {
        ...ctx.bookingData,
        customerName: ctx.bookingData.name,
        reference: ctx.bookingData.reference || Date.now().toString(),
        movingBoxes: ctx.bookingData.movingBoxes || 0,
        rentalBoxes: ctx.bookingData.rentalBoxes || {},
        needsMovingBoxes: ctx.bookingData.needsMovingBoxes !== false
      },
      created_at: new Date().toISOString()
    };
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('id')
      .single();
    
    if (error) throw error;
    
    ctx.offerId = booking.id;
    console.log('✅ Booking created:', booking.id);
    
    // Add notification
    ctx.notifications.push({
      type: 'booking_created',
      bookingId: booking.id
    });
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Booking creation failed: ${error}`);
    console.error('❌ Booking creation error:', error);
    return ctx;
  }
}

/**
 * Stage 3: Lead Management
 */
export async function manageLead(ctx: WorkflowContext): Promise<WorkflowContext> {
  if (!ctx.customerId) return ctx;
  
  try {
    console.log('🔄 Stage 3: Managing lead...');
    
    // Check for existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', ctx.bookingData.email)
      .single();
    
    if (existingLead) {
      // Update existing lead status
      await supabase
        .from('leads')
        .update({
          status: 'Kvalificerad',
          last_activity: new Date().toISOString().split('T')[0]
        })
        .eq('id', existingLead.id);
        
      ctx.leadId = existingLead.id;
      console.log('✅ Lead updated to qualified');
    } else {
      // Create new lead
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          name: ctx.bookingData.name,
          email: ctx.bookingData.email,
          phone: ctx.bookingData.phone,
          services: ctx.bookingData.serviceTypes || ['moving'],
          status: 'Kvalificerad',
          notes: `Offert skickad: ${ctx.offerId}. Flyttdatum: ${ctx.bookingData.moveDate}`,
          last_activity: new Date().toISOString().split('T')[0]
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      ctx.leadId = newLead.id;
      console.log('✅ New qualified lead created');
    }
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Lead management failed: ${error}`);
    console.error('❌ Lead management error:', error);
    return ctx;
  }
}

/**
 * Stage 4: Job Creation (when offer is accepted)
 */
export async function createJob(ctx: WorkflowContext): Promise<WorkflowContext> {
  if (!ctx.customerId || !ctx.offerId) return ctx;
  
  try {
    console.log('🔄 Stage 4: Creating job...');
    
    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', ctx.offerId)
      .single();
    
    if (!booking) {
      ctx.errors.push('Booking not found');
      return ctx;
    }
    
    // Generate job number
    const jobNumber = 'JOB' + Date.now().toString().slice(-8);
    
    // Use the actual jobs table schema
    // Include booking ID in title for reference
    const jobData = {
      customer_id: ctx.customerId,
      title: `${jobNumber} - Flytt ${ctx.bookingData.name} [${ctx.offerId}]`,
      status: 'pending',
      scheduled_date: booking.move_date,
      created_at: new Date().toISOString()
    };
    
    console.log('🔧 Attempting to create job with data:', jobData);
    
    const { data: job, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Job creation failed:', error);
      throw error;
    }
    
    ctx.jobId = job.id;
    console.log('✅ Job created:', jobNumber);
    
    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed'
      })
      .eq('id', ctx.offerId);
    
    // Update lead status if exists
    if (ctx.leadId) {
      await supabase
        .from('leads')
        .update({
          status: 'Vunnen',
          last_activity: new Date().toISOString().split('T')[0]
        })
        .eq('id', ctx.leadId);
    }
    
    // Add notification
    ctx.notifications.push({
      type: 'job_created',
      jobId: job.id,
      jobNumber: jobNumber
    });
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Job creation failed: ${error}`);
    console.error('❌ Job creation error:', error);
    return ctx;
  }
}

/**
 * Stage 5: Team Assignment
 */
export async function assignTeam(ctx: WorkflowContext): Promise<WorkflowContext> {
  if (!ctx.jobId) return ctx;
  
  try {
    console.log('🔄 Stage 5: Team assignment (skipped - staff table not available)');
    
    // Skip team assignment since staff table doesn't exist
    // Just add mock team assignment for workflow completion
    ctx.notifications.push({
      type: 'team_assigned',
      jobId: ctx.jobId,
      teamMembers: [
        { id: 'mock-1', name: 'Anders Andersson', role: 'team_leader' },
        { id: 'mock-2', name: 'Björn Björnsson', role: 'mover' }
      ]
    });
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Team assignment failed: ${error}`);
    console.error('❌ Team assignment error:', error);
    return ctx;
  }
}

/**
 * Stage 6: Send Notifications
 */
export async function sendNotifications(ctx: WorkflowContext): Promise<WorkflowContext> {
  try {
    console.log('🔄 Stage 6: Notifications (logged only - notifications table not available)');
    
    // Since notifications table doesn't exist, just log them
    console.log('📧 Notifications that would be sent:', ctx.notifications);
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Notification processing failed: ${error}`);
    console.error('❌ Notification error:', error);
    return ctx;
  }
}

/**
 * Stage 7: Update Statistics
 */
export async function updateStatistics(ctx: WorkflowContext): Promise<WorkflowContext> {
  try {
    console.log('🔄 Stage 7: Statistics update (skipped - enhanced tables not available)');
    
    console.log('✅ Workflow statistics:', {
      customerId: ctx.customerId,
      bookingId: ctx.offerId,
      leadId: ctx.leadId,
      jobId: ctx.jobId,
      totalPrice: ctx.bookingData.totalPrice
    });
    
    return ctx;
  } catch (error) {
    ctx.errors.push(`Statistics update failed: ${error}`);
    console.error('❌ Statistics error:', error);
    return ctx;
  }
}

// =====================================================
// MAIN WORKFLOW EXECUTION
// =====================================================

export async function executeCompleteWorkflow(bookingData: any): Promise<WorkflowContext> {
  console.log('🚀 Starting complete business workflow...');
  
  let ctx: WorkflowContext = {
    bookingData,
    errors: [],
    notifications: []
  };
  
  // Execute workflow stages in sequence
  ctx = await processCustomer(ctx);
  ctx = await createOffer(ctx);
  ctx = await manageLead(ctx);
  
  // Always create job for visibility in staff app
  ctx = await createJob(ctx);
  ctx = await assignTeam(ctx);
  
  ctx = await sendNotifications(ctx);
  ctx = await updateStatistics(ctx);
  
  // Log summary
  console.log('✅ Workflow completed:', {
    customerId: ctx.customerId,
    offerId: ctx.offerId,
    leadId: ctx.leadId,
    jobId: ctx.jobId,
    errors: ctx.errors.length,
    notifications: ctx.notifications.length
  });
  
  return ctx;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function calculateVolume(bookingData: any): number {
  // Simple volume calculation based on living area
  const avgArea = ((parseFloat(bookingData.startLivingArea) || 70) + 
                   (parseFloat(bookingData.endLivingArea) || 70)) / 2;
  return Math.round(avgArea * 0.4); // Rough estimate: 0.4 m³ per m²
}

// =====================================================
// WORKFLOW HOOKS FOR REAL-TIME UPDATES
// =====================================================

export async function onOfferAccepted(offerId: string): Promise<void> {
  console.log('🎯 Offer accepted, triggering job creation...');
  
  const { data: offer } = await supabase
    .from('offers_enhanced')
    .select('*, customer:customers_enhanced(*)')
    .eq('id', offerId)
    .single();
  
  if (offer) {
    const ctx = await executeCompleteWorkflow({
      ...offer,
      autoAccept: true,
      name: offer.customer.name,
      email: offer.customer.email,
      phone: offer.customer.phone
    });
    
    console.log('✅ Job workflow completed for accepted offer');
  }
}

export async function onJobCompleted(jobId: string): Promise<void> {
  console.log('🎯 Job completed, triggering invoice creation...');
  
  const { data: job } = await supabase
    .from('jobs_enhanced')
    .select('*')
    .eq('id', jobId)
    .single();
  
  if (job) {
    // Create invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        customer_id: job.customer_id,
        job_id: job.id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        line_items: [{
          description: `Flyttjänst ${job.from_address} - ${job.to_address}`,
          quantity: 1,
          unit_price: job.final_price || 5000,
          vat_rate: 25,
          total: job.final_price || 5000
        }],
        subtotal: job.final_price || 5000,
        vat_amount: (job.final_price || 5000) * 0.25,
        total_amount: (job.final_price || 5000) * 1.25,
        payment_status: 'pending'
      })
      .select('id, invoice_number')
      .single();
    
    if (invoice) {
      console.log('✅ Invoice created:', invoice.invoice_number);
      
      // Send invoice notification
      await supabase
        .from('notifications')
        .insert({
          user_id: job.customer_id,
          user_type: 'customer',
          title: 'Faktura skickad',
          message: `Faktura ${invoice.invoice_number} har skickats för ditt slutförda uppdrag.`,
          type: 'info',
          category: 'payment',
          related_id: invoice.id,
          related_type: 'invoice'
        });
    }
  }
}