import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    
    let query = supabase
      .from('onboarding_processes')
      .select(`
        *,
        anstallda_extended!inner(name, email, role, department),
        onboarding_templates(name, description)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`anstallda_extended.name.ilike.%${search}%,anstallda_extended.email.ilike.%${search}%`)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (department && department !== 'all') {
      query = query.eq('anstallda_extended.department', department)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching onboarding processes:', error)
      return NextResponse.json({ error: 'Failed to fetch onboarding processes' }, { status: 500 })
    }
    
    return NextResponse.json({
      processes: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in onboarding GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    // Create the onboarding process
    const { data: process, error: processError } = await supabase
      .from('onboarding_processes')
      .insert(data)
      .select()
      .single()
    
    if (processError) {
      console.error('Error creating onboarding process:', processError)
      return NextResponse.json({ error: 'Failed to create onboarding process' }, { status: 500 })
    }
    
    // Get template steps
    const { data: templateSteps, error: stepsError } = await supabase
      .from('onboarding_template_steps')
      .select('*')
      .eq('template_id', data.template_id)
      .order('order_index')
    
    if (stepsError) {
      console.error('Error fetching template steps:', stepsError)
      return NextResponse.json({ error: 'Failed to fetch template steps' }, { status: 500 })
    }
    
    // Create process steps from template
    const processSteps = templateSteps?.map(step => ({
      process_id: process.id,
      step_id: step.step_id,
      name: step.name,
      description: step.description,
      category: step.category,
      required: step.required,
      order_index: step.order_index,
      estimated_time: step.estimated_time,
      instructions: step.instructions,
      checklist: step.checklist,
      assigned_to: step.assigned_to
    })) || []
    
    if (processSteps.length > 0) {
      const { error: stepInsertError } = await supabase
        .from('onboarding_process_steps')
        .insert(processSteps)
      
      if (stepInsertError) {
        console.error('Error creating process steps:', stepInsertError)
        return NextResponse.json({ error: 'Failed to create process steps' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ message: 'Onboarding process created successfully' })
  } catch (error) {
    console.error('Error in onboarding POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('onboarding_processes')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating onboarding process:', error)
      return NextResponse.json({ error: 'Failed to update onboarding process' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Onboarding process updated successfully' })
  } catch (error) {
    console.error('Error in onboarding PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update process status and progress
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { processId, stepId, action, completedBy } = await request.json()
    
    if (action === 'complete_step') {
      // Complete a specific step
      const { error: stepError } = await supabase
        .from('onboarding_process_steps')
        .update({
          completed_date: new Date().toISOString().split('T')[0],
          completed_by: completedBy
        })
        .eq('process_id', processId)
        .eq('step_id', stepId)
      
      if (stepError) {
        console.error('Error completing step:', stepError)
        return NextResponse.json({ error: 'Failed to complete step' }, { status: 500 })
      }
      
      // Calculate new progress
      const { data: allSteps } = await supabase
        .from('onboarding_process_steps')
        .select('completed_date')
        .eq('process_id', processId)
      
      const completedSteps = allSteps?.filter(step => step.completed_date).length || 0
      const totalSteps = allSteps?.length || 0
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      
      // Update process progress and status
      const status = progress === 100 ? 'completed' : 'in_progress'
      const updateData: any = { progress, status }
      
      if (progress === 100) {
        updateData.actual_completion_date = new Date().toISOString().split('T')[0]
      }
      
      const { error: processError } = await supabase
        .from('onboarding_processes')
        .update(updateData)
        .eq('id', processId)
      
      if (processError) {
        console.error('Error updating process progress:', processError)
        return NextResponse.json({ error: 'Failed to update process progress' }, { status: 500 })
      }
      
      return NextResponse.json({ message: 'Step completed successfully', progress })
    }
    
    if (action === 'start_process') {
      const { error } = await supabase
        .from('onboarding_processes')
        .update({ status: 'in_progress' })
        .eq('id', processId)
      
      if (error) {
        console.error('Error starting process:', error)
        return NextResponse.json({ error: 'Failed to start process' }, { status: 500 })
      }
      
      return NextResponse.json({ message: 'Process started successfully' })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in onboarding PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}