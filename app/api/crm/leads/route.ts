import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// Helper function to get demo leads
function getDemoLeads() {
  return [
    {
      id: '1',
      name: 'Anna Andersson',
      email: 'anna@example.com',
      phone: '070-123-4567',
      source: 'website',
      status: 'new',
      priority: 'high',
      estimatedValue: 15000,
      expectedCloseDate: null,
      assignedTo: null,
      notes: 'Flytt från 3:a i Stockholm till Göteborg. Från: Drottninggatan 50, 11121 Stockholm. Till: Avenyn 10, 41136 Göteborg. Flyttdatum: 2025-07-15',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
      activities: [],
      leadScore: 75,
      tags: ['privat', 'stockholm'],
      companyName: null,
      customerId: null,
      offerId: null
    },
    {
      id: '2',
      name: 'Företaget AB',
      email: 'info@foretaget.se',
      phone: '08-123-4567',
      source: 'referral',
      status: 'contacted',
      priority: 'medium',
      estimatedValue: 45000,
      expectedCloseDate: new Date('2025-02-15'),
      assignedTo: 'Johan Svensson',
      notes: 'Kontorsflytt, ca 20 arbetsplatser. Behöver packtjänst.',
      createdAt: new Date('2025-01-18'),
      updatedAt: new Date('2025-01-19'),
      activities: [
        {
          id: '1',
          type: 'call',
          title: 'Första kontakt',
          description: 'Diskuterade behov och tidplan',
          completed: true,
          date: new Date('2025-01-19')
        }
      ],
      leadScore: 85,
      tags: ['företag', 'kontor'],
      companyName: 'Företaget AB',
      customerId: null,
      offerId: null
    },
    {
      id: '3',
      name: 'Maria Johansson',
      email: 'maria.j@gmail.com',
      phone: '073-555-1234',
      source: 'flytta.se',
      status: 'qualified',
      priority: 'high',
      estimatedValue: 22000,
      expectedCloseDate: new Date('2025-02-01'),
      assignedTo: null,
      notes: 'Lead från Flytta.se. Behöver flytthjälp med packning. 2:a på 65 kvm.',
      createdAt: new Date('2025-01-21'),
      updatedAt: new Date('2025-01-21'),
      activities: [],
      leadScore: 90,
      tags: ['partner-lead', 'packning'],
      companyName: null,
      customerId: null,
      offerId: null
    },
    {
      id: '4',
      name: 'Tech Startup AB',
      email: 'move@techstartup.se',
      phone: '08-999-8888',
      source: 'marketing',
      status: 'proposal',
      priority: 'high',
      estimatedValue: 75000,
      expectedCloseDate: new Date('2025-03-01'),
      assignedTo: 'Johan Svensson',
      notes: 'Expanderar och behöver flytta till större kontor. 50 arbetsplatser.',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-22'),
      activities: [
        {
          id: '2',
          type: 'meeting',
          title: 'Offertgenomgång',
          description: 'Presenterade offert, väntar på beslut',
          completed: true,
          date: new Date('2025-01-22')
        }
      ],
      leadScore: 95,
      tags: ['tech', 'expansion', 'prioritet'],
      companyName: 'Tech Startup AB',
      customerId: null,
      offerId: 'OFF-2025-0001'
    }
  ];
}

