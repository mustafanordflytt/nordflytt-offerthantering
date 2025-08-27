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
    if (!authResult.permissions.includes('leads:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const leadId = resolvedParams.id
    
    // Fetch lead with related data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        customer:customers(
          id,
          customer_name,
          customer_email,
          customer_phone,
          customer_type
        ),
        offer:offers(
          id,
          offer_id,
          total_price,
          status,
          expiry_date
        ),
        lead_activities(
          id,
          type,
          title,
          description,
          completed,
          completed_at,
          due_date,
          created_at,
          created_by
        ),
        lead_status_history(
          id,
          old_status,
          new_status,
          changed_by,
          reason,
          changed_at
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead fetch error:', leadError)
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Get assigned user details
    let assignedUser = null
    if (lead.assigned_to) {
      const { data: user } = await supabase
        .from('crm_users')
        .select('id, name, email')
        .eq('id', lead.assigned_to)
        .single()
      
      assignedUser = user
    }

    // Get activity creators
    const activityCreatorIds = [...new Set(lead.lead_activities?.map((a: any) => a.created_by).filter(Boolean) || [])]
    let activityCreators: Record<string, any> = {}
    
    if (activityCreatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('crm_users')
        .select('id, name')
        .in('id', activityCreatorIds)
      
      activityCreators = (creators || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})
    }

    // Transform lead data
    const transformedLead = {
      id: lead.id.toString(),
      name: lead.name || lead.customer?.customer_name || 'Unknown',
      email: lead.email || lead.customer?.customer_email || '',
      phone: lead.phone || lead.customer?.customer_phone || '',
      companyName: lead.company_name || null,
      source: lead.source || 'website',
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      estimatedValue: lead.estimated_value || 0,
      expectedCloseDate: lead.expected_close_date ? new Date(lead.expected_close_date) : null,
      assignedTo: assignedUser?.name || lead.assigned_to || null,
      assignedToDetails: assignedUser,
      notes: lead.notes || '',
      createdAt: new Date(lead.created_at),
      updatedAt: new Date(lead.updated_at || lead.created_at),
      leadScore: lead.lead_score || 0,
      tags: lead.tags || [],
      customerId: lead.customer_id,
      customer: lead.customer || null,
      offerId: lead.offer_id,
      offer: lead.offer || null,
      conversionDate: lead.conversion_date ? new Date(lead.conversion_date) : null,
      lostReason: lead.lost_reason || null,
      lastContactDate: lead.last_contact_date ? new Date(lead.last_contact_date) : null,
      followUpDate: lead.follow_up_date ? new Date(lead.follow_up_date) : null,
      activities: (lead.lead_activities || []).map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        completed: activity.completed,
        completedAt: activity.completed_at ? new Date(activity.completed_at) : null,
        dueDate: activity.due_date ? new Date(activity.due_date) : null,
        date: new Date(activity.created_at),
        createdBy: activityCreators[activity.created_by]?.name || 'System'
      })),
      statusHistory: (lead.lead_status_history || []).map((history: any) => ({
        id: history.id,
        oldStatus: history.old_status,
        newStatus: history.new_status,
        changedBy: history.changed_by,
        reason: history.reason,
        changedAt: new Date(history.changed_at)
      }))
    }

    // Calculate lead statistics
    const stats = {
      daysSinceCreation: Math.ceil((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      daysSinceLastContact: lead.last_contact_date 
        ? Math.ceil((Date.now() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      daysUntilFollowUp: lead.follow_up_date
        ? Math.ceil((new Date(lead.follow_up_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
      totalActivities: lead.lead_activities?.length || 0,
      completedActivities: lead.lead_activities?.filter((a: any) => a.completed).length || 0,
      statusChanges: lead.lead_status_history?.length || 0
    }

    return NextResponse.json({
      lead: transformedLead,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in lead details API:', error)
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
    if (!authResult.permissions.includes('leads:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const leadId = resolvedParams.id
    const body = await request.json()
    
    // Get current lead
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()
    
    if (fetchError || !currentLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
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
    if (body.companyName !== undefined) updateData.company_name = body.companyName
    if (body.source !== undefined) updateData.source = body.source
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.estimatedValue !== undefined) updateData.estimated_value = body.estimatedValue
    if (body.expectedCloseDate !== undefined) updateData.expected_close_date = body.expectedCloseDate
    if (body.assignedTo !== undefined) updateData.assigned_to = body.assignedTo
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.followUpDate !== undefined) updateData.follow_up_date = body.followUpDate
    if (body.lostReason !== undefined) updateData.lost_reason = body.lostReason
    
    // Update lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Lead update error:', updateError)
      throw updateError
    }

    // Log assignment change
    if (body.assignedTo !== undefined && body.assignedTo !== currentLead.assigned_to) {
      await supabase
        .from('lead_assignments')
        .insert({
          lead_id: parseInt(leadId),
          assigned_to: body.assignedTo,
          assigned_by: authResult.user.id,
          reason: body.assignmentReason || 'Manual assignment'
        })
    }

    // Update last contact date if adding activity
    if (body.activity) {
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: parseInt(leadId),
          type: body.activity.type || 'note',
          title: body.activity.title,
          description: body.activity.description,
          completed: body.activity.completed || false,
          due_date: body.activity.dueDate || null,
          created_by: authResult.user.id
        })

      // Update last contact date
      await supabase
        .from('leads')
        .update({ last_contact_date: new Date().toISOString() })
        .eq('id', leadId)
    }

    // Transform response
    const transformedLead = {
      id: updatedLead.id.toString(),
      name: updatedLead.name,
      email: updatedLead.email || '',
      phone: updatedLead.phone || '',
      source: updatedLead.source,
      status: updatedLead.status,
      priority: updatedLead.priority,
      estimatedValue: updatedLead.estimated_value,
      expectedCloseDate: updatedLead.expected_close_date ? new Date(updatedLead.expected_close_date) : null,
      assignedTo: updatedLead.assigned_to,
      notes: updatedLead.notes || '',
      updatedAt: new Date(updatedLead.updated_at)
    }
    
    return NextResponse.json({
      lead: transformedLead,
      message: 'Lead updated successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in lead update:', error)
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
    if (!authResult.permissions.includes('leads:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const leadId = resolvedParams.id
    
    // Check if lead exists
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', leadId)
      .single()
    
    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deletion of converted leads
    if (lead.status === 'closed_won') {
      return NextResponse.json(
        { error: 'Cannot delete converted leads' },
        { status: 400 }
      )
    }
    
    // Delete lead (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
    
    if (deleteError) {
      console.error('Lead deletion error:', deleteError)
      throw deleteError
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Lead deleted successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in lead deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}