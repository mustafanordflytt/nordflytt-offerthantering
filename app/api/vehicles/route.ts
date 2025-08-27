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
    const type = searchParams.get('type')
    
    let query = supabase
      .from('fordon')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`registration_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching vehicles:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }
    
    return NextResponse.json({
      vehicles: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in vehicles GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    const { error } = await supabase
      .from('fordon')
      .insert(data)
    
    if (error) {
      console.error('Error creating vehicle:', error)
      return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Vehicle created successfully' })
  } catch (error) {
    console.error('Error in vehicles POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()
    const { id, ...updateData } = data
    
    const { error } = await supabase
      .from('fordon')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating vehicle:', error)
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Vehicle updated successfully' })
  } catch (error) {
    console.error('Error in vehicles PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}