// Helper function to calculate stats
function calculateStats(leads: any[]) {
  return {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    contactedLeads: leads.filter(l => l.status === 'contacted').length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    proposalLeads: leads.filter(l => l.status === 'proposal').length,
    wonLeads: leads.filter(l => l.status === 'closed_won').length,
    lostLeads: leads.filter(l => l.status === 'closed_lost').length,
    totalValue: leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
    avgLeadScore: leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leads.length)
      : 0,
    conversionRate: leads.length > 0
      ? Math.round((leads.filter(l => l.status === 'closed_won').length / leads.length) * 100)
      : 0
  };
}

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request);
    
    // In development, allow unauthenticated access with demo data
    if (process.env.NODE_ENV === 'development' && (!authResult.isValid || !authResult.user)) {
      console.log('Development mode: Using demo data for unauthenticated request');
      const demoLeads = getDemoLeads();
      return NextResponse.json({
        success: true,
        leads: demoLeads,
        stats: calculateStats(demoLeads),
        page: 1,
        limit: 50,
        total: demoLeads.length
      });
    }
    
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!authResult.permissions.includes('leads:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // If Supabase is not configured, return demo data
    if (!supabase) {
      const demoLeads = getDemoLeads();
      return NextResponse.json({
        success: true,
        leads: demoLeads,
        stats: calculateStats(demoLeads),
        page: 1,
        limit: 50,
        total: demoLeads.length
      });
    }
    
    // Get query parameters for filtering with validation
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status')?.slice(0, 50); // Limit length
    const source = searchParams.get('source')?.slice(0, 50);
    const assignedTo = searchParams.get('assignedTo')?.slice(0, 100);
    const priority = searchParams.get('priority')?.slice(0, 20);
    const search = searchParams.get('search')?.slice(0, 200)?.replace(/[<>]/g, ''); // Remove potential XSS
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam) || 50), 100) : 50; // Between 1-100
    const pageParam = searchParams.get('page') || '1';
    const page = Math.max(1, parseInt(pageParam) || 1); // Minimum 1

    // Try to query database
    let leads: any[] | null = null;
    let error: any = null;
    
    try {
      // Build query
      let query = supabase
        .from('leads')
        .select(`
          *,
          customer:customers(
            id,
            customer_name,
            customer_email,
            customer_phone
          ),
          lead_activities(
            id,
            type,
            title,
            description,
            completed,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (assignedTo && assignedTo !== 'all') {
      query = query.eq('assigned_to', assignedTo);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const result = await query;
      leads = result.data;
      error = result.error;
    } catch (e: any) {
      error = e;
      console.error('Query error:', e);
    }

    if (error || !leads) {
      console.error('Database error:', error);
      
      // Return demo data as fallback
      console.log('Using demo data due to database error');
      const demoLeads = getDemoLeads();
      return NextResponse.json({
        success: true,
        leads: demoLeads,
        stats: calculateStats(demoLeads),
        page: 1,
        limit: 50,
        total: demoLeads.length
      });
    }

    // Get assigned users for display names
    const assignedUserIds = [...new Set(leads?.map(l => l.assigned_to).filter(Boolean) || [])];
    let assignedUsers: Record<string, any> = {};
    
    if (assignedUserIds.length > 0 && supabase) {
      const { data: users } = await supabase
        .from('crm_users')
        .select('id, name, email')
        .in('id', assignedUserIds);
      
      assignedUsers = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
    }

    // Transform leads to consistent format matching frontend expectations
    const transformedLeads = (leads || []).map(lead => ({
      id: lead.id.toString(),
      name: lead.name || lead.customer?.customer_name || 'Unknown',
      email: lead.email || lead.customer?.customer_email || '',
      phone: lead.phone || lead.customer?.customer_phone || '',
      source: lead.source || 'website',
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      estimatedValue: lead.estimated_value || 0,
      expectedCloseDate: lead.expected_close_date ? new Date(lead.expected_close_date) : null,
      assignedTo: assignedUsers[lead.assigned_to]?.name || lead.assigned_to || null,
      notes: lead.notes || '',
      createdAt: new Date(lead.created_at),
      updatedAt: new Date(lead.updated_at || lead.created_at),
      activities: lead.lead_activities?.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        completed: activity.completed,
        date: new Date(activity.created_at)
      })) || [],
      leadScore: lead.lead_score || 0,
      tags: lead.tags || [],
      companyName: lead.company_name || null,
      customerId: lead.customer_id,
      offerId: lead.offer_id
    }));

    console.log(`Found ${transformedLeads.length} leads from database`);

    // Calculate statistics
    const stats = {
      totalLeads: transformedLeads.length,
      newLeads: transformedLeads.filter(l => l.status === 'new').length,
      contactedLeads: transformedLeads.filter(l => l.status === 'contacted').length,
      qualifiedLeads: transformedLeads.filter(l => l.status === 'qualified').length,
      proposalLeads: transformedLeads.filter(l => l.status === 'proposal').length,
      wonLeads: transformedLeads.filter(l => l.status === 'closed_won').length,
      lostLeads: transformedLeads.filter(l => l.status === 'closed_lost').length,
      totalValue: transformedLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
      avgLeadScore: transformedLeads.length > 0 
        ? Math.round(transformedLeads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / transformedLeads.length)
        : 0,
      conversionRate: transformedLeads.length > 0
        ? Math.round((transformedLeads.filter(l => l.status === 'closed_won').length / transformedLeads.length) * 100)
        : 0
    };

    return NextResponse.json({
      success: true,
      leads: transformedLeads,
      stats,
      page: page,
      limit: limit,
      total: transformedLeads.length
    });
  } catch (error: any) {
    console.error('Leads API error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leads',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request);
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!authResult.permissions.includes('leads:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    const { name, email, phone, source, notes } = body;
    
    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Name and either email or phone are required' },
        { status: 400 }
      );
    }

    // Validate and sanitize email if provided
    if (email) {
      const sanitizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(sanitizedEmail) || sanitizedEmail.length > 254) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }
    
    // Validate phone number if provided
    if (phone) {
      const sanitizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^(\+46|0)?[0-9]{7,15}$/.test(sanitizedPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }
    
    // Validate name
    if (name.length > 200 || name.length < 2) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 200 characters' },
        { status: 400 }
      );
    }

    // Generate unique lead ID
    const leadCount = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });
    
    const nextId = (leadCount.count || 0) + 1;
    const leadId = `LEAD${nextId.toString().padStart(6, '0')}`;

    // Sanitize input data
    const sanitize = (str: string | null | undefined, maxLength: number = 500): string | null => {
      if (!str) return null;
      return str.toString().slice(0, maxLength).replace(/[<>]/g, '').trim();
    };
    
    // Prepare lead data with sanitization
    const leadData = {
      lead_id: leadId,
      name: sanitize(name, 200)!,
      email: email ? email.trim().toLowerCase() : null,
      phone: phone ? phone.replace(/[\s\-\(\)]/g, '') : null,
      company_name: sanitize(body.companyName, 200),
      source: ['website', 'referral', 'marketing', 'cold_call', 'flyttfirma24', 'flytta.se', 'other'].includes(source) 
        ? source : 'website',
      status: 'new',
      priority: ['low', 'medium', 'high'].includes(body.priority) ? body.priority : 'medium',
      estimated_value: Math.max(0, Math.min(body.estimatedValue || 0, 10000000)), // Max 10M
      expected_close_date: body.expectedCloseDate || null,
      assigned_to: sanitize(body.assignedTo, 100),
      notes: sanitize(notes, 5000), // Longer for notes
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10).map((t: any) => sanitize(t, 50)) : [],
      metadata: typeof body.metadata === 'object' ? body.metadata : {},
      created_by: authResult.user.id,
      updated_by: authResult.user.id
    };

    // Use transaction for atomic lead creation
    const { data: transactionResult, error: transactionError } = await supabase
      .rpc('create_lead_with_transaction', {
        lead_data: leadData,
        initial_note: notes || null,
        source_tracking: body.sourceDetails || null
      });

    if (transactionError) {
      console.error('Lead creation error:', transactionError);
      if (transactionError.code === '23505') {
        return NextResponse.json(
          { error: 'Lead with this email already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: transactionError.message || 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Fetch the created lead with all relations
    const { data: newLead, error: fetchError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_activities(*)
      `)
      .eq('id', transactionResult.lead_id)
      .single();

    if (fetchError || !newLead) {
      console.error('Error fetching created lead:', fetchError);
      return NextResponse.json(
        { error: 'Lead created but could not fetch details' },
        { status: 500 }
      );
    }

    // Auto-assign if enabled
    if (!body.assignedTo && body.autoAssign) {
      const { data: autoAssignResult } = await supabase
        .rpc('auto_assign_lead', { p_lead_id: newLead.id });
      
      if (autoAssignResult) {
        newLead.assigned_to = autoAssignResult;
      }
    }

    // Transform response
    const transformedLead = {
      id: newLead.id.toString(),
      name: newLead.name,
      email: newLead.email || '',
      phone: newLead.phone || '',
      source: newLead.source,
      status: newLead.status,
      priority: newLead.priority,
      estimatedValue: newLead.estimated_value,
      expectedCloseDate: newLead.expected_close_date ? new Date(newLead.expected_close_date) : null,
      assignedTo: newLead.assigned_to,
      notes: newLead.notes || '',
      createdAt: new Date(newLead.created_at),
      updatedAt: new Date(newLead.updated_at || newLead.created_at),
      activities: [],
      leadScore: newLead.lead_score || 0,
      tags: newLead.tags || [],
      companyName: newLead.company_name || null
    };

    // Automatically process lead to create offer if autoCreateOffer is true
    // or if the lead source indicates it should be auto-processed
    const shouldAutoProcess = body.autoCreateOffer || 
      ['flyttfirma24', 'flytta.se', 'email_lead'].includes(newLead.source);
    
    let offerResult = null;
    if (shouldAutoProcess && notes) {
      try {
        // Import lead processor
        const { leadProcessor } = await import('@/lib/lead-processor');
        
        // Check if we have enough data to auto-process
        if (leadProcessor.canAutoProcess(notes)) {
          // Process the lead
          const processingResult = await leadProcessor.processLead({
            id: newLead.id.toString(),
            text: notes,
            source: newLead.source
          });
          
          if (processingResult.success) {
            // Update lead with offer reference
            await supabase
              .from('leads')
              .update({
                offer_id: processingResult.offerId,
                status: 'proposal',
                updated_at: new Date().toISOString()
              })
              .eq('id', newLead.id);
            
            transformedLead.status = 'proposal';
            offerResult = processingResult;
            
            // Log automatic processing
            await supabase
              .from('lead_activities')
              .insert({
                lead_id: newLead.id,
                type: 'note',
                title: 'Automatisk offert skapad',
                description: `Offert ${processingResult.bookingNumber} skapades automatiskt`,
                completed: true,
                created_by: authResult.user.id
              });
          }
        }
      } catch (error) {
        console.error('Auto-processing error:', error);
        // Don't fail the lead creation if auto-processing fails
      }
    }

    return NextResponse.json({
      success: true,
      lead: transformedLead,
      message: 'Lead created successfully',
      offerCreated: offerResult?.success || false,
      offerNumber: offerResult?.bookingNumber
    }, { status: 201 });

  } catch (error: any) {
    console.error('Lead creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create lead',
      details: error.message
    }, { status: 500 });
  }
}