import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const processId = params.id
    
    const { data, error } = await supabase
      .from('onboarding_process_steps')
      .select('*')
      .eq('process_id', processId)
      .order('order_index')
    
    if (error) {
      console.error('Error fetching process steps:', error)
      return NextResponse.json({ error: 'Failed to fetch process steps' }, { status: 500 })
    }
    
    return NextResponse.json({ steps: data })
  } catch (error) {
    console.error('Error in process steps GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const processId = params.id
    const { stepId, ...updateData } = await request.json()
    
    const { error } = await supabase
      .from('onboarding_process_steps')
      .update(updateData)
      .eq('process_id', processId)
      .eq('step_id', stepId)
    
    if (error) {
      console.error('Error updating process step:', error)
      return NextResponse.json({ error: 'Failed to update process step' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Process step updated successfully' })
  } catch (error) {
    console.error('Error in process steps PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}