import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const isActive = searchParams.get('is_active')
    
    let query = supabase
      .from('onboarding_templates')
      .select(`
        *,
        onboarding_template_steps(*)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    
    if (department && department !== 'all') {
      query = query.eq('department', department)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching onboarding templates:', error)
      return NextResponse.json({ error: 'Failed to fetch onboarding templates' }, { status: 500 })
    }
    
    return NextResponse.json({ templates: data })
  } catch (error) {
    console.error('Error in onboarding templates GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { steps, ...templateData } = data
    
    // Create template
    const { data: template, error: templateError } = await supabase
      .from('onboarding_templates')
      .insert(templateData)
      .select()
      .single()
    
    if (templateError) {
      console.error('Error creating onboarding template:', templateError)
      return NextResponse.json({ error: 'Failed to create onboarding template' }, { status: 500 })
    }
    
    // Create template steps
    if (steps && steps.length > 0) {
      const templateSteps = steps.map((step: any) => ({
        ...step,
        template_id: template.id
      }))
      
      const { error: stepsError } = await supabase
        .from('onboarding_template_steps')
        .insert(templateSteps)
      
      if (stepsError) {
        console.error('Error creating template steps:', stepsError)
        return NextResponse.json({ error: 'Failed to create template steps' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ message: 'Onboarding template created successfully' })
  } catch (error) {
    console.error('Error in onboarding templates POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, steps, ...updateData } = data
    
    // Update template
    const { error: templateError } = await supabase
      .from('onboarding_templates')
      .update(updateData)
      .eq('id', id)
    
    if (templateError) {
      console.error('Error updating onboarding template:', templateError)
      return NextResponse.json({ error: 'Failed to update onboarding template' }, { status: 500 })
    }
    
    // Update steps if provided
    if (steps) {
      // Delete existing steps
      await supabase
        .from('onboarding_template_steps')
        .delete()
        .eq('template_id', id)
      
      // Insert new steps
      if (steps.length > 0) {
        const templateSteps = steps.map((step: any) => ({
          ...step,
          template_id: id
        }))
        
        const { error: stepsError } = await supabase
          .from('onboarding_template_steps')
          .insert(templateSteps)
        
        if (stepsError) {
          console.error('Error updating template steps:', stepsError)
          return NextResponse.json({ error: 'Failed to update template steps' }, { status: 500 })
        }
      }
    }
    
    return NextResponse.json({ message: 'Onboarding template updated successfully' })
  } catch (error) {
    console.error('Error in onboarding templates PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}